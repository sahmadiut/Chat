/**
 * Bot Instance Initialization & Plugin Wiring
 *
 * Creates the grammY Bot instance and wires all plugins, middlewares,
 * conversations, and feature modules in the correct order.
 *
 * ┌───────────────────────────────────────────────────────────────┐
 * │  MIDDLEWARE ORDER MATTERS!                                    │
 * │                                                               │
 * │  1. Rate Limiter      — Drop spammy updates early             │
 * │  1.5 Sanitizer        — Strip dangerous HTML/scripts          │
 * │  2. Logger            — Record user interaction details        │
 * │  3. Session            — Load Redis-backed session data        │
 * │  4. i18n              — Set up translation context             │
 * │  5. Conversations     — Enable conversation state machine      │
 * │  6. Auto-Upsert       — Capture user/chat data to DB          │
 * │  7. Features          — Command handlers & business logic      │
 * └───────────────────────────────────────────────────────────────┘
 *
 * Usage:
 *   import { bot } from '#root/bot/bot.js';
 *   // bot is fully configured and ready to be started
 */

import { autoRetry } from '@grammyjs/auto-retry';
import { conversations, createConversation } from '@grammyjs/conversations';
import { Bot } from 'grammy';
import { env } from '#root/config/env.js';
import { handleGlobalError } from '#root/utils/errors.js';
import { createLogger } from '#root/utils/logger.js';
import type { BotContext, BotConversationContext } from './context.js';
import {
  DEFAULT_CONVERSATION_TIMEOUT_MS,
  trackConversationEnter,
  trackConversationExit,
  withConversationAnalytics,
} from './conversations/conversation-utils.js';
import { exampleConversation } from './conversations/example.conversation.js';
import {
  broadcastConversation,
  directMessageConversation,
  editWelcomeMessageConversation,
  searchUserConversation,
} from './features/admin/admin.conversations.js';
import { features } from './features/index.js';
import {
  editProfileNameConversation,
  supportConversation,
} from './features/start/user.conversations.js';
import { i18n } from './i18n/i18n.js';
import {
  createBanGuardMiddleware,
  createLoggerMiddleware,
  createMaintenanceMiddleware,
  createRateLimiterMiddleware,
  createSanitizerMiddleware,
  createSessionMiddleware,
  createUpsertMiddleware,
} from './middlewares/index.js';

const log = createLogger('Bot');

// ─── Create Bot Instance ─────────────────────────────────────────────

export const bot = new Bot<BotContext>(env.BOT_TOKEN);

// ─── API-Level Plugins (Transformers) ────────────────────────────────

/**
 * auto-retry: Automatically retry Telegram API calls on 429 errors.
 * This operates at the API level (not middleware level).
 */
bot.api.config.use(
  autoRetry({
    maxRetryAttempts: 5,
    maxDelaySeconds: 60,
  }),
);

// ─── Middleware Pipeline ─────────────────────────────────────────────

// 1. Rate limiter — drop spammy users before any processing
bot.use(createRateLimiterMiddleware());

// 1.5. Input sanitizer — strip dangerous HTML/scripts from user input
bot.use(createSanitizerMiddleware());

// 2. Action logger — record user interaction details
bot.use(createLoggerMiddleware());

// 3. Session — load user session from Redis (required by conversations, i18n & guards)
bot.use(createSessionMiddleware());

// 4. i18n — set up translation context for ctx.t()
bot.use(i18n);

// 4.2. Ban Guard — drop banned users (localized with ctx.t)
bot.use(createBanGuardMiddleware());

// 4.5. Maintenance Mode — block non-admins when maintenance is active (localized with ctx.t)
bot.use(createMaintenanceMiddleware());

// 5. Conversations — enable multi-step conversation state machine.
// Conversation contexts are created from scratch during replay, so plugins
// used inside builders must be installed explicitly for those inner contexts.
bot.use(
  conversations<BotContext, BotConversationContext>({
    plugins: [i18n],
    onEnter: trackConversationEnter,
    onExit: trackConversationExit,
  }),
);

// 6. Register individual conversations with a default inactivity timeout
const conversationOptions = (id: string) => ({
  id,
  maxMillisecondsToWait: DEFAULT_CONVERSATION_TIMEOUT_MS,
});

bot.use(
  createConversation(
    withConversationAnalytics('example', exampleConversation),
    conversationOptions('example'),
  ),
);
bot.use(
  createConversation(
    withConversationAnalytics('searchUserConversation', searchUserConversation),
    conversationOptions('searchUserConversation'),
  ),
);
bot.use(
  createConversation(
    withConversationAnalytics('directMessageConversation', directMessageConversation),
    conversationOptions('directMessageConversation'),
  ),
);
bot.use(
  createConversation(
    withConversationAnalytics('broadcastConversation', broadcastConversation),
    conversationOptions('broadcastConversation'),
  ),
);
bot.use(
  createConversation(
    withConversationAnalytics('editWelcomeMessageConversation', editWelcomeMessageConversation),
    conversationOptions('editWelcomeMessageConversation'),
  ),
);
bot.use(
  createConversation(
    withConversationAnalytics('supportConversation', supportConversation),
    conversationOptions('supportConversation'),
  ),
);
bot.use(
  createConversation(
    withConversationAnalytics('editProfileNameConversation', editProfileNameConversation),
    conversationOptions('editProfileNameConversation'),
  ),
);

// 7. Auto-upsert — capture user/chat data to PostgreSQL
bot.use(createUpsertMiddleware());

// 8. Feature modules — command handlers & business logic
bot.use(features);

// ─── Global Error Handler ────────────────────────────────────────────

/**
 * Catches all unhandled errors from the middleware pipeline.
 * Logs the error, alerts the admin, and prevents bot crashes.
 */
bot.catch(async (err) => {
  const ctx = err.ctx;

  log.error(
    {
      updateId: ctx.update.update_id,
      userId: ctx.from?.id,
      chatId: ctx.chat?.id,
      error: err.error,
    },
    `Error handling update ${ctx.update.update_id}`,
  );

  await handleGlobalError(err.error, {
    updateId: ctx.update.update_id,
    userId: ctx.from?.id,
    chatId: ctx.chat?.id,
  });
});

log.info('Bot instance created and configured');
