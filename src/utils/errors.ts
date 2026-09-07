/**
 * Custom Error Classes & Global Error Handler
 *
 * Provides a hierarchy of typed errors for different failure domains
 * (database, cache, bot) and a centralized handler that logs errors
 * and optionally alerts admins via Telegram.
 */

import { Api } from 'grammy';
import { env } from '#root/config/env.js';
import { createLogger } from '#root/utils/logger.js';

const log = createLogger('ErrorHandler');

// ─── Custom Error Classes ────────────────────────────────────────────

/**
 * Base application error.
 * All custom errors extend this so callers can distinguish operational
 * errors (expected, handled) from programmer bugs.
 */
export class AppError extends Error {
  /** Whether this error is an expected operational failure */
  public readonly isOperational: boolean;

  /** Optional HTTP-like status code for categorization */
  public readonly statusCode: number;

  constructor(
    message: string,
    options: { statusCode?: number; isOperational?: boolean; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = this.constructor.name;
    this.statusCode = options.statusCode ?? 500;
    this.isOperational = options.isOperational ?? true;

    // Maintain proper stack trace in V8 engines
    Error.captureStackTrace(this, this.constructor);
  }
}

/** Error originating from database operations */
export class DatabaseError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, { statusCode: 503, isOperational: true, cause });
  }
}

/** Error originating from Redis / cache operations */
export class CacheError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, { statusCode: 503, isOperational: true, cause });
  }
}

/** Error originating from Telegram Bot API interactions */
export class BotError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, { statusCode: 502, isOperational: true, cause });
  }
}

// ─── Global Error Handler ────────────────────────────────────────────

export interface RecordedError {
  timestamp: string;
  message: string;
  name: string;
  isOperational: boolean;
  context?: Record<string, unknown>;
}

const recentErrorsBuffer: RecordedError[] = [];
const MAX_RECENT_ERRORS = 30;

/**
 * Get the in-memory circular buffer of recent errors.
 */
export function getRecentErrors(limit = 10): RecordedError[] {
  return recentErrorsBuffer.slice(-limit).reverse();
}

/**
 * Centralized error handler used by the bot's `bot.catch()` and
 * any other top-level error boundary.
 *
 * - Logs the full error with context using Pino.
 * - Records error into recent errors buffer for admin review.
 * - Sends a Telegram message to `ADMIN_CHAT_ID` with error details.
 * - Falls back to logging only if the Telegram alert fails.
 * - Never throws — this is a fire-and-forget handler.
 *
 * @param err - The error that was caught
 * @param context - Optional contextual info (e.g., update ID, user ID)
 */
export async function handleGlobalError(
  err: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  const error = err instanceof Error ? err : new Error(String(err));
  const isOperational = err instanceof AppError ? err.isOperational : false;

  // ── Record in recent errors buffer ──
  recentErrorsBuffer.push({
    timestamp: new Date().toISOString(),
    message: error.message,
    name: error.name,
    isOperational,
    context,
  });
  if (recentErrorsBuffer.length > MAX_RECENT_ERRORS) {
    recentErrorsBuffer.shift();
  }

  // ── Log the error ──
  log.error(
    {
      err: error,
      isOperational,
      ...context,
    },
    `Unhandled error: ${error.message}`,
  );

  // ── Alert admin via Telegram ──
  try {
    const api = new Api(env.BOT_TOKEN);
    const timestamp = new Date().toISOString();
    const contextStr = context ? `\n\n📋 Context:\n${JSON.stringify(context, null, 2)}` : '';

    const message = [
      '🚨 <b>Bot Error Alert</b>',
      '',
      `⏰ <b>Time:</b> <code>${timestamp}</code>`,
      `❌ <b>Error:</b> <code>${escapeHtml(error.message)}</code>`,
      `🔧 <b>Type:</b> <code>${error.name}</code>`,
      `⚙️ <b>Operational:</b> ${isOperational ? 'Yes' : 'No'}`,
      contextStr ? `\n📋 <b>Context:</b>\n<pre>${escapeHtml(contextStr)}</pre>` : '',
    ]
      .filter(Boolean)
      .join('\n');

    await api.sendMessage(env.ADMIN_CHAT_ID, message, {
      parse_mode: 'HTML',
    });
  } catch (alertErr) {
    // If we can't alert the admin via Telegram, at least log that failure
    log.warn(
      { err: alertErr },
      'Failed to send error alert to admin via Telegram — falling back to logs only',
    );
  }
}

// ─── Utilities ───────────────────────────────────────────────────────

/** Escape HTML special characters for Telegram HTML parse mode */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
