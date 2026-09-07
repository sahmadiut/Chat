/**
 * User Service
 *
 * Core business logic for managing Telegram users in the database.
 * Provides cache-first lookups, atomic upserts, pagination, statistics,
 * and search capabilities using Drizzle ORM's PostgreSQL support.
 *
 * Usage:
 *   import { UserService } from '#root/services/user.service.js';
 *
 *   await UserService.upsert(telegramUser);
 *   const user = await UserService.findByTelegramId(123);
 *   const stats = await UserService.getStats();
 */

import { and, count, desc, eq, gte, ilike, or, sql } from 'drizzle-orm';
import type { User as TelegramUser } from 'grammy/types';
import { cacheDel, cacheGet, cacheSet } from '#root/cache/utils.js';
import { db } from '#root/database/index.js';
import { type User, users } from '#root/database/schema/index.js';
import { createLogger } from '#root/utils/logger.js';

const log = createLogger('UserService');

/** Cache key prefix for user data */
const USER_CACHE_PREFIX = 'bot:users:';

/** Default cache TTL for user data (5 minutes) */
const USER_CACHE_TTL = 300;

/** Pagination result type */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** User statistics result */
export interface UserStats {
  total: number;
  active: number;
  blocked: number;
  banned: number;
  premium: number;
  bots: number;
  newToday: number;
  newThisWeek: number;
}

