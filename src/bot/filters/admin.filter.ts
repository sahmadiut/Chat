/**
 * Admin Filter / Guard
 *
 * Middleware guard that restricts handler access to admin users only.
 * Checks if the sender's Telegram ID is in the admin list
 * (ADMIN_CHAT_ID + ADMIN_IDS).
 *
 * Usage:
 *   import { isAdmin } from '#root/bot/filters/admin.filter.js';
 *
 *   // Protect a command:
 *   bot.command('broadcast', isAdmin, broadcastHandler);
 *
 *   // Protect a whole composer:
 *   adminComposer.use(isAdmin);
 */

import type { Middleware } from 'grammy';
import { getAdminIds } from '#root/config/env.js';
import { createLogger } from '#root/utils/logger.js';
import type { BotContext } from '../context.js';

const log = createLogger('AdminFilter');

/** Cached set of admin IDs for O(1) lookups */
const adminSet = new Set(getAdminIds());

/**
 * Guard middleware that only allows admin users to proceed.
 * Non-admin users receive a silent drop (no response).
 */
export const isAdmin: Middleware<BotContext> = async (ctx, next) => {
  const userId = ctx.from?.id;

  if (!userId) {
    log.debug('Update has no sender — blocking');
    return;
  }

  if (!adminSet.has(userId)) {
    log.debug({ userId }, 'Non-admin user attempted restricted action — blocking');
    return;
  }

  await next();
};

/**
 * Check if a user ID is an admin.
 * Useful for conditional logic outside of middleware.
 */
export function isAdminUser(userId: number): boolean {
  return adminSet.has(userId);
}
