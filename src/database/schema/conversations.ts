import {
  bigint,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { chats } from './chats.js';
import { users } from './users.js';

export const conversationStatusEnum = pgEnum('conversation_status', [
  'active',
  'completed',
  'cancelled',
  'timed_out',
  'stopped',
]);

export const conversations = pgTable(
  'conversation',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' }).references(() => users.telegramId),
    chatId: bigint('chat_id', { mode: 'number' }).references(() => chats.telegramId),
    status: conversationStatusEnum('status').notNull().default('active'),
    command: varchar('command', { length: 160 }).default(''),
    notes: text('notes'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    durationMs: integer('duration_ms'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_conversation_user_id').on(table.userId),
    index('idx_conversation_chat_id').on(table.chatId),
    index('idx_conversation_status').on(table.status),
  ],
);

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
