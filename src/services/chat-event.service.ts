/**
 * Chat Event Service
 *
 * Business logic for managing chat-related event records:
 * - Chat member status changes (joins, leaves, bans, promotions)
 * - Chat join requests
 * - Chat boost updates and removals
 *
 * These tables capture Telegram event data that doesn't fit in the
 * core `chats` table. Each method handles insertion and querying
 * for its respective event type.
 *
 * Usage:
 *   import { ChatEventService } from '#root/services/chat-event.service.js';
 *
 *   await ChatEventService.logMemberUpdate({ chatId, userId, ... });
 *   const events = await ChatEventService.getMemberUpdates(chatId);
 */

import { and, count, desc, eq, gte } from 'drizzle-orm';
import { db } from '#root/database/index.js';
import {
  type ChatBoostRemovedRow,
  type ChatBoostUpdatedRow,
  type ChatJoinRequestRow,
  type ChatMemberUpdatedRow,
  chatBoostRemoved,
  chatBoostUpdated,
  chatJoinRequest,
  chatMemberUpdated,
} from '#root/database/schema/index.js';
import { createLogger } from '#root/utils/logger.js';
import type { PaginatedResult } from './user.service.js';

const log = createLogger('ChatEventService');

export const ChatEventService = {
  // ─── Chat Member Updates ────────────────────────────────────────────

  /**
   * Log a chat member status change event.
   *
   * @param data - The member update event data
   * @returns The inserted row
   */
  async logMemberUpdate(data: {
    chatId: number;
    userId: number;
    date: Date;
    oldChatMember: Record<string, unknown>;
    newChatMember: Record<string, unknown>;
    inviteLink?: Record<string, unknown> | null;
  }): Promise<ChatMemberUpdatedRow> {
    try {
      const [row] = await db
        .insert(chatMemberUpdated)
        .values({
          chatId: data.chatId,
          userId: data.userId,
          date: data.date,
          oldChatMember: data.oldChatMember,
          newChatMember: data.newChatMember,
          inviteLink: data.inviteLink ?? null,
        })
        .returning();

      if (!row) {
        throw new Error('Insert returned no rows');
      }

      log.debug({ chatId: data.chatId, userId: data.userId }, 'Chat member update logged');

      return row;
    } catch (err) {
      log.error({ err, chatId: data.chatId, userId: data.userId }, 'Failed to log member update');
      throw err;
    }
  },

  /**
   * Get chat member update events for a specific chat.
   *
   * @param chatId - The Telegram chat ID
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of results per page
   * @returns Paginated member update events
   */
  async getMemberUpdates(
    chatId: number,
    page = 1,
    pageSize = 50,
  ): Promise<PaginatedResult<ChatMemberUpdatedRow>> {
    const offset = (page - 1) * pageSize;

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(chatMemberUpdated)
        .where(eq(chatMemberUpdated.chatId, chatId))
        .orderBy(desc(chatMemberUpdated.date))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: count() })
        .from(chatMemberUpdated)
        .where(eq(chatMemberUpdated.chatId, chatId)),
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
   * Get member update events for a specific user across all chats.
   *
   * @param userId - The Telegram user ID
   * @param limit - Maximum number of results
   * @returns Member update events for the user
   */
  async getUserMemberUpdates(userId: number, limit = 50): Promise<ChatMemberUpdatedRow[]> {
    return db
      .select()
      .from(chatMemberUpdated)
      .where(eq(chatMemberUpdated.userId, userId))
      .orderBy(desc(chatMemberUpdated.date))
      .limit(limit);
  },

  // ─── Chat Join Requests ─────────────────────────────────────────────

  /**
   * Log a chat join request event.
   *
   * @param data - The join request event data
   * @returns The inserted row
   */
  async logJoinRequest(data: {
    chatId: number;
    userId: number;
    date: Date;
    bio?: string | null;
    inviteLink?: Record<string, unknown> | null;
  }): Promise<ChatJoinRequestRow> {
    try {
      const [row] = await db
        .insert(chatJoinRequest)
        .values({
          chatId: data.chatId,
          userId: data.userId,
          date: data.date,
          bio: data.bio ?? null,
          inviteLink: data.inviteLink ?? null,
        })
        .returning();

      if (!row) {
        throw new Error('Insert returned no rows');
      }

      log.debug({ chatId: data.chatId, userId: data.userId }, 'Chat join request logged');

      return row;
    } catch (err) {
      log.error({ err, chatId: data.chatId, userId: data.userId }, 'Failed to log join request');
      throw err;
    }
  },

  /**
   * Get join requests for a specific chat.
   *
   * @param chatId - The Telegram chat ID
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of results per page
   * @returns Paginated join request events
   */
  async getJoinRequests(
    chatId: number,
    page = 1,
    pageSize = 50,
  ): Promise<PaginatedResult<ChatJoinRequestRow>> {
    const offset = (page - 1) * pageSize;

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(chatJoinRequest)
        .where(eq(chatJoinRequest.chatId, chatId))
        .orderBy(desc(chatJoinRequest.date))
        .limit(pageSize)
        .offset(offset),
      db.select({ count: count() }).from(chatJoinRequest).where(eq(chatJoinRequest.chatId, chatId)),
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

  // ─── Chat Boosts ────────────────────────────────────────────────────

  /**
   * Log a chat boost update event.
   *
   * @param data - The boost update event data
   * @returns The inserted row
   */
  async logBoostUpdate(data: {
    chatId: number;
    boost: Record<string, unknown>;
  }): Promise<ChatBoostUpdatedRow> {
    try {
      const [row] = await db
        .insert(chatBoostUpdated)
        .values({
          chatId: data.chatId,
          boost: data.boost,
        })
        .returning();

      if (!row) {
        throw new Error('Insert returned no rows');
      }

      log.debug({ chatId: data.chatId }, 'Chat boost update logged');

      return row;
    } catch (err) {
      log.error({ err, chatId: data.chatId }, 'Failed to log boost update');
      throw err;
    }
  },

  /**
   * Log a chat boost removal event.
   *
   * @param data - The boost removal event data
   * @returns The inserted row
   */
  async logBoostRemoval(data: {
    chatId: number;
    boostId: string;
    removeDate: Date;
    source: Record<string, unknown>;
  }): Promise<ChatBoostRemovedRow> {
    try {
      const [row] = await db
        .insert(chatBoostRemoved)
        .values({
          chatId: data.chatId,
          boostId: data.boostId,
          removeDate: data.removeDate,
          source: data.source,
        })
        .returning();

      if (!row) {
        throw new Error('Insert returned no rows');
      }

      log.debug({ chatId: data.chatId, boostId: data.boostId }, 'Chat boost removal logged');

      return row;
    } catch (err) {
      log.error({ err, chatId: data.chatId }, 'Failed to log boost removal');
      throw err;
    }
  },

  /**
   * Get boost events for a specific chat.
   *
   * @param chatId - The Telegram chat ID
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of results per page
   * @returns Paginated boost update events
   */
  async getBoostUpdates(
    chatId: number,
    page = 1,
    pageSize = 50,
  ): Promise<PaginatedResult<ChatBoostUpdatedRow>> {
    const offset = (page - 1) * pageSize;

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(chatBoostUpdated)
        .where(eq(chatBoostUpdated.chatId, chatId))
        .orderBy(desc(chatBoostUpdated.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: count() })
        .from(chatBoostUpdated)
        .where(eq(chatBoostUpdated.chatId, chatId)),
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
   * Get boost removal events for a specific chat.
   *
   * @param chatId - The Telegram chat ID
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of results per page
   * @returns Paginated boost removal events
   */
  async getBoostRemovals(
    chatId: number,
    page = 1,
    pageSize = 50,
  ): Promise<PaginatedResult<ChatBoostRemovedRow>> {
    const offset = (page - 1) * pageSize;

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(chatBoostRemoved)
        .where(eq(chatBoostRemoved.chatId, chatId))
        .orderBy(desc(chatBoostRemoved.removeDate))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: count() })
        .from(chatBoostRemoved)
        .where(eq(chatBoostRemoved.chatId, chatId)),
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

  // ─── Statistics ─────────────────────────────────────────────────────

  /**
   * Get aggregate event statistics for a specific chat.
   *
   * @param chatId - The Telegram chat ID
   * @returns Event counts for the chat
   */
  async getChatEventStats(chatId: number): Promise<{
    memberUpdates: number;
    joinRequests: number;
    boostUpdates: number;
    boostRemovals: number;
  }> {
    const [memberResult, joinResult, boostResult, removalResult] = await Promise.all([
      db
        .select({ count: count() })
        .from(chatMemberUpdated)
        .where(eq(chatMemberUpdated.chatId, chatId)),
      db.select({ count: count() }).from(chatJoinRequest).where(eq(chatJoinRequest.chatId, chatId)),
      db
        .select({ count: count() })
        .from(chatBoostUpdated)
        .where(eq(chatBoostUpdated.chatId, chatId)),
      db
        .select({ count: count() })
        .from(chatBoostRemoved)
        .where(eq(chatBoostRemoved.chatId, chatId)),
    ]);

    return {
      memberUpdates: memberResult[0]?.count ?? 0,
      joinRequests: joinResult[0]?.count ?? 0,
      boostUpdates: boostResult[0]?.count ?? 0,
      boostRemovals: removalResult[0]?.count ?? 0,
    };
  },

  /**
   * Get recent member changes across all chats within a time window.
   *
   * @param hours - Number of hours to look back (default: 24)
   * @param limit - Maximum number of results
   * @returns Recent member update events
   */
  async getRecentMemberChanges(hours = 24, limit = 100): Promise<ChatMemberUpdatedRow[]> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return db
      .select()
      .from(chatMemberUpdated)
      .where(gte(chatMemberUpdated.date, since))
      .orderBy(desc(chatMemberUpdated.date))
      .limit(limit);
  },
};
