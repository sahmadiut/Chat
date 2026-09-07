/**
 * Smart Auto-Upsert Middleware
 *
 * Global middleware that automatically captures the User and Chat objects
 * from every incoming Telegram update and upserts them into PostgreSQL.
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  PERFORMANCE OPTIMIZATION — Redis Debounce Cache                │
 * │                                                                  │
 * │  To avoid hitting the database on EVERY message from the same    │
 * │  user, a Redis flag is set after each successful upsert with a   │
 * │  TTL of 5 minutes. Subsequent messages within that window skip   │
 * │  the database entirely.                                          │
 * │                                                                  │
 * │  EXCEPTION: /start commands ALWAYS bypass the cache and force    │
 * │  a direct PostgreSQL upsert to guarantee perfect data capture    │
 * │  on first interaction.                                           │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * Error Handling:
 * - Upsert failures are logged at CRITICAL (fatal) level
 * - Errors NEVER crash the update pipeline — next() is always called
 */

import type { Middleware } from 'grammy';
import type { Chat as TelegramChat, User as TelegramUser } from 'grammy/types';
import { cacheHasFlag, cacheSetFlag } from '#root/cache/utils.js';
import { ChatService } from '#root/services/chat.service.js';
import { UserService } from '#root/services/user.service.js';
import { createLogger } from '#root/utils/logger.js';
import type { BotContext } from '../context.js';

const log = createLogger('UpsertMiddleware');

/** Redis key prefix for user upsert debounce flags */
const USER_UPSERT_FLAG_PREFIX = 'bot:upsert:user:';

/** Redis key prefix for chat upsert debounce flags */
const CHAT_UPSERT_FLAG_PREFIX = 'bot:upsert:chat:';

/** Debounce TTL in seconds (5 minutes) */
const UPSERT_DEBOUNCE_TTL = 300;

/**
 * Detects whether the current update is a /start command.
 */
function isStartCommand(ctx: BotContext): boolean {
  const text = ctx.message?.text;
  if (!text) return false;
  return text === '/start' || text.startsWith('/start ');
}

/**
 * Determines whether a user upsert should be performed, and if so, executes it.
 * Extracted to reduce cognitive complexity of the main middleware function.
 */
async function handleUserUpsert(telegramUser: TelegramUser, forceUpsert: boolean): Promise<void> {
  const userFlagKey = `${USER_UPSERT_FLAG_PREFIX}${telegramUser.id}`;

  // If not a forced upsert, check the debounce cache
  if (!forceUpsert) {
    const recentlyUpserted = await cacheHasFlag(userFlagKey);
    if (recentlyUpserted) {
      // Skip full upsert, but update last online timestamp
      await UserService.updateLastOnline(telegramUser.id);
      return;
    }
  }

  try {
    await UserService.upsert(telegramUser);
    await cacheSetFlag(userFlagKey, UPSERT_DEBOUNCE_TTL);

    if (forceUpsert) {
      log.info(
        { telegramId: telegramUser.id },
        '/start detected — forced user upsert (cache bypassed)',
      );
    }
  } catch (err) {
    // ⚠️ CRITICAL: Database insertion error — log at fatal level
    log.fatal(
      {
        err,
        telegramId: telegramUser.id,
        firstName: telegramUser.first_name,
        username: telegramUser.username,
        wasStartCommand: forceUpsert,
      },
      'CRITICAL: Failed to upsert user to database',
    );
  }
}

/**
 * Determines whether a chat upsert should be performed, and if so, executes it.
 * Extracted to reduce cognitive complexity of the main middleware function.
 */
async function handleChatUpsert(telegramChat: TelegramChat, forceUpsert: boolean): Promise<void> {
  const chatFlagKey = `${CHAT_UPSERT_FLAG_PREFIX}${telegramChat.id}`;

  if (!forceUpsert) {
    const recentlyUpserted = await cacheHasFlag(chatFlagKey);
    if (recentlyUpserted) return;
  }

  try {
    await ChatService.upsert(telegramChat);
    await cacheSetFlag(chatFlagKey, UPSERT_DEBOUNCE_TTL);
  } catch (err) {
    log.fatal(
      {
        err,
        telegramId: telegramChat.id,
        type: telegramChat.type,
        wasStartCommand: forceUpsert,
      },
      'CRITICAL: Failed to upsert chat to database',
    );
  }
}

/**
 * Creates the auto-upsert middleware.
 *
 * Flow:
 * 1. Extract `from` (User) and `chat` (Chat) from the update
 * 2. If /start command → ALWAYS force DB upsert (skip cache check)
 * 3. Otherwise → check Redis debounce flag
 *    - Flag EXISTS → skip DB write (recent upsert already happened)
 *    - Flag MISSING → perform upsert, then set the debounce flag
 * 4. Errors are caught and logged critically, but never block the pipeline
 * 5. Call next() regardless of outcome
 */
export function createUpsertMiddleware(): Middleware<BotContext> {
  return async (ctx, next) => {
    try {
      const forceUpsert = isStartCommand(ctx);

      if (ctx.from) {
        await handleUserUpsert(ctx.from, forceUpsert);
      }

      if (ctx.chat) {
        await handleChatUpsert(ctx.chat, forceUpsert);
      }
    } catch (err) {
      // Outer catch — unexpected errors in the middleware itself
      log.fatal({ err }, 'CRITICAL: Upsert middleware encountered an unexpected error');
    }

    // ALWAYS proceed to the next middleware — never block the pipeline
    await next();
  };
}
