/**
 * User Service — Unit Tests
 *
 * Tests the UserService methods with mocked database and cache.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ──────────────────────────────────────────────────────────

const mockDb = {
  insert: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  query: {
    users: {
      findFirst: vi.fn(),
    },
  },
};

// Chain helpers for insert
const mockReturning = vi.fn();
const mockOnConflict = vi.fn(() => ({ returning: mockReturning }));
const mockValues = vi.fn(() => ({ onConflictDoUpdate: mockOnConflict }));
mockDb.insert.mockReturnValue({ values: mockValues });

// Chain helpers for select
const mockFrom = vi.fn();
const mockSelectFrom = {
  from: mockFrom,
};
mockDb.select.mockReturnValue(mockSelectFrom);

// Chain helpers for update
const mockUpdateWhere = vi.fn();
const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere }));
mockDb.update.mockReturnValue({ set: mockUpdateSet });

vi.mock('#root/database/index.js', () => ({ db: mockDb }));

const mockCacheGet = vi.fn();
const mockCacheSet = vi.fn();
const mockCacheDel = vi.fn();

vi.mock('#root/cache/utils.js', () => ({
  cacheGet: (...args: unknown[]) => mockCacheGet(...args),
  cacheSet: (...args: unknown[]) => mockCacheSet(...args),
  cacheDel: (...args: unknown[]) => mockCacheDel(...args),
}));

vi.mock('#root/utils/logger.js', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  }),
}));

vi.mock('#root/database/schema/index.js', () => ({
  users: {
    telegramId: 'telegram_id',
    isBlocked: 'is_blocked',
    isBot: 'is_bot',
    isPremium: 'is_premium',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    username: 'username',
    firstName: 'first_name',
    lastName: 'last_name',
  },
}));

// Mock drizzle-orm operators
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', a, b })),
  and: vi.fn((...args: unknown[]) => ({ type: 'and', args })),
  or: vi.fn((...args: unknown[]) => ({ type: 'or', args })),
  gte: vi.fn((a, b) => ({ type: 'gte', a, b })),
  desc: vi.fn((a) => ({ type: 'desc', a })),
  count: vi.fn((expr) => ({ type: 'count', expr })),
  ilike: vi.fn((a, b) => ({ type: 'ilike', a, b })),
  sql: vi.fn(),
}));

const { UserService } = await import('#root/services/user.service.js');

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset chain mocks
    mockDb.insert.mockReturnValue({ values: mockValues });
    mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflict });
    mockOnConflict.mockReturnValue({ returning: mockReturning });
    mockDb.select.mockReturnValue(mockSelectFrom);
    mockDb.update.mockReturnValue({ set: mockUpdateSet });
    mockUpdateSet.mockReturnValue({ where: mockUpdateWhere });
  });

  // ─── upsert ────────────────────────────────────────────────────────

  describe('upsert', () => {
    const telegramUser: import('grammy/types').User = {
      id: 12345,
      is_bot: false,
      first_name: 'John',
      last_name: 'Doe',
      username: 'johndoe',
      language_code: 'en',
      is_premium: true,
    };

    it('should insert/update a user and return the result', async () => {
      const dbUser = {
        telegramId: 12345,
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        languageCode: 'en',
        isBot: false,
        isPremium: true,
        isBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockReturning.mockResolvedValue([dbUser]);
      mockCacheDel.mockResolvedValue(undefined);

      const result = await UserService.upsert(telegramUser);

      expect(result).toEqual(dbUser);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockCacheDel).toHaveBeenCalledWith('bot:users:12345');
    });

    it('should throw when upsert returns no rows', async () => {
      mockReturning.mockResolvedValue([undefined]);

      await expect(UserService.upsert(telegramUser)).rejects.toThrow(
        'User upsert returned no rows',
      );
    });

    it('should handle null optional fields gracefully', async () => {
      const minimalUser = {
        id: 99,
        is_bot: false,
        first_name: 'Test',
      };
      const dbUser = {
        telegramId: 99,
        firstName: 'Test',
        lastName: null,
        username: null,
        languageCode: null,
        isBot: false,
        isPremium: false,
        isBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockReturning.mockResolvedValue([dbUser]);
      mockCacheDel.mockResolvedValue(undefined);

      const result = await UserService.upsert(
        minimalUser as unknown as import('grammy/types').User,
      );

      expect(result.lastName).toBeNull();
      expect(result.username).toBeNull();
    });
  });

  // ─── findByTelegramId ──────────────────────────────────────────────

  describe('findByTelegramId', () => {
    const cachedUser = {
      telegramId: 123,
      firstName: 'Cached',
      isBlocked: false,
    };

    it('should return from cache on cache hit', async () => {
      mockCacheGet.mockResolvedValue(cachedUser);

      const result = await UserService.findByTelegramId(123);

      expect(result).toEqual(cachedUser);
      expect(mockCacheGet).toHaveBeenCalledWith('bot:users:123');
      expect(mockDb.query.users.findFirst).not.toHaveBeenCalled();
    });

    it('should query database on cache miss', async () => {
      const dbUser = { telegramId: 123, firstName: 'FromDB' };
      mockCacheGet.mockResolvedValue(null);
      mockDb.query.users.findFirst.mockResolvedValue(dbUser);
      mockCacheSet.mockResolvedValue(undefined);

      const result = await UserService.findByTelegramId(123);

      expect(result).toEqual(dbUser);
      expect(mockCacheSet).toHaveBeenCalledWith('bot:users:123', dbUser, 300);
    });

    it('should return null when user not found', async () => {
      mockCacheGet.mockResolvedValue(null);
      mockDb.query.users.findFirst.mockResolvedValue(undefined);

      const result = await UserService.findByTelegramId(999);

      expect(result).toBeNull();
      expect(mockCacheSet).not.toHaveBeenCalled();
    });
  });

  // ─── blockUser / unblockUser ───────────────────────────────────────

  describe('blockUser', () => {
    it('should update blocked status and invalidate cache', async () => {
      mockUpdateWhere.mockResolvedValue(undefined);
      mockCacheDel.mockResolvedValue(undefined);

      await UserService.blockUser(123);

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockCacheDel).toHaveBeenCalledWith('bot:users:123');
    });
  });

  describe('unblockUser', () => {
    it('should update blocked status and invalidate cache', async () => {
      mockUpdateWhere.mockResolvedValue(undefined);
      mockCacheDel.mockResolvedValue(undefined);

      await UserService.unblockUser(123);

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockCacheDel).toHaveBeenCalledWith('bot:users:123');
    });
  });

  describe('updateLanguage', () => {
    it('should update user language and invalidate cache', async () => {
      mockUpdateWhere.mockResolvedValue(undefined);
      mockCacheDel.mockResolvedValue(undefined);

      await UserService.updateLanguage(123, 'fa');

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockCacheDel).toHaveBeenCalledWith('bot:users:123');
    });
  });

  // ─── updateLastOnline ──────────────────────────────────────────────

  describe('updateLastOnline', () => {
    it('should update the updatedAt timestamp without cache invalidation', async () => {
      mockUpdateWhere.mockResolvedValue(undefined);

      await UserService.updateLastOnline(123);

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockCacheDel).not.toHaveBeenCalled();
    });

    it('should not throw on database error', async () => {
      mockUpdateWhere.mockRejectedValue(new Error('DB error'));

      await expect(UserService.updateLastOnline(123)).resolves.toBeUndefined();
    });
  });
});
