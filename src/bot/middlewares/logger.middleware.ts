/**
 * Action Logger Middleware
 *
 * Intercepts incoming updates and logs meaningful user interactions
 * both to the structured Pino logger and to the PostgreSQL messages table
 * for analytics and auditing.
 *
 * This replaces file-based per-user logging with database-backed structured
 * logging that supports querying by user, type, time range, etc.
 */

import type { Middleware } from 'grammy';
import { MessageService } from '#root/services/message.service.js';
import { createLogger, createUserLogger } from '#root/utils/logger.js';
import type { BotContext } from '../context.js';

const log = createLogger('ActionLogger');

/**
 * Classify an incoming update into a message type and extract content/payload.
 */
function classifyUpdate(ctx: BotContext): {
  type:
    | 'command'
    | 'text_message'
    | 'callback_query'
    | 'inline_query'
    | 'photo_message'
    | 'document_message'
    | 'video_message'
    | 'voice_message'
    | 'sticker_message'
    | 'location_message'
    | 'contact_message'
    | 'other';
  content?: string;
  payload?: string;
} {
  if (ctx.message?.text) {
    const isCommand = ctx.message.text.startsWith('/');
    return {
      type: isCommand ? 'command' : 'text_message',
      content: ctx.message.text,
    };
  }
  if (ctx.callbackQuery) {
    return {
      type: 'callback_query',
      payload: ctx.callbackQuery.data,
    };
  }
  if (ctx.inlineQuery) {
    return {
      type: 'inline_query',
      payload: ctx.inlineQuery.query,
    };
  }
  if (ctx.message?.photo) return { type: 'photo_message' };
  if (ctx.message?.document) return { type: 'document_message' };
  if (ctx.message?.video) return { type: 'video_message' };
  if (ctx.message?.voice) return { type: 'voice_message' };
  if (ctx.message?.sticker) return { type: 'sticker_message' };
  if (ctx.message?.location) return { type: 'location_message' };
  if (ctx.message?.contact) return { type: 'contact_message' };

  return { type: 'other' };
}

export function createLoggerMiddleware(): Middleware<BotContext> {
  return async (ctx, next) => {
    const userId = ctx.from?.id;
    const chatId = ctx.chat?.id;

    const { type, content, payload } = classifyUpdate(ctx);

    if (type !== 'other' && userId) {
      // Log via Pino for real-time monitoring (app-level log)
      log.info({ userId, chatId, type, payload: payload ?? content }, 'User interaction');

      // Log to per-user file for easy per-user auditing
      const userLog = createUserLogger(userId);
      userLog.info({ chatId, type, payload: payload ?? content }, 'User interaction');

      // Log to database for analytics (non-blocking)
      MessageService.logIncoming({
        userId,
        chatId,
        telegramMessageId: ctx.message?.message_id,
        type,
        content,
        payload,
      }).catch(() => {
        // Already handled inside MessageService — swallow here
      });
    }

    // Always proceed to the next middleware
    await next();
  };
}
