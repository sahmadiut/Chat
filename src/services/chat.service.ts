/**
 * Chat Service
 *
 * Core business logic for managing Telegram chats in the database.
 * Provides cache-first lookups, atomic upserts, and pagination.
 *
 * Usage:
 *   import { ChatService } from '#root/services/chat.service.js';
 *
 *   await ChatService.upsert(telegramChat);
 *   const chat = await ChatService.findByTelegramId(-100123);
 */

import { count, desc, eq } from 'drizzle-orm';
import type { Chat as TelegramChat } from 'grammy/types';
import { cacheDel, cacheGet, cacheSet } from '#root/cache/utils.js';
import { db } from '#root/database/index.js';
import { type Chat, chats } from '#root/database/schema/index.js';
import { createLogger } from '#root/utils/logger.js';
import type { PaginatedResult } from './user.service.js';

const log = createLogger('ChatService');

/** Cache key prefix for chat data */
const CHAT_CACHE_PREFIX = 'bot:chats:';

/** Default cache TTL for chat data (5 minutes) */
const CHAT_CACHE_TTL = 300;

export const ChatService = {
  /**
   * Upsert a Telegram chat into the database.
   * Uses PostgreSQL's INSERT ... ON CONFLICT DO UPDATE for atomic operations.
   *
   * @param telegramChat - The Telegram Chat object from the update context
   * @returns The upserted chat row
   */
  async upsert(telegramChat: TelegramChat): Promise<Chat> {
    const values = {
      telegramId: telegramChat.id,
      type: telegramChat.type,
      title: 'title' in telegramChat ? (telegramChat.title ?? null) : null,
      username: 'username' in telegramChat ? (telegramChat.username ?? null) : null,
    };

    const [chat] = await db
      .insert(chats)
      .values(values)
      .onConflictDoUpdate({
        target: chats.telegramId,
        set: {
          type: values.type,
          title: values.title,
          username: values.username,
          updatedAt: new Date(),
        },
      })
      .returning();

    const upsertedChat = chat;
    if (!upsertedChat) {
      throw new Error(`Chat upsert returned no rows for telegramId=${telegramChat.id}`);
    }

    // Invalidate cache
    await cacheDel(`${CHAT_CACHE_PREFIX}${telegramChat.id}`);

    log.debug({ telegramId: telegramChat.id, type: values.type }, 'Chat upserted');

    return upsertedChat;
  },

  /**
   * Find a chat by its Telegram ID.
   * Uses a cache-first strategy.
   *
   * @param telegramId - The Telegram chat ID
   * @returns The chat row, or `null` if not found
   */
  async findByTelegramId(telegramId: number): Promise<Chat | null> {
    const cacheKey = `${CHAT_CACHE_PREFIX}${telegramId}`;

    // 1. Try cache first
    const cached = await cacheGet<Chat>(cacheKey);
    if (cached) {
      log.debug({ telegramId }, 'Chat cache HIT');
      return cached;
    }

    // 2. Cache miss — query database
    const chat = await db.query.chats.findFirst({
      where: eq(chats.telegramId, telegramId),
    });

    // 3. Populate cache if found
    if (chat) {
      await cacheSet(cacheKey, chat, CHAT_CACHE_TTL);
      log.debug({ telegramId }, 'Chat cache MISS — fetched from DB and cached');
    }

    return chat ?? null;
  },

  /**
   * Get all chats with pagination and optional type filtering.
   *
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of chats per page
   * @param type - Optional filter by chat type
   * @returns Paginated chat results
   */
  async getAll(
    page = 1,
    pageSize = 50,
    type?: 'private' | 'group' | 'supergroup' | 'channel',
  ): Promise<PaginatedResult<Chat>> {
    const offset = (page - 1) * pageSize;
    const whereClause = type ? eq(chats.type, type) : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(chats)
        .where(whereClause)
        .orderBy(desc(chats.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ count: count() }).from(chats).where(whereClause),
    ]);

    const total = totalResult[0]?.count ?? 0;

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  /**
   * Get chat statistics grouped by type.
   *
   * @returns Object with counts for each chat type
   */
  async getStats(): Promise<{ total: number; [type: string]: number }> {
    const results = await db
      .select({
        type: chats.type,
        count: count(),
      })
      .from(chats)
      .groupBy(chats.type);

    const stats: { total: number; [type: string]: number } = { total: 0 };
    for (const row of results) {
      stats[row.type] = row.count;
      stats.total += row.count;
    }

    return stats;
  },
};
