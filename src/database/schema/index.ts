/**
 * Schema Barrel Export
 *
 * Re-exports all Drizzle table definitions, their inferred types,
 * and relation definitions from a single entry point.
 * This file is referenced by drizzle.config.ts and used by the
 * Drizzle instance to enable relational queries.
 */

export { users, type User, type NewUser } from './users.js';
export { botSettings, type BotSetting, type NewBotSetting } from './settings.js';
export { adminLogs, type AdminLog, type NewAdminLog } from './admin-logs.js';
export {
  chats,
  chatTypeEnum,
  userChat,
  chatMemberUpdated,
  chatJoinRequest,
  chatBoostUpdated,
  chatBoostRemoved,
  type Chat,
  type NewChat,
  type ChatMemberUpdatedRow,
  type NewChatMemberUpdatedRow,
  type ChatJoinRequestRow,
  type NewChatJoinRequestRow,
  type ChatBoostUpdatedRow,
  type NewChatBoostUpdatedRow,
  type ChatBoostRemovedRow,
  type NewChatBoostRemovedRow,
} from './chats.js';
export {
  conversations,
  conversationStatusEnum,
  type Conversation,
  type NewConversation,
} from './conversations.js';
export {
  messages,
  messageTypeEnum,
  messageDirectionEnum,
  type Message,
  type NewMessage,
} from './messages.js';
export {
  notificationPreferences,
  notificationTemplates,
  type NotificationPreference,
  type NewNotificationPreference,
  type NotificationTemplate,
  type NewNotificationTemplate,
} from './notifications.js';

// Relations (must be exported for Drizzle's relational query API)
export {
  usersRelations,
  chatsRelations,
  userChatRelations,
  conversationsRelations,
  notificationPreferencesRelations,
  chatMemberUpdatedRelations,
  chatJoinRequestRelations,
  chatBoostUpdatedRelations,
  chatBoostRemovedRelations,
} from './relations.js';
