/**
 * Users Schema
 *
 * Stores Telegram user data captured from incoming updates.
 * Uses the Telegram user ID as the primary key (bigint) since
 * Telegram IDs are unique and stable across the platform.
 *
 * The `isBlocked` field tracks whether the bot has been blocked
 * by the user (detected when sendMessage returns 403).
 */

import { bigint, boolean, index, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    /** Telegram user ID — unique, stable, used as primary key */
    telegramId: bigint('telegram_id', { mode: 'number' }).primaryKey(),

    /** User's first name (always provided by Telegram) */
    firstName: varchar('first_name', { length: 255 }).notNull(),

    /** User's last name (optional in Telegram) */
    lastName: varchar('last_name', { length: 255 }),

    /** User's @username (optional, can change) */
    username: varchar('username', { length: 255 }),

    /** IETF language tag from the user's Telegram client */
    languageCode: varchar('language_code', { length: 10 }),

    /** Whether this is a Telegram bot account */
    isBot: boolean('is_bot').notNull().default(false),

    /** Whether the user has Telegram Premium */
    isPremium: boolean('is_premium').notNull().default(false),

    /** True if this user added the bot to the attachment menu */
    addedToAttachmentMenu: boolean('added_to_attachment_menu').notNull().default(false),

    /** Whether the user has blocked the bot */
    isBlocked: boolean('is_blocked').notNull().default(false),

    /** Whether the user is banned by an admin */
    isBanned: boolean('is_banned').notNull().default(false),

    /** Reason for ban (if banned) */
    banReason: varchar('ban_reason', { length: 255 }),

    /** Row creation timestamp */
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),

    /** Last update timestamp (updated on every upsert) */
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_users_username').on(table.username),
    index('idx_users_created_at').on(table.createdAt),
  ],
);

// ─── Inferred Types ──────────────────────────────────────────────────

/** Type for a fully-hydrated user row (SELECT result) */
export type User = typeof users.$inferSelect;

/** Type for inserting a new user row (INSERT payload) */
export type NewUser = typeof users.$inferInsert;
