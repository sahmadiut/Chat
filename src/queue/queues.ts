/**
 * Queue Definitions
 *
 * Defines all BullMQ queues used by the application.
 * Each queue has a unique name and shared connection options.
 *
 * Usage (producing a job):
 *   import { broadcastQueue } from '#root/queue/queues.js';
 *   await broadcastQueue.add('send-broadcast', { message: 'Hello!' });
 */

import { Queue } from 'bullmq';
import { bullMQConnection } from './connection.js';

// ─── Queue Names (constants to avoid typos) ──────────────────────────

export const BROADCAST_QUEUE_NAME = 'broadcast';
export const NOTIFICATION_QUEUE_NAME = 'notification';

// ─── Queue Instances ─────────────────────────────────────────────────

/**
 * Queue for mass broadcast messaging.
 * Jobs are processed with rate limiting to respect Telegram API limits.
 */
export const broadcastQueue = new Queue(BROADCAST_QUEUE_NAME, {
  connection: bullMQConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

/**
 * Queue for admin notification messages.
 * Used by the global error handler and system alerts.
 */
export const notificationQueue = new Queue(NOTIFICATION_QUEUE_NAME, {
  connection: bullMQConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 1000 },
  },
});
