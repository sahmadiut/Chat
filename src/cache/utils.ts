/**
 * Cache Utility Functions
 *
 * Provides typed, generic helpers for Redis get/set/delete operations
 * with automatic JSON serialization and a consistent key-prefix strategy.
 *
 * Key Namespace Convention:
 *   bot:users:{telegramId}      — Cached user data
 *   bot:chats:{telegramId}      — Cached chat data
 *   bot:upsert:user:{telegramId} — Upsert debounce flag
 *   bot:upsert:chat:{telegramId} — Upsert debounce flag
 *
 * Usage:
 *   import { cacheGet, cacheSet, cacheDel } from '#root/cache/utils.js';
 *
 *   await cacheSet('bot:users:123', userData, 300);
 *   const user = await cacheGet<User>('bot:users:123');
 *   await cacheDel('bot:users:123');
 */

import { createLogger } from '#root/utils/logger.js';
import { redis } from './index.js';

const log = createLogger('Cache');

/**
 * Retrieve a value from Redis and deserialize it from JSON.
 *
 * @param key - The full Redis key (including prefix)
 * @returns The parsed value, or `null` if the key doesn't exist
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    log.warn({ err, key }, 'Cache GET failed — treating as miss');
    return null;
  }
}

/**
 * Store a value in Redis with a TTL, serialized as JSON.
 *
 * @param key   - The full Redis key (including prefix)
 * @param value - The value to cache (must be JSON-serializable)
 * @param ttl   - Time-to-live in seconds (default: 300 = 5 minutes)
 */
export async function cacheSet(key: string, value: unknown, ttl = 300): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    await redis.set(key, serialized, 'EX', ttl);
  } catch (err) {
    log.warn({ err, key }, 'Cache SET failed — continuing without caching');
  }
}

/**
 * Delete a key from Redis (cache invalidation).
 *
 * @param key - The full Redis key to remove
 */
export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    log.warn({ err, key }, 'Cache DEL failed — continuing');
  }
}

/**
 * Set a simple flag/marker in Redis (no JSON, just "1") with a TTL.
 * Useful for debounce/deduplication patterns like the upsert middleware.
 *
 * @param key - The full Redis key
 * @param ttl - Time-to-live in seconds
 */
export async function cacheSetFlag(key: string, ttl: number): Promise<void> {
  try {
    await redis.set(key, '1', 'EX', ttl);
  } catch (err) {
    log.warn({ err, key }, 'Cache SET flag failed — continuing');
  }
}

/**
 * Check if a flag/marker exists in Redis.
 *
 * @param key - The full Redis key
 * @returns `true` if the flag exists, `false` otherwise
 */
export async function cacheHasFlag(key: string): Promise<boolean> {
  try {
    const exists = await redis.exists(key);
    return exists === 1;
  } catch (err) {
    log.warn({ err, key }, 'Cache EXISTS check failed — treating as miss');
    return false;
  }
}
