/**
 * Ban Guard Middleware
 *
 * Checks if the sender user has been banned by an admin.
 * If banned, halts the update silently or alerts the user if interactive.
 */

import type { Middleware } from 'grammy';
import { UserService } from '#root/services/user.service.js';
import { createLogger } from '#root/utils/logger.js';
import type { BotContext } from '../context.js';
import { isAdminUser } from '../filters/admin.filter.js';

const log = createLogger('BanGuardMiddleware');

async function handleBannedUserResponse(ctx: BotContext, banReason?: string | null): Promise<void> {
  const baseAlert = ctx.t('banned-user-alert');
  if (ctx.callbackQuery) {
    const text = banReason ? `${baseAlert}\n\n${banReason}` : baseAlert;
    await ctx.answerCallbackQuery({ text, show_alert: true });
    return;
  }

  if (ctx.message) {
    const text = banReason
      ? `${baseAlert}\n\n${ctx.t('user-profile-ban-reason', { reason: escapeHtml(banReason) })}`
      : baseAlert;
    await ctx.reply(text, { parse_mode: 'HTML' });
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function createBanGuardMiddleware(): Middleware<BotContext> {
  return async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId || isAdminUser(userId)) {
      return next();
    }

    const user = await UserService.findByTelegramId(userId);
    if (!user?.isBanned) {
      return next();
    }

    log.debug({ userId, reason: user.banReason }, 'Blocked banned user update');
    await handleBannedUserResponse(ctx, user.banReason);
  };
}
