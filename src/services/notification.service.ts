/** Queue-backed immediate and scheduled user notifications. */

import type { Job } from 'bullmq';
import { notificationQueue } from '#root/queue/queues.js';
import type { NotificationJobData } from '#root/queue/workers/notification.worker.js';
import { assertNotificationType } from './notification-preference.service.js';
import {
  NotificationTemplateService,
  type NotificationTemplateVariables,
} from './notification-template.service.js';

export interface QueueNotificationInput {
  targetChatId: number | string;
  message: string;
  recipientUserId?: number;
  notificationType?: string;
  parseMode?: NotificationJobData['parseMode'];
  deduplicationId?: string;
}

export interface ScheduleTemplateNotificationInput
  extends Omit<QueueNotificationInput, 'message' | 'parseMode'> {
  templateKey: string;
  variables: NotificationTemplateVariables;
}

function validateInput(input: QueueNotificationInput): void {
  if (!input.message.trim()) throw new Error('Notification message cannot be empty');
  if (input.notificationType) assertNotificationType(input.notificationType);
  if (input.notificationType && input.recipientUserId === undefined) {
    throw new Error('recipientUserId is required when notificationType is set');
  }
  if (input.deduplicationId?.includes(':')) {
    throw new Error('Notification deduplication IDs cannot contain colons');
  }
}

async function enqueue(
  input: QueueNotificationInput,
  delay: number,
): Promise<Job<NotificationJobData>> {
  validateInput(input);
  const data: NotificationJobData = {
    message: input.message,
    targetChatId: input.targetChatId,
    recipientUserId: input.recipientUserId,
    notificationType: input.notificationType,
    parseMode: input.parseMode,
  };

  return notificationQueue.add('send-notification', data, {
    delay,
    ...(input.deduplicationId ? { jobId: input.deduplicationId } : {}),
  });
}

export const NotificationService = {
  async send(input: QueueNotificationInput): Promise<Job<NotificationJobData>> {
    return enqueue(input, 0);
  },

  async schedule(input: QueueNotificationInput, sendAt: Date): Promise<Job<NotificationJobData>> {
    const timestamp = sendAt.getTime();
    if (!Number.isFinite(timestamp)) throw new Error('Scheduled notification date is invalid');
    return enqueue(input, Math.max(0, timestamp - Date.now()));
  },

  async scheduleTemplate(
    input: ScheduleTemplateNotificationInput,
    sendAt: Date,
  ): Promise<Job<NotificationJobData>> {
    const rendered = await NotificationTemplateService.render(input.templateKey, input.variables);
    return this.schedule(
      {
        targetChatId: input.targetChatId,
        recipientUserId: input.recipientUserId,
        notificationType: input.notificationType,
        deduplicationId: input.deduplicationId,
        message: rendered.message,
        parseMode: rendered.parseMode,
      },
      sendAt,
    );
  },
};
