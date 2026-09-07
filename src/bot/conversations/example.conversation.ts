/**
 * Example Conversation
 *
 * Demonstrates the multi-step conversation pattern using
 * `@grammyjs/conversations`. This serves as a skeleton for
 * building real form-based or wizard-style interactions.
 *
 * Usage:
 *   // Register in bot.ts:
 *   bot.use(createConversation(exampleConversation, { id: 'example' }));
 *
 *   // Enter from a handler:
 *   bot.command('example', async (ctx) => {
 *     await ctx.conversation.enter('example');
 *   });
 */

import type { Conversation } from '@grammyjs/conversations';
import type { BotContext, BotConversationContext } from '../context.js';

/**
 * Type alias for conversations using our dual-context pattern.
 * - First type param (OC): The outer context type (BotContext) — used for storage etc.
 * - Second type param (C): The inner context type (BotConversationContext) — what the conversation receives.
 */
export type BotConversation = Conversation<BotContext, BotConversationContext>;

/**
 * Example multi-step conversation.
 *
 * Flow:
 * 1. Ask for the user's name
 * 2. Ask for confirmation
 * 3. Process the result
 *
 * Important: Always use `conversation.wait()` to pause for user input.
 * The `ctx` parameter is only valid for the current step — after a
 * `wait()` call, use the newly returned context.
 */
export async function exampleConversation(
  conversation: BotConversation,
  ctx: BotConversationContext,
): Promise<void> {
  // Step 1: Ask for name
  await ctx.reply(ctx.t('example-ask-name'));
  const nameCtx = await conversation.waitFor('message:text');
  const name = nameCtx.message.text;

  // Step 2: Confirm
  await nameCtx.reply(ctx.t('example-confirm', { name }));
  const confirmCtx = await conversation.waitFor('message:text');
  const confirmed = confirmCtx.message.text.toLowerCase();

  // Step 3: Process
  if (confirmed === 'yes' || confirmed === 'y') {
    await confirmCtx.reply(ctx.t('example-success', { name }));
  } else {
    await confirmCtx.reply(ctx.t('example-cancelled'));
  }
}
