/**
 * Rate Limiter Middleware
 *
 * Prevents individual users from spamming the bot by limiting
 * the number of updates processed per user within a time window.
 *
 * Uses `@grammyjs/ratelimiter` which applies per-user rate limiting
 * at the middleware level (before handlers execute).
 */

import { limit } from '@grammyjs/ratelimiter';
import type { Middleware } from 'grammy';
import { createLogger } from '#root/utils/logger.js';
import type { BotContext } from '../context.js';

const log = createLogger('RateLimiter');

/**
 * Creates the rate limiter middleware.
 *
 * Default config: max 3 messages per 2 seconds per user.
 * Exceeding the limit silently drops the update (no error to the user).
 */
export function createRateLimiterMiddleware(): Middleware<BotContext> {
  return limit({
    // Time window in milliseconds
    timeFrame: 2000,
    // Maximum number of updates allowed in the time window
    limit: 3,
    // Called when a user exceeds the rate limit
    onLimitExceeded: async (ctx) => {
      log.warn(
        { userId: ctx.from?.id, chatId: ctx.chat?.id },
        'User exceeded rate limit — update dropped',
      );
    },
    // Use the user ID as the rate limit key
    keyGenerator: (ctx) => ctx.from?.id.toString(),
  });
}
