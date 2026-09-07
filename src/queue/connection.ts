/**
 * BullMQ Redis Connection
 *
 * Provides a shared Redis connection configuration specifically for BullMQ.
 * BullMQ requires `maxRetriesPerRequest: null` which is incompatible with
 * the default ioredis settings used by the primary Redis client.
 *
 * This is an ioredis OPTIONS object (not an instance) — BullMQ creates
 * its own connections internally from these options.
 */

import type { ConnectionOptions } from 'bullmq';
import { env } from '#root/config/env.js';

/**
 * Parse the REDIS_URL into connection options that BullMQ can consume.
 * BullMQ mandates `maxRetriesPerRequest: null` for proper blocking behavior.
 */
function parseBullMQConnection(): ConnectionOptions {
  const url = new URL(env.REDIS_URL);

  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    password: url.password || undefined,
    username: url.username || undefined,
    db: url.pathname ? Number(url.pathname.slice(1)) || 0 : 0,
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
  };
}

/**
 * Shared BullMQ connection options.
 * Pass this to every Queue, Worker, and QueueEvents constructor.
 */
export const bullMQConnection: ConnectionOptions = parseBullMQConnection();
