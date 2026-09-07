/**
 * Admin Logs Schema
 *
 * Stores audit logs of critical admin actions:
 * - Ban / unban users
 * - Direct messages sent
 * - Broadcasts initiated
 * - Settings changes (maintenance toggle, editing start/help text)
 */

import { bigint, index, jsonb, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const adminLogs = pgTable(
  'admin_logs',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),

    /** The admin who performed the action */
    adminTelegramId: bigint('admin_telegram_id', { mode: 'number' }).notNull(),

    /** Action type category (e.g. 'ban_user', 'unban_user', 'direct_message', 'broadcast', 'setting_change') */
    action: varchar('action', { length: 50 }).notNull(),

    /** Target user ID if applicable */
    targetUserId: bigint('target_user_id', { mode: 'number' }).references(() => users.telegramId),

    /** Human-readable details or description of the action */
    details: text('details'),

    /** Extra metadata in structured JSONB */
    metadata: jsonb('metadata'),

    /** Timestamp of the action */
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_admin_logs_admin_id').on(table.adminTelegramId),
    index('idx_admin_logs_action').on(table.action),
    index('idx_admin_logs_created_at').on(table.createdAt),
    index('idx_admin_logs_target_user').on(table.targetUserId),
  ],
);

export type AdminLog = typeof adminLogs.$inferSelect;
export type NewAdminLog = typeof adminLogs.$inferInsert;
