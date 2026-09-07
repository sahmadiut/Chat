/** Notification preferences and reusable message templates. */

import {
  bigint,
  boolean,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.telegramId, { onDelete: 'cascade' }),
    type: varchar('type', { length: 80 }).notNull(),
    enabled: boolean('enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.type] }),
    index('idx_notification_preferences_user').on(table.userId),
  ],
);

export const notificationTemplates = pgTable(
  'notification_templates',
  {
    key: varchar('key', { length: 100 }).primaryKey(),
    content: text('content').notNull(),
    parseMode: varchar('parse_mode', { length: 20 }).notNull().default('HTML'),
    description: varchar('description', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('idx_notification_templates_key').on(table.key)],
);

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference = typeof notificationPreferences.$inferInsert;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type NewNotificationTemplate = typeof notificationTemplates.$inferInsert;
