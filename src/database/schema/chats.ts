/**
 * Chats Schema
 *
 * Stores Telegram chat metadata captured from incoming updates.
 * Uses the Telegram chat ID as the primary key (bigint).
 */

import {
  bigint,
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const chatTypeEnum = pgEnum('chat_type', ['private', 'group', 'supergroup', 'channel']);

export const chats = pgTable(
  'chats',
  {
    telegramId: bigint('telegram_id', { mode: 'number' }).primaryKey(),
    type: chatTypeEnum('type').notNull(),
    title: varchar('title', { length: 255 }),
    username: varchar('username', { length: 255 }),
    firstName: varchar('first_name', { length: 255 }),
    lastName: varchar('last_name', { length: 255 }),
    isForum: boolean('is_forum').notNull().default(false),
    allMembersAreAdministrators: boolean('all_members_are_administrators').notNull().default(false),
    oldId: bigint('old_id', { mode: 'number' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('idx_chats_type').on(table.type), index('idx_chats_old_id').on(table.oldId)],
);

export const userChat = pgTable(
  'user_chat',
  {
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.telegramId, { onDelete: 'cascade', onUpdate: 'cascade' }),
    chatId: bigint('chat_id', { mode: 'number' })
      .notNull()
      .references(() => chats.telegramId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.userId, table.chatId] })],
);

export const chatMemberUpdated = pgTable('chat_member_updated', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  chatId: bigint('chat_id', { mode: 'number' })
    .notNull()
    .references(() => chats.telegramId),
  userId: bigint('user_id', { mode: 'number' })
    .notNull()
    .references(() => users.telegramId),
  date: timestamp('date', { withTimezone: true }).notNull(),
  oldChatMember: jsonb('old_chat_member').notNull(),
  newChatMember: jsonb('new_chat_member').notNull(),
  inviteLink: jsonb('invite_link'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const chatJoinRequest = pgTable('chat_join_request', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  chatId: bigint('chat_id', { mode: 'number' })
    .notNull()
    .references(() => chats.telegramId),
  userId: bigint('user_id', { mode: 'number' })
    .notNull()
    .references(() => users.telegramId),
  date: timestamp('date', { withTimezone: true }).notNull(),
  bio: text('bio'),
  inviteLink: jsonb('invite_link'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const chatBoostUpdated = pgTable(
  'chat_boost_updated',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    chatId: bigint('chat_id', { mode: 'number' }).references(() => chats.telegramId),
    boost: jsonb('boost').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_chat_boost_updated_chat_id').on(table.chatId)],
);

export const chatBoostRemoved = pgTable(
  'chat_boost_removed',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    chatId: bigint('chat_id', { mode: 'number' }).references(() => chats.telegramId),
    boostId: varchar('boost_id', { length: 200 }).notNull(),
    removeDate: timestamp('remove_date', { withTimezone: true }).notNull(),
    source: jsonb('source').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_chat_boost_removed_chat_id').on(table.chatId)],
);

// ─── Inferred Types ──────────────────────────────────────────────────

export type Chat = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert;

export type ChatMemberUpdatedRow = typeof chatMemberUpdated.$inferSelect;
export type NewChatMemberUpdatedRow = typeof chatMemberUpdated.$inferInsert;

export type ChatJoinRequestRow = typeof chatJoinRequest.$inferSelect;
export type NewChatJoinRequestRow = typeof chatJoinRequest.$inferInsert;

export type ChatBoostUpdatedRow = typeof chatBoostUpdated.$inferSelect;
export type NewChatBoostUpdatedRow = typeof chatBoostUpdated.$inferInsert;

export type ChatBoostRemovedRow = typeof chatBoostRemoved.$inferSelect;
export type NewChatBoostRemovedRow = typeof chatBoostRemoved.$inferInsert;
