/**
 * Session Middleware
 *
 * Configures grammY's session middleware backed by Redis
 * via `@grammyjs/storage-redis`. Session data persists across
 * bot restarts and scales across multiple bot instances.
 *
 * Uses a multi-key strategy to store conversation data separately
 * from regular session data (required by @grammyjs/conversations).
 *
 * Redis key format:
 *   session:{chatId}:{userId}     — Regular session data
 *   conversation:{chatId}:{userId} — Conversation state
 *   session:inline:{userId}        — Inline-mode preferences
 */

import { RedisAdapter } from '@grammyjs/storage-redis';
import { session } from 'grammy';
import type { Context, MiddlewareFn } from 'grammy';
import { redis } from '#root/cache/index.js';
import type { BotContext, SessionData } from '../context.js';

/**
 * Initial session data factory.
 * Returns a fresh, empty session for new users.
 */
function initialSessionData(): SessionData {
  return {};
}

/**
 * Generates a Redis key from the chat ID and user ID.
 * Inline queries have no chat, so they use a user-scoped `inline:` key.
 * Falls back to the chat ID alone if no user is present (channel posts).
 *
 * Uses `Context` (not `BotContext`) as the parameter type because
 * grammY's session middleware passes `Omit<BotContext, 'session'>` to
 * `getSessionKey` — the session property doesn't exist yet at that point.
 */
function getSessionKey(ctx: Omit<Context, 'session'>): string | undefined {
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;
  if (!chatId) return userId && ctx.inlineQuery ? `inline:${userId}` : undefined;
  return userId ? `${chatId}:${userId}` : `${chatId}`;
}

/**
 * Creates the session middleware with Redis-backed storage
 * using a multi-key strategy.
 *
 * The multi-key strategy separates `session` data from `conversation`
 * data in Redis, which is required for the conversations plugin to
 * function correctly. Each key type uses its own RedisAdapter with
 * a distinct prefix and TTL.
 */
export function createSessionMiddleware(): MiddlewareFn<BotContext> {
  return session({
    type: 'multi',
    custom: {
      initial: initialSessionData,
      storage: new RedisAdapter<SessionData>({
        instance: redis,
        ttl: 60 * 60 * 24 * 7, // 7 days TTL for session data
      }),
      getSessionKey,
    },
    conversation: {
      // Conversation plugin manages its own initial data
      storage: new RedisAdapter<unknown>({
        instance: redis,
        ttl: 60 * 60 * 24 * 1, // 1 day TTL for conversation state
      }),
      getSessionKey,
    },
  });
}
