/**
 * Drizzle Relations
 *
 * Defines relationships between tables for Drizzle's relational query API.
 * This enables type-safe `db.query.users.findFirst({ with: { chats: true } })`
 * style queries without writing raw JOINs.
 *
 * These relations are purely for the Drizzle query builder — they do NOT
 * create foreign keys in the database (those are defined in the schema files).
 */

import { relations } from 'drizzle-orm';
import { adminLogs } from './admin-logs.js';
import {
  chatBoostRemoved,
  chatBoostUpdated,
  chatJoinRequest,
  chatMemberUpdated,
  chats,
  userChat,
} from './chats.js';
import { conversations } from './conversations.js';
import { notificationPreferences } from './notifications.js';
import { users } from './users.js';

// ─── User Relations ──────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  /** All user-chat associations (M2M pivot) */
  userChats: many(userChat),
  /** All conversations initiated by this user */
  conversations: many(conversations),
  /** All chat member change events for this user */
  chatMemberUpdates: many(chatMemberUpdated),
  /** All join requests made by this user */
  chatJoinRequests: many(chatJoinRequest),
  /** All admin logs where this user is the target */
  adminLogs: many(adminLogs),
  /** Per-type notification delivery preferences */
  notificationPreferences: many(notificationPreferences),
}));

// ─── Chat Relations ──────────────────────────────────────────────────

export const chatsRelations = relations(chats, ({ many }) => ({
  /** All user-chat associations (M2M pivot) */
  userChats: many(userChat),
  /** All conversations in this chat */
  conversations: many(conversations),
  /** All member change events in this chat */
  chatMemberUpdates: many(chatMemberUpdated),
  /** All join requests for this chat */
  chatJoinRequests: many(chatJoinRequest),
  /** All boost events for this chat */
  chatBoostUpdates: many(chatBoostUpdated),
  /** All boost removal events for this chat */
  chatBoostRemovals: many(chatBoostRemoved),
}));

// ─── UserChat (M2M Pivot) Relations ─────────────────────────────────

export const userChatRelations = relations(userChat, ({ one }) => ({
  user: one(users, {
    fields: [userChat.userId],
    references: [users.telegramId],
  }),
  chat: one(chats, {
    fields: [userChat.chatId],
    references: [chats.telegramId],
  }),
}));

// ─── Conversation Relations ──────────────────────────────────────────

export const conversationsRelations = relations(conversations, ({ one }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.telegramId],
  }),
  chat: one(chats, {
    fields: [conversations.chatId],
    references: [chats.telegramId],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.telegramId],
  }),
}));

// ─── ChatMemberUpdated Relations ─────────────────────────────────────

export const chatMemberUpdatedRelations = relations(chatMemberUpdated, ({ one }) => ({
  chat: one(chats, {
    fields: [chatMemberUpdated.chatId],
    references: [chats.telegramId],
  }),
  user: one(users, {
    fields: [chatMemberUpdated.userId],
    references: [users.telegramId],
  }),
}));

// ─── ChatJoinRequest Relations ───────────────────────────────────────

export const chatJoinRequestRelations = relations(chatJoinRequest, ({ one }) => ({
  chat: one(chats, {
    fields: [chatJoinRequest.chatId],
    references: [chats.telegramId],
  }),
  user: one(users, {
    fields: [chatJoinRequest.userId],
    references: [users.telegramId],
  }),
}));

// ─── ChatBoostUpdated Relations ──────────────────────────────────────

export const chatBoostUpdatedRelations = relations(chatBoostUpdated, ({ one }) => ({
  chat: one(chats, {
    fields: [chatBoostUpdated.chatId],
    references: [chats.telegramId],
  }),
}));

// ─── ChatBoostRemoved Relations ──────────────────────────────────────

export const chatBoostRemovedRelations = relations(chatBoostRemoved, ({ one }) => ({
  chat: one(chats, {
    fields: [chatBoostRemoved.chatId],
    references: [chats.telegramId],
  }),
}));
