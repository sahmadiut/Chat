/**
 * Queue System Barrel Export
 *
 * Re-exports all queues and workers, and provides a centralized
 * `closeQueues()` function for graceful shutdown.
 */

import { createLogger } from '#root/utils/logger.js';
import { broadcastQueue, notificationQueue } from './queues.js';
import { broadcastWorker } from './workers/broadcast.worker.js';
import { notificationWorker } from './workers/notification.worker.js';

const log = createLogger('QueueSystem');

// Re-export queues and workers
export { broadcastQueue, notificationQueue } from './queues.js';
export { broadcastWorker } from './workers/broadcast.worker.js';
export { notificationWorker } from './workers/notification.worker.js';

// Re-export job data types
export type { BroadcastJobData } from './workers/broadcast.worker.js';
export type { NotificationJobData } from './workers/notification.worker.js';

/**
 * Gracefully shut down all BullMQ workers and queues.
 *
 * Workers are closed first (they wait for active jobs to finish),
 * then queues are closed to release Redis connections.
 */
export async function closeQueues(): Promise<void> {
  log.info('Shutting down queue system...');

  // 1. Close workers first — wait for active jobs to complete
  await Promise.allSettled([broadcastWorker.close(), notificationWorker.close()]);
  log.info('All workers closed');

  // 2. Close queues to release connections
  await Promise.allSettled([broadcastQueue.close(), notificationQueue.close()]);
  log.info('All queues closed');

  log.info('Queue system shut down');
}
