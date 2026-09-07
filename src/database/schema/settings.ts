/**
 * Bot Settings Schema
 *
 * Key-value configuration store for bot-wide settings such as:
 * - maintenance_mode: 'true' | 'false'
 * - custom_start_message: string | null
 * - custom_help_message: string | null
 *
 * Easily extensible for future configurations.
 */

import { index, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const botSettings = pgTable(
  'bot_settings',
  {
    /** Setting key (e.g. 'maintenance_mode', 'custom_start_message', 'custom_help_message') */
    key: varchar('key', { length: 100 }).primaryKey(),

    /** Setting value stored as string (JSON-encoded if complex) */
    value: text('value').notNull(),

    /** Optional description of what this setting controls */
    description: varchar('description', { length: 255 }),

    /** When the setting was last updated */
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('idx_bot_settings_key').on(table.key)],
);

export type BotSetting = typeof botSettings.$inferSelect;
export type NewBotSetting = typeof botSettings.$inferInsert;
