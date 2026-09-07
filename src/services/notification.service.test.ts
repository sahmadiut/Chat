import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { add } = vi.hoisted(() => ({ add: vi.fn().mockResolvedValue({ id: 'job-1' }) }));

vi.mock('#root/queue/queues.js', () => ({
  notificationQueue: { add },
}));
vi.mock('./notification-preference.service.js', () => ({
  assertNotificationType: vi.fn(),
}));
vi.mock('./notification-template.service.js', () => ({
  NotificationTemplateService: {
    render: vi.fn().mockResolvedValue({ message: 'Hello Ada', parseMode: 'HTML' }),
  },
}));

import { NotificationService } from './notification.service.js';

describe('NotificationService', () => {
  beforeEach(() => {
    add.mockClear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-27T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a delayed BullMQ job for a specific delivery time', async () => {
    await NotificationService.schedule(
      {
        targetChatId: 42,
        recipientUserId: 42,
        notificationType: 'reminders',
        message: 'Time to check in',
      },
      new Date('2026-08-27T12:05:00.000Z'),
    );

    expect(add).toHaveBeenCalledWith(
      'send-notification',
      expect.objectContaining({ targetChatId: 42, notificationType: 'reminders' }),
      { delay: 300_000 },
    );
  });

  it('renders a template before scheduling delivery', async () => {
    await NotificationService.scheduleTemplate(
      {
        targetChatId: 42,
        templateKey: 'reminder.due',
        variables: { name: 'Ada' },
      },
      new Date('2026-08-27T12:01:00.000Z'),
    );

    expect(add).toHaveBeenCalledWith(
      'send-notification',
      expect.objectContaining({ message: 'Hello Ada', parseMode: 'HTML' }),
      { delay: 60_000 },
    );
  });
});
