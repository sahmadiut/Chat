/**
 * Notification Worker
 *
 * Processes admin notification jobs from the `notification` queue.
 * Used by the global error handler and system alerts to send
 * messages to the admin chat ID.
 */

import { Worker } from 'bullmq';
import { Api } from 'grammy';
import { env } from '#root/config/env.js';
import { NotificationPreferenceService } from '#root/services/notification-preference.service.js';
import type { NotificationParseMode } from '#root/services/notification-template.service.js';
import { createLogger } from '#root/utils/logger.js';
import { bullMQConnection } from '../connection.js';
import { NOTIFICATION_QUEUE_NAME } from '../queues.js';

const log = createLogger('NotificationWorker');

/** Shape of data expected in a notification job */
export interface NotificationJobData {
  /** The notification message */
  message: string;
  /** Destination chat; defaults to the primary admin for legacy alert jobs */
  targetChatId?: number | string;
  /** User whose delivery preference should be checked */
  recipientUserId?: number;
  /** Preference category such as `reminders` */
  notificationType?: string;
  /** Optional parse mode (defaults to HTML) */
  parseMode?: NotificationParseMode;
}

/**
 * The notification worker instance.
 * Sends admin notifications via Telegram.
 */
export const notificationWorker = new Worker<NotificationJobData>(
  NOTIFICATION_QUEUE_NAME,
  async (job) => {
    const {
      message,
      targetChatId = env.ADMIN_CHAT_ID,
      recipientUserId,
      notificationType,
      parseMode = 'HTML',
    } = job.data;
    const api = new Api(env.BOT_TOKEN);

    if (
      recipientUserId !== undefined &&
      notificationType &&
      !(await NotificationPreferenceService.isEnabled(recipientUserId, notificationType))
    ) {
      log.info(
        { jobId: job.id, recipientUserId, notificationType },
        'Notification skipped by user preference',
      );
      return;
    }

    log.debug({ jobId: job.id, targetChatId }, 'Sending notification');

    await api.sendMessage(targetChatId, message, {
      parse_mode: parseMode,
    });

    log.info({ jobId: job.id, targetChatId }, 'Notification sent');
  },
  {
    connection: bullMQConnection,
    concurrency: 3, // Allow a few notifications in parallel
  },
);

// ─── Worker Event Handlers ───────────────────────────────────────────

notificationWorker.on('failed', (job, err) => {
  // Log but don't propagate — we can't alert about alert failures infinitely
  log.error({ jobId: job?.id, err }, 'Notification job failed');
});

notificationWorker.on('error', (err) => {
  log.error({ err }, 'Notification worker error');
});
