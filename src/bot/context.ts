/**
 * Custom Bot Context
 *
 * Composes grammY's base `Context` with all plugin flavors
 * to create a single, fully-typed context used across the entire bot.
 *
 * This module defines TWO context types:
 *
 * 1. `BotContext` — The OUTER context used in the middleware tree.
 *    Includes `ConversationFlavor` so handlers can call `ctx.conversation.enter()`.
 *
 * 2. `BotConversationContext` — The INNER context used inside conversations.
 *    Does NOT include `ConversationFlavor` (you cannot nest conversations).
 *    This is the `ctx` type your conversation builder functions receive.
 *
 * Session data uses a multi-key strategy:
 *   - `ctx.session.custom` — Regular session data (language, preferences, etc.)
 *   - `ctx.session.conversation` — Managed by the conversations plugin internally
 *
 * Adding a new plugin? Merge its flavor type into BOTH contexts if needed.
 */

import type { ConversationFlavor } from '@grammyjs/conversations';
import type { I18nFlavor } from '@grammyjs/i18n';
import type { Context, LazySessionFlavor } from 'grammy';

// ─── Session Data ────────────────────────────────────────────────────

/**
 * Session data shape stored in Redis under the `custom` key.
 * Start empty — add fields as features require them.
 */
export interface SessionData {
  /** Language code for i18n */
  __language_code?: string;
}

/**
 * Multi-key session structure. The `custom` key holds our app session data,
 * while `conversation` is managed by the conversations plugin.
 */
interface MultiSessionData {
  custom: SessionData;
  conversation: unknown;
}

// ─── Inner Conversation Context ──────────────────────────────────────

/**
 * Context type used INSIDE conversation builder functions.
 * Does NOT include ConversationFlavor (conversations cannot be nested).
 */
export type BotConversationContext = Context & LazySessionFlavor<MultiSessionData> & I18nFlavor;

// ─── Outer Bot Context ──────────────────────────────────────────────

/**
 * The unified bot context type for the OUTER middleware tree.
 * Every handler and middleware in the application uses this type.
 *
 * Composed of:
 * - `BotConversationContext` — Base context with multi-key session + i18n
 * - `ConversationFlavor<>`  — Conversation control methods (ctx.conversation.enter)
 */
export type BotContext = ConversationFlavor<BotConversationContext>;
