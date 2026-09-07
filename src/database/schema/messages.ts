/**
 * Messages Schema
 *
 * Logs all incoming messages and bot responses for analytics,
 * auditing, and debugging purposes. Replaces file-based per-user logging
 * with database-backed structured logging.
 */

import {
  bigint,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { chats } from './chats.js';
import { users } from './users.js';

export const messageTypeEnum = pgEnum('message_type', [
  'command',
  'text_message',
  'callback_query',
  'inline_query',
  'photo_message',
  'document_message',
  'video_message',
  'voice_message',
  'sticker_message',
  'location_message',
  'contact_message',
  'other',
]);

export const messageDirectionEnum = pgEnum('message_direction', ['incoming', 'outgoing']);

/**
 * Messages table — stores both incoming user messages and outgoing bot responses.
 */
export const messages = pgTable(
  'messages',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),

    /** Direction: incoming (user→bot) or outgoing (bot→user) */
    direction: messageDirectionEnum('direction').notNull().default('incoming'),

    /** The Telegram user who sent/received the message */
    userId: bigint('user_id', { mode: 'number' }).references(() => users.telegramId),

    /** The chat where the message was sent/received */
    chatId: bigint('chat_id', { mode: 'number' }).references(() => chats.telegramId),

    /** Telegram message ID (for deduplication and reference) */
    telegramMessageId: integer('telegram_message_id'),

    /** Type classification */
    type: messageTypeEnum('type').notNull().default('text_message'),

    /** The text content of the message (if any) */
    content: text('content'),

    /** Callback query data or inline query text (if applicable) */
    payload: text('payload'),

    /** Additional metadata stored as JSONB for flexibility */
    metadata: jsonb('metadata'),

    /** When the message was created */
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_messages_user_id').on(table.userId),
    index('idx_messages_chat_id').on(table.chatId),
    index('idx_messages_type').on(table.type),
    index('idx_messages_direction').on(table.direction),
    index('idx_messages_created_at').on(table.createdAt),
    index('idx_messages_user_created').on(table.userId, table.createdAt),
  ],
);

// ─── Inferred Types ──────────────────────────────────────────────────

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
