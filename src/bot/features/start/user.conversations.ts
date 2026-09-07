/**
 * User Conversations
 *
 * Interactive multi-step conversations for regular users:
 * 1. Support Conversation — User types a message, bot forwards to ADMIN_CHAT_ID and confirms.
 * 2. Edit Profile Name Conversation — User types new name and bot updates DB.
 */

import type { BotConversation } from '#root/bot/conversations/example.conversation.js';
import { env } from '#root/config/env.js';
import { UserService } from '#root/services/user.service.js';
import { createLogger } from '#root/utils/logger.js';
import type { BotConversationContext } from '../../context.js';
import { createSupportAdminKeyboard } from './start.keyboard.js';
import { escapeHtml } from './start.presentation.js';

const log = createLogger('SupportConversation');

/**
 * Returns true if the given text is a bot command or a known reply-keyboard menu button.
 * Used inside conversations to detect when the user has "navigated away".
 */
function isNavigationInput(text: string | undefined): boolean {
  if (!text) return false;
  // Bot commands (e.g. /start, /help, /profile, /support, /about, /settings, /admin, /cancel)
  if (/^\/\w+/.test(text)) return true;
  // Reply keyboard buttons (EN & FA variants)
  const menuLabels = [
    /^📋/, // Help
    /^👤/, // My Profile / پروفایل من
    /^📞/, // Support / پشتیبانی
    /^ℹ️/, // About / درباره ربات
    /^⚙️/, // Settings / تنظیمات
    /^🛡/, // Admin panel
    /^🏠/, // Main menu / منوی اصلی
    /^🧭/, // Help & support
  ];
  return menuLabels.some((re) => re.test(text.trim()));
}

/**
 * Support Conversation
 * User sends a message -> Forwarded to ADMIN_CHAT_ID -> Confirmation sent to user.
 * If the user sends a command or taps a menu button, the conversation is halted
 * and the update is passed through to the normal middleware handlers.
 */
export async function supportConversation(
  conversation: BotConversation,
  ctx: BotConversationContext,
): Promise<void> {
  const promptText = ctx.t('support-intro');
  await ctx.reply(promptText, { parse_mode: 'HTML' });

  // Wait for a real user message (text/photo/document) that is NOT a navigation input.
  // If the user sends a command or taps a menu button instead, halt the conversation
  // so the normal middleware handlers can process it.
  const inputCtx = await conversation.waitUntil(
    (c) =>
      (c.message?.text !== undefined ||
        c.message?.photo !== undefined ||
        c.message?.document !== undefined) &&
      !isNavigationInput(c.message?.text),
    {
      otherwise: async () => {
        await conversation.halt({ next: true });
      },
    },
  );

  const user = inputCtx.from;
  if (!user) return;

  const adminAlertText = ctx.t('support-admin-forward', {
    name: escapeHtml(user.first_name + (user.last_name ? ` ${user.last_name}` : '')),
    id: user.id.toString(),
    username: user.username ? `@${user.username}` : ctx.t('user-profile-none'),
  });

  const userMessageId = inputCtx.message?.message_id;

  const adminKeyboard = createSupportAdminKeyboard({
    viewUser: ctx.t('support-admin-btn-view-user'),
    reply: ctx.t('support-admin-btn-reply'),
    ban: ctx.t('support-admin-btn-ban'),
    userId: user.id,
    messageId: userMessageId,
  });

  try {
    await conversation.external(async () => {
      // 1. Send the metadata header message with actionable admin buttons
      await ctx.api.sendMessage(env.ADMIN_CHAT_ID, adminAlertText, {
        parse_mode: 'HTML',
        reply_markup: adminKeyboard,
      });

      // 2. Forward the user's message as-is (supports text, photo, voice, document, media group, etc.)
      if (inputCtx.message) {
        const messageId = inputCtx.message.message_id;
        try {
          await ctx.api.forwardMessage(env.ADMIN_CHAT_ID, user.id, messageId);
        } catch (forwardErr: unknown) {
          log.warn(
            { err: forwardErr, userId: user.id, messageId },
            'Forward failed, attempting to copy message',
          );
          try {
            await ctx.api.copyMessage(env.ADMIN_CHAT_ID, user.id, messageId);
          } catch (copyErr: unknown) {
            const errDescription =
              (copyErr as { description?: string })?.description ??
              (copyErr as Error)?.message ??
              'Unknown error';
            log.error(
              { err: copyErr, userId: user.id, messageId },
              'Both forward and copy message failed',
            );
            await ctx.api.sendMessage(
              env.ADMIN_CHAT_ID,
              ctx.t('support-admin-msg-failed', {
                error: escapeHtml(errDescription),
              }),
              { parse_mode: 'HTML' },
            );
          }
        }
      }
    });

    await inputCtx.reply(ctx.t('support-sent-success'), { parse_mode: 'HTML' });
  } catch (err) {
    await inputCtx.reply(ctx.t('error-generic'));
  }
}

/**
 * Edit User Name Conversation
 */
export async function editProfileNameConversation(
  conversation: BotConversation,
  ctx: BotConversationContext,
): Promise<void> {
  await ctx.reply(ctx.t('user-profile-edit-name-prompt'), { parse_mode: 'HTML' });

  const inputCtx = await conversation.waitFor('message:text');
  const text = inputCtx.message?.text?.trim();

  if (!text || text === '/cancel' || isNavigationInput(text)) {
    await inputCtx.reply(ctx.t('example-cancelled'));
    return;
  }

  const userId = inputCtx.from?.id;
  if (!userId) return;

  await conversation.external(async () => {
    const existing = await UserService.findByTelegramId(userId);
    if (existing) {
      await UserService.upsert({
        id: userId,
        first_name: text,
        last_name: existing.lastName ?? undefined,
        username: existing.username ?? undefined,
        is_bot: false,
      });
    }
  });

  await inputCtx.reply(ctx.t('user-profile-edit-name-success', { name: escapeHtml(text) }), {
    parse_mode: 'HTML',
  });
}
