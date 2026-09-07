/** Reusable confirm, wizard, timeout, and analytics conversation patterns. */

import type { ConversationBuilder } from '@grammyjs/conversations';
import { InlineKeyboard } from 'grammy';
import { ConversationAnalyticsService } from '#root/services/conversation-analytics.service.js';
import type { BotContext, BotConversationContext } from '../context.js';
import type { BotConversation } from './example.conversation.js';

export const DEFAULT_CONVERSATION_TIMEOUT_MS = 10 * 60 * 1000;

export interface TextInputOptions {
  timeoutMs?: number;
  backValues?: readonly string[];
  cancelValues?: readonly string[];
  invalidMessage?: string;
}

export type TextInputResult =
  | { action: 'back'; ctx: BotConversationContext }
  | { action: 'cancel'; ctx: BotConversationContext }
  | { action: 'value'; ctx: BotConversationContext; value: string };

function normalizeCommands(values: readonly string[]): Set<string> {
  return new Set(values.map((value) => value.trim().toLocaleLowerCase()));
}

/** Wait for text while recognizing reusable back and cancel controls. */
export async function waitForTextInput(
  conversation: BotConversation,
  options: TextInputOptions = {},
): Promise<TextInputResult> {
  const backValues = normalizeCommands(options.backValues ?? ['/back', 'back']);
  const cancelValues = normalizeCommands(options.cancelValues ?? ['/cancel', 'cancel']);

  while (true) {
    const nextCtx = await conversation.wait({
      maxMilliseconds: options.timeoutMs ?? DEFAULT_CONVERSATION_TIMEOUT_MS,
    });
    const text = nextCtx.message?.text?.trim();
    if (!text) {
      if (options.invalidMessage) await nextCtx.reply(options.invalidMessage);
      continue;
    }

    const normalized = text.toLocaleLowerCase();
    if (cancelValues.has(normalized)) return { action: 'cancel', ctx: nextCtx };
    if (backValues.has(normalized)) return { action: 'back', ctx: nextCtx };
    return { action: 'value', ctx: nextCtx, value: text };
  }
}

export interface ConfirmDialogOptions {
  yesLabel?: string;
  noLabel?: string;
  cancelLabel?: string;
  timeoutMs?: number;
}

/** Display an inline confirmation dialog; null means the user cancelled. */
export async function confirmDialog(
  conversation: BotConversation,
  ctx: BotConversationContext,
  question: string,
  options: ConfirmDialogOptions = {},
): Promise<boolean | null> {
  const keyboard = new InlineKeyboard()
    .text(options.yesLabel ?? 'Yes', 'conversation:confirm:yes')
    .text(options.noLabel ?? 'No', 'conversation:confirm:no')
    .row()
    .text(options.cancelLabel ?? 'Cancel', 'conversation:confirm:cancel');

  await ctx.reply(question, { reply_markup: keyboard });
  while (true) {
    const nextCtx = await conversation.wait({
      maxMilliseconds: options.timeoutMs ?? DEFAULT_CONVERSATION_TIMEOUT_MS,
    });
    const data = nextCtx.callbackQuery?.data;
    if (!data?.startsWith('conversation:confirm:')) continue;

    await nextCtx.answerCallbackQuery();
    const answer = data.slice('conversation:confirm:'.length);
    if (answer === 'yes') return true;
    if (answer === 'no') return false;
    if (answer === 'cancel') return null;
  }
}

export interface FormWizardStep {
  key: string;
  prompt: string | ((values: Readonly<Record<string, string>>) => string | Promise<string>);
  validate?: (
    value: string,
    values: Readonly<Record<string, string>>,
  ) => true | string | Promise<true | string>;
  transform?: (value: string) => string | Promise<string>;
}

export interface FormWizardOptions extends TextInputOptions {
  cancelledMessage?: string;
  firstStepBackMessage?: string;
}

export type FormWizardResult =
  | { status: 'cancelled'; values: Record<string, string> }
  | { status: 'completed'; values: Record<string, string> };

async function resolveStepPrompt(
  step: FormWizardStep,
  values: Readonly<Record<string, string>>,
): Promise<string> {
  return typeof step.prompt === 'function' ? step.prompt(values) : step.prompt;
}

async function moveToPreviousStep(
  index: number,
  ctx: BotConversationContext,
  firstStepMessage?: string,
): Promise<number> {
  if (index > 0) return index - 1;
  if (firstStepMessage) await ctx.reply(firstStepMessage);
  return index;
}

async function captureStepValue(
  step: FormWizardStep,
  input: Extract<TextInputResult, { action: 'value' }>,
  values: Record<string, string>,
): Promise<boolean> {
  const validation = await step.validate?.(input.value, values);
  if (validation !== undefined && validation !== true) {
    await input.ctx.reply(validation);
    return false;
  }

  values[step.key] = step.transform ? await step.transform(input.value) : input.value;
  return true;
}

/** Run a text form with validation and built-in `/back` and `/cancel` navigation. */
export async function runFormWizard(
  conversation: BotConversation,
  initialCtx: BotConversationContext,
  steps: readonly FormWizardStep[],
  options: FormWizardOptions = {},
): Promise<FormWizardResult> {
  const values: Record<string, string> = {};
  let ctx = initialCtx;
  let index = 0;

  while (index < steps.length) {
    const step = steps[index];
    if (!step) break;

    await ctx.reply(await resolveStepPrompt(step, values));
    const input = await waitForTextInput(conversation, options);
    ctx = input.ctx;

    if (input.action === 'cancel') {
      if (options.cancelledMessage) await ctx.reply(options.cancelledMessage);
      return { status: 'cancelled', values };
    }
    if (input.action === 'back') {
      index = await moveToPreviousStep(index, ctx, options.firstStepBackMessage);
      continue;
    }
    if (await captureStepValue(step, input, values)) index += 1;
  }

  return { status: 'completed', values };
}

/** Mark a normally returned conversation as complete without replaying the DB write. */
export function withConversationAnalytics(
  id: string,
  builder: ConversationBuilder<BotContext, BotConversationContext>,
): ConversationBuilder<BotContext, BotConversationContext> {
  return async (conversation, ctx, ...args) => {
    await builder(conversation, ctx, ...args);
    if (!ctx.from || !ctx.chat) return;

    await conversation.external(() =>
      ConversationAnalyticsService.complete(ctx.from?.id ?? 0, ctx.chat?.id ?? 0, id),
    );
  };
}

/** Hook for the conversations plugin's `onEnter` lifecycle event. */
export async function trackConversationEnter(id: string, ctx: BotContext): Promise<void> {
  if (!ctx.from || !ctx.chat) return;
  await ConversationAnalyticsService.start(ctx.from.id, ctx.chat.id, id);
}

/** Hook for manual exits and inactivity halts. */
export async function trackConversationExit(id: string, ctx: BotContext): Promise<void> {
  if (!ctx.from || !ctx.chat) return;
  await ConversationAnalyticsService.cancel(ctx.from.id, ctx.chat.id, id);
}
