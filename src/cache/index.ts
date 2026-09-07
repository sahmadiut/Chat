/**
 * Redis Client
 *
 * Creates and exports the primary ioredis client instance used for:
 * - grammY session storage (`@grammyjs/storage-redis`)
 * - Upsert caching (smart auto-upsert middleware)
 * - General-purpose caching via the utilities in `./utils.ts`
 *
 * BullMQ uses its own connection configuration (see `src/queue/connection.ts`)
 * because BullMQ requires `maxRetriesPerRequest: null`.
 *
 * Usage:
 *   import { redis } from '#root/cache/index.js';
 *   await redis.set('key', 'value', 'EX', 300);
 */

import { Redis } from 'ioredis';
import { env } from '#root/config/env.js';
import { createLogger } from '#root/utils/logger.js';

const log = createLogger('Redis');

/**
 * Primary Redis client instance.
 * Connects to the URL specified in the `REDIS_URL` environment variable.
 */
export const redis = new Redis(env.REDIS_URL, {
  /* Automatically reconnect on connection loss */
  retryStrategy(times: number) {
    const delay = Math.min(times * 200, 5000);
    log.warn({ attempt: times, delayMs: delay }, 'Redis reconnecting...');
    return delay;
  },
  /* Don't throw on connection errors — let retry strategy handle it */
  maxRetriesPerRequest: 3,
  /* Enable keep-alive to prevent idle connection timeouts */
  keepAlive: 30000,
});

// ─── Connection Event Handlers ───────────────────────────────────────

redis.on('connect', () => {
  log.info('Redis client connected');
});

redis.on('ready', () => {
  log.info('Redis client ready');
});

redis.on('error', (err: Error) => {
  log.error({ err }, 'Redis client error');
});

redis.on('close', () => {
  log.warn('Redis connection closed');
});

// ─── Graceful Shutdown ───────────────────────────────────────────────

/**
 * Gracefully close the Redis connection.
 * Should be called during application shutdown.
 */
export async function closeRedis(): Promise<void> {
  log.info('Closing Redis connection...');
  await redis.quit();
  log.info('Redis connection closed');
}
