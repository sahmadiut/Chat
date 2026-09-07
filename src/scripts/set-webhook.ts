/**
 * Set Webhook Script
 *
 * Standalone CLI script that configures the Telegram webhook URL
 * for the bot. Run this once after deployment or whenever the
 * webhook URL changes.
 *
 * Usage:
 *   npm run webhook:set
 *   # or: npx tsx src/scripts/set-webhook.ts
 *
 * Reads configuration from .env and calls the Telegram Bot API
 * to register the webhook URL and secret token.
 */

import { Api } from 'grammy';
import { env } from '#root/config/env.js';
import { createLogger } from '#root/utils/logger.js';

const log = createLogger('SetWebhook');

async function main(): Promise<void> {
  if (!env.WEBHOOK_URL) {
    log.fatal('WEBHOOK_URL is not set in .env — cannot set webhook');
    process.exit(1);
  }

  const api = new Api(env.BOT_TOKEN);
  const webhookUrl = `${env.WEBHOOK_URL}/${env.BOT_TOKEN}`;

  log.info({ webhookUrl }, 'Setting webhook...');

  try {
    // Set the webhook with Telegram
    await api.setWebhook(webhookUrl, {
      // Secret token for validating incoming requests
      secret_token: env.WEBHOOK_SECRET,

      // Specify which update types the bot should receive
      // This reduces unnecessary traffic from Telegram
      allowed_updates: [
        'message',
        'edited_message',
        'callback_query',
        'inline_query',
        'chat_member',
        'my_chat_member',
      ],

      // Drop pending updates on webhook change (clean slate)
      drop_pending_updates: false,

      // Maximum number of simultaneous connections (1-100, default 40)
      max_connections: 100,
    });

    // Verify the webhook was set correctly
    const info = await api.getWebhookInfo();

    log.info(
      {
        url: info.url,
        hasCustomCertificate: info.has_custom_certificate,
        pendingUpdateCount: info.pending_update_count,
        maxConnections: info.max_connections,
        allowedUpdates: info.allowed_updates,
      },
      '✅ Webhook set successfully!',
    );
  } catch (err) {
    log.fatal({ err }, '❌ Failed to set webhook');
    process.exit(1);
  }
}

main();
