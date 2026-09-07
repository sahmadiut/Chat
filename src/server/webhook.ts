/**
 * Webhook Server (Fastify)
 *
 * Production-grade webhook server for receiving Telegram updates
 * via HTTP POST. Uses Fastify for its high performance and
 * grammY's built-in `webhookCallback` adapter.
 *
 * Features:
 * - Validates incoming requests using WEBHOOK_SECRET
 * - Telegram IP allowlist validation
 * - Health check endpoint at GET /health
 * - Liveness probe at GET /livez
 * - Graceful shutdown support
 */

import Fastify from 'fastify';
import { webhookCallback } from 'grammy';
import { z } from 'zod';
import { bot } from '#root/bot/bot.js';
import { validateWebAppInitData } from '#root/bot/features/web-app/web-app.validation.js';
import { env } from '#root/config/env.js';
import { createLogger } from '#root/utils/logger.js';
import { webAppHtml } from './web-app.page.js';

const log = createLogger('WebhookServer');

// ─── Telegram IP Allowlist ───────────────────────────────────────────

/**
 * Official Telegram Bot API IP ranges.
 * See: https://core.telegram.org/bots/webhooks#the-short-version
 */
const TELEGRAM_IP_RANGES = ['149.154.160.0/20', '91.108.4.0/22'];

/**
 * Convert CIDR to an IP range check function.
 */
function cidrToRange(cidr: string): { start: number; end: number } {
  const [ip, bits] = cidr.split('/');
  const ipNum = (ip ?? '').split('.').reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
  const mask = (~0 << (32 - Number(bits ?? '0'))) >>> 0;
  return { start: (ipNum & mask) >>> 0, end: ((ipNum & mask) | ~mask) >>> 0 };
}

const ALLOWED_RANGES = TELEGRAM_IP_RANGES.map(cidrToRange);

/**
 * Check if an IP address is within Telegram's known IP ranges.
 */
function isTelegramIp(ip: string): boolean {
  // In development, allow any IP (localhost, etc.)
  if (env.NODE_ENV === 'development') return true;

  // Strip IPv6 prefix (::ffff:)
  const cleanIp = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  const parts = cleanIp.split('.');
  if (parts.length !== 4) return true; // Allow if not IPv4 (could be proxy)

  const ipNum = parts.reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;

  return ALLOWED_RANGES.some((range) => ipNum >= range.start && ipNum <= range.end);
}

// ─── Server Instance ─────────────────────────────────────────────────

/**
 * Fastify server instance.
 * Configured with a generous timeout for long-running webhook processing.
 */
const server = Fastify({
  logger: false, // We use Pino directly, not Fastify's built-in logger
  bodyLimit: 1048576, // 1MB — Telegram updates are small
  requestTimeout: 30000, // 30s timeout
  trustProxy: true, // Trust X-Forwarded-For for IP extraction behind reverse proxies
});

const BOT_WEBHOOK_PATH = `/${env.BOT_TOKEN}`;
const webAppValidationSchema = z.object({
  initData: z.string().min(1).max(16_384),
});

// ─── IP Allowlist Hook ───────────────────────────────────────────────

/**
 * Validate that webhook requests come from Telegram's IP ranges.
 * Only applies to POST requests to the webhook endpoint.
 */
server.addHook('onRequest', async (request, reply) => {
  // Browser-facing Mini App routes are authenticated with init-data HMAC.
  // The Telegram IP allowlist only applies to the Bot API webhook itself.
  if (request.method !== 'POST' || request.url.split('?', 1)[0] !== BOT_WEBHOOK_PATH) return;

  const clientIp = request.ip;
  if (!isTelegramIp(clientIp)) {
    log.warn({ ip: clientIp }, 'Rejected webhook request from non-Telegram IP');
    reply.code(403).send({ error: 'Forbidden' });
    return;
  }
});

// ─── Routes ──────────────────────────────────────────────────────────

/**
 * Health check endpoint.
 * Useful for load balancers and uptime monitoring.
 */
server.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: 'webhook',
    uptime: process.uptime(),
  };
});

/**
 * Liveness probe endpoint.
 * Returns a minimal 200 response for Kubernetes/container orchestrator probes.
 */
server.get('/livez', async () => {
  return { alive: true };
});

/** Minimal Mini App page; replace its form with the project's domain UI. */
server.get('/webapp', async (_request, reply) => {
  return reply
    .header(
      'content-security-policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://telegram.org; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:",
    )
    .header('x-content-type-options', 'nosniff')
    .type('text/html; charset=utf-8')
    .send(webAppHtml);
});

/** Validate browser-supplied Telegram init data before accepting Mini App actions. */
server.post('/webapp/validate', async (request, reply) => {
  const body = webAppValidationSchema.safeParse(request.body);
  if (!body.success) return reply.code(400).send({ valid: false });

  try {
    const initData = validateWebAppInitData(body.data.initData, env.BOT_TOKEN);
    return {
      valid: true,
      user: initData.user
        ? {
            id: initData.user.id,
            firstName: initData.user.first_name,
            username: initData.user.username,
          }
        : undefined,
    };
  } catch (error) {
    log.warn({ error }, 'Rejected invalid Telegram Mini App init data');
    return reply.code(401).send({ valid: false });
  }
});

/**
 * Webhook endpoint.
 * Receives Telegram updates via POST and processes them through
 * the grammY middleware pipeline.
 *
 * The `secretToken` option validates that requests actually come
 * from Telegram (they include the secret in the X-Telegram-Bot-Api-Secret-Token header).
 */
server.post(
  BOT_WEBHOOK_PATH,
  webhookCallback(bot, 'fastify', {
    secretToken: env.WEBHOOK_SECRET,
  }),
);

// ─── Server Lifecycle ────────────────────────────────────────────────

/**
 * Start the Fastify webhook server.
 * Listens on the configured PORT on all interfaces (0.0.0.0).
 */
export async function startWebhookServer(): Promise<void> {
  try {
    const address = await server.listen({
      port: env.PORT,
      host: '0.0.0.0',
    });
    log.info({ address, port: env.PORT }, '🌐 Webhook server started');
  } catch (err) {
    log.fatal({ err }, 'Failed to start webhook server');
    process.exit(1);
  }
}

/**
 * Gracefully stop the webhook server.
 * Finishes processing active requests before closing.
 */
export async function stopWebhookServer(): Promise<void> {
  log.info('Stopping webhook server...');
  await server.close();
  log.info('Webhook server stopped');
}

/** Export the server instance for external access (e.g., bull-board) */
export { server };
