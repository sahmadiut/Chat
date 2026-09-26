/**
 * Application Bootstrap — Main Entry Point
 *
 * Orchestrates the startup and shutdown of all application components:
 * - Environment validation (fail-fast)
 * - Database connection (PostgreSQL via Drizzle)
 * - Redis connection (ioredis)
 * - BullMQ workers (broadcast, notification)
 * - Bot startup (dual-mode: polling or webhook)
 * - Graceful shutdown on SIGINT/SIGTERM
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  DUAL-MODE STARTUP                                              │
 * │                                                                  │
 * │  BOT_MODE=polling  → Uses @grammyjs/runner for concurrent       │
 * │                       long-polling (development)                 │
 * │                                                                  │
 * │  BOT_MODE=webhook  → Starts Fastify server to receive           │
 * │                       webhook callbacks (production)             │
 * └──────────────────────────────────────────────────────────────────┘
 */

import { type RunnerHandle, run } from '@grammyjs/runner';
import { bot } from '#root/bot/bot.js';
import { getBotCommands } from '#root/bot/commands.js';
import { closeRedis } from '#root/cache/index.js';
import { env, getAdminIds, isPolling, isWebhook } from '#root/config/env.js';
import { closeDatabase } from '#root/database/index.js';
import { closeQueues } from '#root/queue/index.js';
import { createLogger } from '#root/utils/logger.js';

const log = createLogger('Main');

// ─── State ───────────────────────────────────────────────────────────

/** Runner handle (only in polling mode) */
let runnerHandle: RunnerHandle | undefined;

/** Flag to prevent multiple shutdowns */
let isShuttingDown = false;

// ─── Graceful Shutdown ───────────────────────────────────────────────

/**
 * Gracefully shuts down all components in the correct order:
 * 1. Stop the bot (runner or webhook server)
 * 2. Close BullMQ workers (wait for active jobs to finish)
 * 3. Close Redis connection
 * 4. Close database connection pool
 * 5. Exit the process
 */
async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    log.warn('Shutdown already in progress — ignoring duplicate signal');
    return;
  }
  isShuttingDown = true;

  log.info({ signal }, `Received ${signal} — starting graceful shutdown...`);

  try {
    // 1. Stop the bot
    if (isPolling && runnerHandle) {
      log.info('Stopping bot runner (polling)...');
      runnerHandle.stop();
      log.info('Bot runner stopped');
    }

    if (isWebhook) {
      log.info('Stopping webhook server...');
      const { stopWebhookServer } = await import('#root/server/webhook.js');
      await stopWebhookServer();
    }

    // 2. Close BullMQ workers and queues
    await closeQueues();

    // 3. Close Redis
    await closeRedis();

    // 4. Close database
    await closeDatabase();

    log.info('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (err) {
    log.error({ err }, '❌ Error during graceful shutdown');
    process.exit(1);
  }
}

// ─── Bootstrap ───────────────────────────────────────────────────────

async function main(): Promise<void> {
  log.info(
    {
      mode: env.BOT_MODE,
      environment: env.NODE_ENV,
      deployment: env.APP_ENV,
      logLevel: env.LOG_LEVEL,
    },
    '🚀 Starting Telegram bot...',
  );

  // Register shutdown handlers
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  // Handle uncaught exceptions and unhandled rejections
  process.on('uncaughtException', (err) => {
    log.fatal({ err }, 'Uncaught exception — initiating shutdown');
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    log.fatal({ err: reason }, 'Unhandled rejection — initiating shutdown');
    gracefulShutdown('unhandledRejection');
  });

  // ── Ensure database & schema ──
  const { ensureDatabase } = await import('#root/database/index.js');
  await ensureDatabase();

  // ── Initialize bot info ──
  // This call verifies the bot token and fetches bot metadata
  await bot.init();
  log.info(
    { botId: bot.botInfo.id, username: bot.botInfo.username },
    `Bot initialized as @${bot.botInfo.username}`,
  );

  // ── Register localized public commands and private admin commands ──
  const defaultLanguage = env.DEFAULT_LANGUAGE ?? 'fa';
  const defaultCommands = getBotCommands(defaultLanguage, false);
  const englishCommands = getBotCommands('en', false);
  const persianCommands = getBotCommands('fa', false);

  await Promise.all([
    // Default commands (for clients without specific language)
    bot.api.setMyCommands(defaultCommands),
    // Language-specific command registrations
    bot.api.setMyCommands(englishCommands, { language_code: 'en' }),
    bot.api.setMyCommands(persianCommands, { language_code: 'fa' }),
    ...getAdminIds().flatMap((chatId) => {
      const scope = { type: 'chat' as const, chat_id: chatId };
      return [
        bot.api.setMyCommands(getBotCommands(defaultLanguage, true), { scope }),
        bot.api.setMyCommands(getBotCommands('en', true), { scope, language_code: 'en' }),
        bot.api.setMyCommands(getBotCommands('fa', true), { scope, language_code: 'fa' }),
      ];
    }),
  ]);
  log.info('Bot commands registered');

  // ── Start in the appropriate mode ──
  if (isPolling) {
    // ── Long-Polling Mode (Development) ──
    log.info('Starting in POLLING mode (long-polling via @grammyjs/runner)...');

    // Delete any existing webhook before starting polling
    await bot.api.deleteWebhook({ drop_pending_updates: true });

    runnerHandle = run(bot, {
      runner: {
        fetch: {
          allowed_updates: [
            'message',
            'edited_message',
            'callback_query',
            'inline_query',
            'chat_member',
            'my_chat_member',
          ],
        },
      },
    });

    log.info('✅ Bot is running in POLLING mode');
  } else if (isWebhook) {
    // ── Webhook Mode (Production) ──
    log.info('Starting in WEBHOOK mode (Fastify server)...');

    const { startWebhookServer } = await import('#root/server/webhook.js');
    await startWebhookServer();

    log.info('✅ Bot is running in WEBHOOK mode');
    log.info('💡 Run "npm run webhook:set" to register the webhook URL with Telegram');
  }
}

// ─── Run ─────────────────────────────────────────────────────────────

main().catch((err) => {
  log.fatal({ err }, '❌ Fatal error during startup');
  process.exit(1);
});
