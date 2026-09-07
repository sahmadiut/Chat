/**
 * Broadcast Worker
 *
 * Processes broadcast jobs from the `broadcast` queue.
 * Each job sends a message to a list of user Telegram IDs,
 * respecting Telegram's API rate limits (~30 msgs/sec).
 *
 * The worker handles:
 * - Rate-limited sending with configurable delay between messages
 * - Automatic retry on Telegram 429 (Too Many Requests) errors
 * - Detecting blocked users (403) and marking them in the database
 * - Progress reporting back to the queue
 */

import { Worker } from 'bullmq';
import { Api } from 'grammy';
import { env } from '#root/config/env.js';
import { UserService } from '#root/services/user.service.js';
import { createLogger } from '#root/utils/logger.js';
import { bullMQConnection } from '../connection.js';
import { BROADCAST_QUEUE_NAME } from '../queues.js';

const log = createLogger('BroadcastWorker');

/** Shape of data expected in a broadcast job */
export interface BroadcastJobData {
  /** The message text to send */
  message: string;
  /** Array of Telegram user IDs to send to */
  userIds: number[];
  /** Optional parse mode (HTML, Markdown, MarkdownV2) */
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
}

/** Delay between individual messages (ms) to respect rate limits */
const SEND_DELAY_MS = 35; // ~28 msgs/sec, safely under Telegram's 30/sec limit

/**
 * The broadcast worker instance.
 * Processes one job at a time (concurrency: 1) to maintain
 * predictable rate limiting.
 */
export const broadcastWorker = new Worker<BroadcastJobData>(
  BROADCAST_QUEUE_NAME,
  async (job) => {
    const { message, userIds, parseMode } = job.data;
    const api = new Api(env.BOT_TOKEN);

    log.info({ jobId: job.id, totalUsers: userIds.length }, 'Starting broadcast');

    let sent = 0;
    let failed = 0;
    let blocked = 0;

    for (const userId of userIds) {
      try {
        await api.sendMessage(userId, message, {
          parse_mode: parseMode,
        });
        sent++;
      } catch (err: unknown) {
        const error = err as { error_code?: number; description?: string };

        if (error.error_code === 403) {
          // User has blocked the bot — mark them
          blocked++;
          await UserService.blockUser(userId).catch((e) => {
            log.error({ err: e, userId }, 'Failed to mark user as blocked');
          });
        } else if (error.error_code === 429) {
          // Rate limited — wait for the retry_after period
          const retryAfter =
            (err as { parameters?: { retry_after?: number } }).parameters?.retry_after ?? 5;
          log.warn({ userId, retryAfter }, 'Rate limited — waiting');
          await sleep(retryAfter * 1000);
          // Retry this user
          try {
            await api.sendMessage(userId, message, { parse_mode: parseMode });
            sent++;
          } catch {
            failed++;
          }
        } else {
          failed++;
          log.warn({ err, userId }, 'Failed to send broadcast message');
        }
      }

      // Report progress
      await job.updateProgress(Math.round(((sent + failed + blocked) / userIds.length) * 100));

      // Rate-limit delay between messages
      await sleep(SEND_DELAY_MS);
    }

    const result = { sent, failed, blocked, total: userIds.length };
    log.info({ jobId: job.id, ...result }, 'Broadcast completed');
    return result;
  },
  {
    connection: bullMQConnection,
    concurrency: 1, // Process one broadcast at a time
  },
);

// ─── Worker Event Handlers ───────────────────────────────────────────

broadcastWorker.on('failed', (job, err) => {
  log.error({ jobId: job?.id, err }, 'Broadcast job failed');
});

broadcastWorker.on('error', (err) => {
  log.error({ err }, 'Broadcast worker error');
});

// ─── Utilities ───────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
