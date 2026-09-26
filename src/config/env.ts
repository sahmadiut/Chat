/**
 * Environment Configuration
 *
 * Validates all required environment variables at startup using Zod.
 * If any variable is missing or has an invalid type, the process exits
 * immediately with a descriptive error message (fail-fast).
 *
 * Usage:
 *   import { env } from '#root/config/env.js';
 *   console.log(env.BOT_TOKEN);
 */

import 'dotenv/config';
import { z } from 'zod';

/**
 * Zod schema defining all environment variables and their constraints.
 * Every variable consumed anywhere in the app MUST be declared here.
 */
const envSchema = z
  .object({
    // ── Bot Core ──────────────────────────────────
    /** Telegram Bot API token from @BotFather */
    BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),

    /** Bot username without the @ sign (for deep linking / references) */
    BOT_USERNAME: z.string().min(1, 'BOT_USERNAME is required'),

    /** Primary admin Telegram chat ID for error alerts */
    ADMIN_CHAT_ID: z
      .string()
      .min(1, 'ADMIN_CHAT_ID is required')
      .transform(Number)
      .pipe(z.number().int().positive('ADMIN_CHAT_ID must be a positive integer')),

    /**
     * Comma-separated list of admin Telegram user IDs.
     * These users can use admin-only commands like /broadcast, /stats, etc.
     * If not set, only ADMIN_CHAT_ID is treated as admin.
     */
    ADMIN_IDS: z
      .string()
      .default('')
      .transform((val) => {
        if (!val.trim()) return [];
        return val
          .split(',')
          .map((id) => Number(id.trim()))
          .filter((id) => !Number.isNaN(id) && id > 0);
      }),

    // ── Bot Mode & Webhook ────────────────────────
    /** How the bot receives updates: long-polling (dev) or webhook (prod) */
    BOT_MODE: z.enum(['polling', 'webhook']).default('polling'),

    /** Public URL for webhook (required only in webhook mode) */
    WEBHOOK_URL: z.string().url().optional(),

    /** HTTPS URL for the Telegram Mini App (defaults to WEBHOOK_URL/webapp) */
    WEB_APP_URL: z.string().url().optional(),

    /** Port for the Fastify webhook server */
    PORT: z.string().default('3000').transform(Number).pipe(z.number().int().positive().max(65535)),

    /** Secret token to validate incoming Telegram webhook requests */
    WEBHOOK_SECRET: z.string().optional(),

    // ── Database ──────────────────────────────────
    /** PostgreSQL connection URL */
    DATABASE_URL: z
      .string()
      .min(1, 'DATABASE_URL is required')
      .url('DATABASE_URL must be a valid URL'),

    // ── Redis ─────────────────────────────────────
    /** Redis connection URL */
    REDIS_URL: z.string().min(1, 'REDIS_URL is required').default('redis://localhost:6379'),

    // ── Application ───────────────────────────────
    /** Default bot interface language ('fa' | 'en') */
    DEFAULT_LANGUAGE: z.enum(['fa', 'en']).default('fa'),

    /** Node environment */
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    /** Deployment boundary; staging and production use separate credentials and data stores. */
    APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),

    /** Pino log level */
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

    // ── Paths ─────────────────────────────────────
    /** Directory for storing log files */
    LOG_DIR: z.string().default('logs'),

    /** Directory for uploaded files */
    UPLOAD_DIR: z.string().default('uploads'),

    /** Directory for downloaded files */
    DOWNLOAD_DIR: z.string().default('downloads'),
  })
  .refine(
    (data) => {
      // WEBHOOK_URL is mandatory when BOT_MODE is "webhook"
      if (data.BOT_MODE === 'webhook' && !data.WEBHOOK_URL) {
        return false;
      }
      return true;
    },
    {
      message: 'WEBHOOK_URL is required when BOT_MODE is "webhook"',
      path: ['WEBHOOK_URL'],
    },
  )
  .refine(
    (data) => {
      // WEBHOOK_SECRET is strongly recommended when in webhook mode
      if (data.BOT_MODE === 'webhook' && !data.WEBHOOK_SECRET) {
        return false;
      }
      return true;
    },
    {
      message: 'WEBHOOK_SECRET is required when BOT_MODE is "webhook" (security best practice)',
      path: ['WEBHOOK_SECRET'],
    },
  )
  .superRefine((data, ctx) => {
    if (data.APP_ENV === 'development') {
      if (data.NODE_ENV === 'production') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['APP_ENV'],
          message: 'NODE_ENV=production requires APP_ENV=staging or production',
        });
      }
      return;
    }

    if (data.NODE_ENV !== 'production') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['NODE_ENV'],
        message: 'Staging and production require NODE_ENV=production',
      });
    }
    if (data.BOT_MODE !== 'webhook') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['BOT_MODE'],
        message: 'Staging and production require webhook mode',
      });
    }
    for (const key of ['WEBHOOK_URL', 'WEB_APP_URL'] as const) {
      const value = data[key];
      if (value && !value.startsWith('https://')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${key} must use HTTPS outside development`,
        });
      }
    }
  });

/** Inferred TypeScript type for the validated environment */
export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate `process.env` against the schema.
 * On failure, log all validation errors and exit immediately.
 */
function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(
      result.error.issues
        .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
        .join('\n'),
    );
    process.exit(1);
  }

  return Object.freeze(result.data);
}

/**
 * Validated, frozen environment object.
 * Import this wherever you need configuration values.
 */
export const env: Env = validateEnv();

/** Convenience helpers */
export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export const isPolling = env.BOT_MODE === 'polling';
export const isWebhook = env.BOT_MODE === 'webhook';

/**
 * Returns the full list of admin user IDs.
 * Merges ADMIN_CHAT_ID with ADMIN_IDS and deduplicates.
 */
export function getAdminIds(): number[] {
  const ids = new Set<number>([env.ADMIN_CHAT_ID, ...env.ADMIN_IDS]);
  return [...ids];
}
