/**
 * Chat Service — Unit Tests
 *
 * Tests the ChatService methods with mocked database and cache.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ──────────────────────────────────────────────────────────

const mockDb = {
  insert: vi.fn(),
  select: vi.fn(),
  query: {
    chats: {
      findFirst: vi.fn(),
    },
  },
};

const mockReturning = vi.fn();
const mockOnConflict = vi.fn(() => ({ returning: mockReturning }));
const mockValues = vi.fn(() => ({ onConflictDoUpdate: mockOnConflict }));
mockDb.insert.mockReturnValue({ values: mockValues });

const mockFrom = vi.fn();
mockDb.select.mockReturnValue({ from: mockFrom });

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
  chats: {
    telegramId: 'telegram_id',
    type: 'type',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', a, b })),
  count: vi.fn((expr) => ({ type: 'count', expr })),
  desc: vi.fn((a) => ({ type: 'desc', a })),
}));

// Must import PaginatedResult type before ChatService
vi.mock('#root/services/user.service.js', () => ({
  // PaginatedResult is just a type, not needed at runtime
}));

const { ChatService } = await import('#root/services/chat.service.js');

describe('ChatService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.insert.mockReturnValue({ values: mockValues });
    mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflict });
    mockOnConflict.mockReturnValue({ returning: mockReturning });
    mockDb.select.mockReturnValue({ from: mockFrom });
  });

  // ─── upsert ────────────────────────────────────────────────────────

  describe('upsert', () => {
    const telegramChat = {
      id: -100123,
      type: 'supergroup' as const,
      title: 'Test Group',
      username: 'testgroup',
    };

    it('should insert/update a chat and return the result', async () => {
      const dbChat = {
        telegramId: -100123,
        type: 'supergroup',
        title: 'Test Group',
        username: 'testgroup',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockReturning.mockResolvedValue([dbChat]);
      mockCacheDel.mockResolvedValue(undefined);

      const result = await ChatService.upsert(telegramChat);

      expect(result).toEqual(dbChat);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockCacheDel).toHaveBeenCalledWith('bot:chats:-100123');
    });

    it('should throw when upsert returns no rows', async () => {
      mockReturning.mockResolvedValue([undefined]);

      await expect(ChatService.upsert(telegramChat)).rejects.toThrow(
        'Chat upsert returned no rows',
      );
    });

    it('should handle private chats without title', async () => {
      const privateChat = {
        id: 42,
        type: 'private' as const,
        first_name: 'John',
      };
      const dbChat = {
        telegramId: 42,
        type: 'private',
        title: null,
        username: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockReturning.mockResolvedValue([dbChat]);
      mockCacheDel.mockResolvedValue(undefined);

      const result = await ChatService.upsert(privateChat);

      expect(result.title).toBeNull();
    });
  });

  // ─── findByTelegramId ──────────────────────────────────────────────

  describe('findByTelegramId', () => {
    it('should return from cache on cache hit', async () => {
      const cachedChat = { telegramId: -100, type: 'supergroup' };
      mockCacheGet.mockResolvedValue(cachedChat);

      const result = await ChatService.findByTelegramId(-100);

      expect(result).toEqual(cachedChat);
      expect(mockCacheGet).toHaveBeenCalledWith('bot:chats:-100');
      expect(mockDb.query.chats.findFirst).not.toHaveBeenCalled();
    });

    it('should query database on cache miss and populate cache', async () => {
      const dbChat = { telegramId: -100, type: 'supergroup' };
      mockCacheGet.mockResolvedValue(null);
      mockDb.query.chats.findFirst.mockResolvedValue(dbChat);
      mockCacheSet.mockResolvedValue(undefined);

      const result = await ChatService.findByTelegramId(-100);

      expect(result).toEqual(dbChat);
      expect(mockCacheSet).toHaveBeenCalledWith('bot:chats:-100', dbChat, 300);
    });

    it('should return null when chat not found', async () => {
      mockCacheGet.mockResolvedValue(null);
      mockDb.query.chats.findFirst.mockResolvedValue(undefined);

      const result = await ChatService.findByTelegramId(-999);

      expect(result).toBeNull();
      expect(mockCacheSet).not.toHaveBeenCalled();
    });
  });
});
