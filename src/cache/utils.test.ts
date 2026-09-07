/**
 * Cache Utilities — Unit Tests
 *
 * Tests the cacheGet, cacheSet, cacheDel, cacheSetFlag, and cacheHasFlag
 * utility functions. All Redis interactions are mocked.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the redis client before importing cache utils
const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
};

vi.mock('#root/cache/index.js', () => ({
  redis: mockRedis,
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

// Import after mocks are set up
const { cacheGet, cacheSet, cacheDel, cacheSetFlag, cacheHasFlag } = await import(
  '#root/cache/utils.js'
);

describe('Cache Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── cacheGet ──────────────────────────────────────────────────────

  describe('cacheGet', () => {
    it('should return parsed JSON when key exists', async () => {
      const data = { telegramId: 123, firstName: 'Test' };
      mockRedis.get.mockResolvedValue(JSON.stringify(data));

      const result = await cacheGet<typeof data>('bot:users:123');

      expect(mockRedis.get).toHaveBeenCalledWith('bot:users:123');
      expect(result).toEqual(data);
    });

    it('should return null when key does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await cacheGet('bot:users:999');

      expect(result).toBeNull();
    });

    it('should return null and not throw on Redis error', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection lost'));

      const result = await cacheGet('bot:users:123');

      expect(result).toBeNull();
    });

    it('should return null on invalid JSON', async () => {
      mockRedis.get.mockResolvedValue('not-valid-json{');

      const result = await cacheGet('bot:users:123');

      expect(result).toBeNull();
    });
  });

  // ─── cacheSet ──────────────────────────────────────────────────────

  describe('cacheSet', () => {
    it('should serialize value and set with default TTL', async () => {
      const data = { id: 1, name: 'Test' };

      await cacheSet('bot:test:1', data);

      expect(mockRedis.set).toHaveBeenCalledWith('bot:test:1', JSON.stringify(data), 'EX', 300);
    });

    it('should use custom TTL when provided', async () => {
      await cacheSet('bot:test:1', 'value', 600);

      expect(mockRedis.set).toHaveBeenCalledWith('bot:test:1', '"value"', 'EX', 600);
    });

    it('should not throw on Redis error', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis error'));

      await expect(cacheSet('bot:test:1', 'value')).resolves.toBeUndefined();
    });
  });

  // ─── cacheDel ──────────────────────────────────────────────────────

  describe('cacheDel', () => {
    it('should delete the key', async () => {
      mockRedis.del.mockResolvedValue(1);

      await cacheDel('bot:users:123');

      expect(mockRedis.del).toHaveBeenCalledWith('bot:users:123');
    });

    it('should not throw on Redis error', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));

      await expect(cacheDel('bot:users:123')).resolves.toBeUndefined();
    });
  });

  // ─── cacheSetFlag ──────────────────────────────────────────────────

  describe('cacheSetFlag', () => {
    it('should set a flag value "1" with the given TTL', async () => {
      await cacheSetFlag('bot:upsert:user:123', 300);

      expect(mockRedis.set).toHaveBeenCalledWith('bot:upsert:user:123', '1', 'EX', 300);
    });

    it('should not throw on Redis error', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis error'));

      await expect(cacheSetFlag('key', 60)).resolves.toBeUndefined();
    });
  });

  // ─── cacheHasFlag ──────────────────────────────────────────────────

  describe('cacheHasFlag', () => {
    it('should return true when flag exists', async () => {
      mockRedis.exists.mockResolvedValue(1);

      const result = await cacheHasFlag('bot:upsert:user:123');

      expect(result).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith('bot:upsert:user:123');
    });

    it('should return false when flag does not exist', async () => {
      mockRedis.exists.mockResolvedValue(0);

      const result = await cacheHasFlag('bot:upsert:user:999');

      expect(result).toBe(false);
    });

    it('should return false on Redis error', async () => {
      mockRedis.exists.mockRejectedValue(new Error('Redis error'));

      const result = await cacheHasFlag('bot:upsert:user:123');

      expect(result).toBe(false);
    });
  });
});
