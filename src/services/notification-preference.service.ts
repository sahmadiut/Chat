/** Per-user opt-in and opt-out settings for notification categories. */

import { and, eq } from 'drizzle-orm';
import { db } from '#root/database/index.js';
import {
  type NotificationPreference,
  notificationPreferences,
} from '#root/database/schema/index.js';

export const DEFAULT_NOTIFICATION_TYPES = [
  'announcements',
  'reminders',
  'product_updates',
] as const;

const NOTIFICATION_TYPE_PATTERN = /^[a-z][a-z0-9_-]{0,79}$/;

export function assertNotificationType(type: string): void {
  if (!NOTIFICATION_TYPE_PATTERN.test(type)) {
    throw new Error('Notification type must be a lowercase identifier');
  }
}

export const NotificationPreferenceService = {
  async isEnabled(userId: number, type: string): Promise<boolean> {
    assertNotificationType(type);
    const preference = await db.query.notificationPreferences.findFirst({
      where: and(
        eq(notificationPreferences.userId, userId),
        eq(notificationPreferences.type, type),
      ),
    });
    return preference?.enabled ?? true;
  },

  async setEnabled(userId: number, type: string, enabled: boolean): Promise<void> {
    assertNotificationType(type);
    await db
      .insert(notificationPreferences)
      .values({ userId, type, enabled })
      .onConflictDoUpdate({
        target: [notificationPreferences.userId, notificationPreferences.type],
        set: { enabled, updatedAt: new Date() },
      });
  },

  async toggle(userId: number, type: string): Promise<boolean> {
    const enabled = !(await this.isEnabled(userId, type));
    await this.setEnabled(userId, type, enabled);
    return enabled;
  },

  async getForUser(
    userId: number,
    types: readonly string[] = DEFAULT_NOTIFICATION_TYPES,
  ): Promise<NotificationPreference[]> {
    for (const type of types) assertNotificationType(type);
    const stored = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
    const byType = new Map(stored.map((preference) => [preference.type, preference]));
    const now = new Date();

    return types.map(
      (type) =>
        byType.get(type) ?? {
          userId,
          type,
          enabled: true,
          createdAt: now,
          updatedAt: now,
        },
    );
  },
};
