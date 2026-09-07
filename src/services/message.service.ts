/**
 * Message Service
 *
 * Handles database-backed logging of all incoming and outgoing messages.
 * Replaces file-based per-user logging with structured, queryable storage.
 *
 * Usage:
 *   import { MessageService } from '#root/services/message.service.js';
 *
 *   await MessageService.logIncoming(ctx);
 *   const analytics = await MessageService.getDailyStats(7);
 */

import { and, count, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '#root/database/index.js';
import { type NewMessage, messages } from '#root/database/schema/index.js';
import { createLogger } from '#root/utils/logger.js';

const log = createLogger('MessageService');

export const MessageService = {
  /**
   * Log an incoming message to the database.
   *
   * @param data - The message data to log
   */
  async logIncoming(data: {
    userId?: number;
    chatId?: number;
    telegramMessageId?: number;
    type: NewMessage['type'];
    content?: string;
    payload?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await db.insert(messages).values({
        direction: 'incoming',
        userId: data.userId ?? null,
        chatId: data.chatId ?? null,
        telegramMessageId: data.telegramMessageId ?? null,
        type: data.type,
        content: data.content ?? null,
        payload: data.payload ?? null,
        metadata: data.metadata ?? null,
      });
    } catch (err) {
      // Non-blocking: never let logging failures crash the bot
      log.error({ err }, 'Failed to log incoming message');
    }
  },

  /**
   * Log an outgoing bot response to the database.
   *
   * @param data - The response data to log
   */
  async logOutgoing(data: {
    userId?: number;
    chatId?: number;
    telegramMessageId?: number;
    content?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await db.insert(messages).values({
        direction: 'outgoing',
        userId: data.userId ?? null,
        chatId: data.chatId ?? null,
        telegramMessageId: data.telegramMessageId ?? null,
        type: 'text_message',
        content: data.content ?? null,
        metadata: data.metadata ?? null,
      });
    } catch (err) {
      log.error({ err }, 'Failed to log outgoing message');
    }
  },

  /**
   * Get message statistics for today.
   */
  async getTodayStats(): Promise<{ incoming: number; outgoing: number; total: number }> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [stats] = await db
      .select({
        incoming: count(sql`CASE WHEN ${messages.direction} = 'incoming' THEN 1 END`),
        outgoing: count(sql`CASE WHEN ${messages.direction} = 'outgoing' THEN 1 END`),
        total: count(),
      })
      .from(messages)
      .where(gte(messages.createdAt, todayStart));

    return {
      incoming: stats?.incoming ?? 0,
      outgoing: stats?.outgoing ?? 0,
      total: stats?.total ?? 0,
    };
  },

  /**
   * Get daily message counts for the last N days.
   *
   * @param days - Number of days to look back (default: 7)
   * @returns Array of { date, incoming, outgoing } objects
   */
  async getDailyStats(
    days = 7,
  ): Promise<Array<{ date: string; incoming: number; outgoing: number }>> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const result = await db
      .select({
        date: sql<string>`DATE(${messages.createdAt})`.as('date'),
        incoming: count(sql`CASE WHEN ${messages.direction} = 'incoming' THEN 1 END`),
        outgoing: count(sql`CASE WHEN ${messages.direction} = 'outgoing' THEN 1 END`),
      })
      .from(messages)
      .where(gte(messages.createdAt, since))
      .groupBy(sql`DATE(${messages.createdAt})`)
      .orderBy(sql`DATE(${messages.createdAt})`);

    return result.map((r) => ({
      date: String(r.date),
      incoming: r.incoming,
      outgoing: r.outgoing,
    }));
  },

  /**
   * Get the most popular commands.
   *
   * @param limit - Maximum number of results (default: 10)
   * @returns Array of { command, count } objects
   */
  async getPopularCommands(limit = 10): Promise<Array<{ command: string; count: number }>> {
    const result = await db
      .select({
        command: messages.content,
        count: count(),
      })
      .from(messages)
      .where(and(eq(messages.type, 'command'), eq(messages.direction, 'incoming')))
      .groupBy(messages.content)
      .orderBy(desc(count()))
      .limit(limit);

    return result
      .filter((r): r is typeof r & { command: string } => r.command !== null)
      .map((r) => ({
        command: r.command,
        count: r.count,
      }));
  },

  /**
   * Get message history for a specific user.
   *
   * @param userId - The Telegram user ID
   * @param limit - Maximum number of messages (default: 100)
   * @returns Array of messages for the user
   */
  async getUserHistory(userId: number, limit = 100) {
    return db
      .select()
      .from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  },
};