export const UserService = {
  /**
   * Upsert a Telegram user into the database.
   * Uses PostgreSQL's INSERT ... ON CONFLICT DO UPDATE to atomically
   * insert or update the user in a single query.
   *
   * After a successful upsert, the cache entry is invalidated so
   * subsequent reads fetch fresh data.
   *
   * @param telegramUser - The Telegram User object from the update context
   * @returns The upserted user row
   */
  async upsert(telegramUser: TelegramUser): Promise<User> {
    const existing = await this.findByTelegramId(telegramUser.id);
    const languageCode = existing?.languageCode ?? telegramUser.language_code ?? null;

    const values = {
      telegramId: telegramUser.id,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name ?? null,
      username: telegramUser.username ?? null,
      languageCode,
      isBot: telegramUser.is_bot,
      isPremium: telegramUser.is_premium ?? false,
    };

    const [user] = await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.telegramId,
        set: {
          firstName: values.firstName,
          lastName: values.lastName,
          username: values.username,
          languageCode: values.languageCode,
          isBot: values.isBot,
          isPremium: values.isPremium,
          updatedAt: new Date(),
        },
      })
      .returning();

    const upsertedUser = user;
    if (!upsertedUser) {
      throw new Error(`User upsert returned no rows for telegramId=${telegramUser.id}`);
    }

    // Invalidate cache so next read gets fresh data
    await cacheDel(`${USER_CACHE_PREFIX}${telegramUser.id}`);

    log.debug({ telegramId: telegramUser.id }, 'User upserted');

    return upsertedUser;
  },

  /**
   * Find a user by their Telegram ID.
   * Uses a cache-first strategy: checks Redis before hitting PostgreSQL.
   *
   * @param telegramId - The Telegram user ID
   * @returns The user row, or `null` if not found
   */
  async findByTelegramId(telegramId: number): Promise<User | null> {
    const cacheKey = `${USER_CACHE_PREFIX}${telegramId}`;

    // 1. Try cache first
    const cached = await cacheGet<User>(cacheKey);
    if (cached) {
      log.debug({ telegramId }, 'User cache HIT');
      return cached;
    }

    // 2. Cache miss — query database
    const user = await db.query.users.findFirst({
      where: eq(users.telegramId, telegramId),
    });

    // 3. Populate cache if found
    if (user) {
      await cacheSet(cacheKey, user, USER_CACHE_TTL);
      log.debug({ telegramId }, 'User cache MISS — fetched from DB and cached');
    }

    return user ?? null;
  },

  /**
   * Get all users with pagination.
   *
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of users per page
   * @returns Paginated user results
   */
  async getAll(page = 1, pageSize = 50): Promise<PaginatedResult<User>> {
    const offset = (page - 1) * pageSize;

    const [data, totalResult] = await Promise.all([
      db.select().from(users).orderBy(desc(users.createdAt)).limit(pageSize).offset(offset),
      db.select({ count: count() }).from(users),
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
   * Get comprehensive user statistics.
   *
   * @returns Aggregated user counts and metrics
   */
  async getStats(): Promise<UserStats> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    const [stats] = await db
      .select({
        total: count(),
        blocked: count(sql`CASE WHEN ${users.isBlocked} = true THEN 1 END`),
        banned: count(sql`CASE WHEN ${users.isBanned} = true THEN 1 END`),
        premium: count(sql`CASE WHEN ${users.isPremium} = true THEN 1 END`),
        bots: count(sql`CASE WHEN ${users.isBot} = true THEN 1 END`),
      })
      .from(users);

    const [activeResult] = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.isBlocked, false), eq(users.isBanned, false), eq(users.isBot, false)));

    const [todayResult] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, todayStart));

    const [weekResult] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, weekStart));

    return {
      total: stats?.total ?? 0,
      active: activeResult?.count ?? 0,
      blocked: stats?.blocked ?? 0,
      banned: stats?.banned ?? 0,
      premium: stats?.premium ?? 0,
      bots: stats?.bots ?? 0,
      newToday: todayResult?.count ?? 0,
      newThisWeek: weekResult?.count ?? 0,
    };
  },

  /**
   * Search users by telegram ID, username, or first/last name.
   *
   * @param query - The search query string (can be numeric ID or text)
   * @param limit - Maximum number of results (default: 20)
   * @returns Matching users
   */
  async search(query: string, limit = 20): Promise<User[]> {
    const trimmed = query.trim().replace(/^@/, '');
    const numId = Number(trimmed);

    if (!Number.isNaN(numId) && Number.isInteger(numId) && numId > 0) {
      const byId = await this.findByTelegramId(numId);
      if (byId) return [byId];
    }

    const pattern = `%${trimmed}%`;
    return db
      .select()
      .from(users)
      .where(
        or(
          ilike(users.username, pattern),
          ilike(users.firstName, pattern),
          ilike(users.lastName, pattern),
        ),
      )
      .limit(limit);
  },

  /**
   * Search users by username or first/last name.
   *
   * @param query - The search query string
   * @param limit - Maximum number of results (default: 20)
   * @returns Matching users
   */
  async searchByUsername(query: string, limit = 20): Promise<User[]> {
    const pattern = `%${query}%`;

    return db
      .select()
      .from(users)
      .where(
        or(
          ilike(users.username, pattern),
          ilike(users.firstName, pattern),
          ilike(users.lastName, pattern),
        ),
      )
      .limit(limit);
  },

  /**
   * Get users who have been active (updated) within a time window.
   *
   * @param hours - Number of hours to look back
   * @returns Recently active users
   */
  async getRecentlyActive(hours = 24): Promise<User[]> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return db
      .select()
      .from(users)
      .where(gte(users.updatedAt, since))
      .orderBy(desc(users.updatedAt));
  },

  /**
   * Get all non-blocked and non-banned user IDs (for broadcasting).
   *
   * @returns Array of Telegram user IDs
   */
  async getAllActiveUserIds(): Promise<number[]> {
    const result = await db
      .select({ telegramId: users.telegramId })
      .from(users)
      .where(and(eq(users.isBlocked, false), eq(users.isBanned, false), eq(users.isBot, false)));

    return result.map((r) => r.telegramId);
  },

  /**
   * Ban a user.
   *
   * @param telegramId - The Telegram user ID
   * @param reason - Optional reason for ban
   */
  async banUser(telegramId: number, reason?: string): Promise<void> {
    await db
      .update(users)
      .set({ isBanned: true, banReason: reason ?? null, updatedAt: new Date() })
      .where(eq(users.telegramId, telegramId));

    await cacheDel(`${USER_CACHE_PREFIX}${telegramId}`);
    log.info({ telegramId, reason }, 'User banned');
  },

  /**
   * Unban a user.
   *
   * @param telegramId - The Telegram user ID
   */
  async unbanUser(telegramId: number): Promise<void> {
    await db
      .update(users)
      .set({ isBanned: false, banReason: null, updatedAt: new Date() })
      .where(eq(users.telegramId, telegramId));

    await cacheDel(`${USER_CACHE_PREFIX}${telegramId}`);
    log.info({ telegramId }, 'User unbanned');
  },

  /**
   * Mark a user as blocked (they blocked the bot).
   *
   * @param telegramId - The Telegram user ID
   */
  async blockUser(telegramId: number): Promise<void> {
    await db
      .update(users)
      .set({ isBlocked: true, updatedAt: new Date() })
      .where(eq(users.telegramId, telegramId));

    await cacheDel(`${USER_CACHE_PREFIX}${telegramId}`);
    log.info({ telegramId }, 'User marked as blocked');
  },

  /**
   * Mark a user as unblocked.
   *
   * @param telegramId - The Telegram user ID
   */
  async unblockUser(telegramId: number): Promise<void> {
    await db
      .update(users)
      .set({ isBlocked: false, updatedAt: new Date() })
      .where(eq(users.telegramId, telegramId));

    await cacheDel(`${USER_CACHE_PREFIX}${telegramId}`);
    log.info({ telegramId }, 'User marked as unblocked');
  },

  /**
   * Update the user's preferred language code in PostgreSQL and cache.
   *
   * @param telegramId - The Telegram user ID
   * @param languageCode - The language code ('fa' | 'en')
   */
  async updateLanguage(telegramId: number, languageCode: string): Promise<void> {
    await db
      .update(users)
      .set({ languageCode, updatedAt: new Date() })
      .where(eq(users.telegramId, telegramId));

    await cacheDel(`${USER_CACHE_PREFIX}${telegramId}`);
    log.info({ telegramId, languageCode }, 'User language updated');
  },

  /**
   * Update the last online timestamp for a user.
   * This performs a fast, non-blocking DB update without fetching or caching.
   *
   * @param telegramId - The Telegram user ID
   */
  async updateLastOnline(telegramId: number): Promise<void> {
    try {
      await db.update(users).set({ updatedAt: new Date() }).where(eq(users.telegramId, telegramId));
      // Note: We deliberately do NOT invalidate the cache here because
      // last online is updated on every request and we don't want to
      // destroy cache hits for the main user data.
    } catch (err) {
      log.error({ err, telegramId }, 'Failed to update user last online timestamp');
    }
  },
};
