/**
 * Environment Configuration — Unit Tests
 *
 * Tests the Zod schema validation for environment variables.
 * Since env.ts runs validation at module load time and exits on failure,
 * we test the schema directly rather than importing the module.
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

/**
 * Reproduce the env schema from env.ts for isolated testing.
 * This avoids triggering the process.exit() on import.
 */
const envSchema = z
  .object({
    BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),
    BOT_USERNAME: z.string().min(1, 'BOT_USERNAME is required'),
    ADMIN_CHAT_ID: z
      .string()
      .min(1, 'ADMIN_CHAT_ID is required')
      .transform(Number)
      .pipe(z.number().int().positive('ADMIN_CHAT_ID must be a positive integer')),
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
    BOT_MODE: z.enum(['polling', 'webhook']).default('polling'),
    WEBHOOK_URL: z.string().url().optional(),
    WEB_APP_URL: z.string().url().optional(),
    PORT: z.string().default('3000').transform(Number).pipe(z.number().int().positive().max(65535)),
    WEBHOOK_SECRET: z.string().optional(),
    DATABASE_URL: z
      .string()
      .min(1, 'DATABASE_URL is required')
      .url('DATABASE_URL must be a valid URL'),
    REDIS_URL: z.string().min(1, 'REDIS_URL is required').default('redis://localhost:6379'),
    DEFAULT_LANGUAGE: z.enum(['fa', 'en']).default('fa'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    LOG_DIR: z.string().default('logs'),
    UPLOAD_DIR: z.string().default('uploads'),
    DOWNLOAD_DIR: z.string().default('downloads'),
  })
  .refine(
    (data) => {
      if (data.BOT_MODE === 'webhook' && !data.WEBHOOK_URL) return false;
      return true;
    },
    {
      message: 'WEBHOOK_URL is required when BOT_MODE is "webhook"',
      path: ['WEBHOOK_URL'],
    },
  )
  .refine(
    (data) => {
      if (data.BOT_MODE === 'webhook' && !data.WEBHOOK_SECRET) return false;
      return true;
    },
    {
      message: 'WEBHOOK_SECRET is required when BOT_MODE is "webhook"',
      path: ['WEBHOOK_SECRET'],
    },
  );

/** Minimal valid env for polling mode */
const validPollingEnv = {
  BOT_TOKEN: '123456:ABC-DEF',
  BOT_USERNAME: 'test_bot',
  ADMIN_CHAT_ID: '123456789',
  BOT_MODE: 'polling',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  REDIS_URL: 'redis://localhost:6379',
};

/** Minimal valid env for webhook mode */
const validWebhookEnv = {
  ...validPollingEnv,
  BOT_MODE: 'webhook',
  WEBHOOK_URL: 'https://bot.example.com',
  WEBHOOK_SECRET: 'my-secret',
};

describe('Environment Validation', () => {
  // ─── Valid Scenarios ────────────────────────────────────────────────

  describe('valid environments', () => {
    it('should accept valid polling mode configuration', () => {
      const result = envSchema.safeParse(validPollingEnv);
      expect(result.success).toBe(true);
    });

    it('should accept valid webhook mode configuration', () => {
      const result = envSchema.safeParse(validWebhookEnv);
      expect(result.success).toBe(true);
    });

    it('should apply defaults for optional fields', () => {
      const result = envSchema.safeParse(validPollingEnv);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.DEFAULT_LANGUAGE).toBe('fa');
        expect(result.data.NODE_ENV).toBe('development');
        expect(result.data.LOG_LEVEL).toBe('info');
        expect(result.data.PORT).toBe(3000);
        expect(result.data.LOG_DIR).toBe('logs');
        expect(result.data.UPLOAD_DIR).toBe('uploads');
        expect(result.data.DOWNLOAD_DIR).toBe('downloads');
      }
    });

    it('should transform ADMIN_CHAT_ID to number', () => {
      const result = envSchema.safeParse(validPollingEnv);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ADMIN_CHAT_ID).toBe(123456789);
        expect(typeof result.data.ADMIN_CHAT_ID).toBe('number');
      }
    });

    it('should transform PORT to number', () => {
      const result = envSchema.safeParse({ ...validPollingEnv, PORT: '8080' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PORT).toBe(8080);
      }
    });
  });

  // ─── ADMIN_IDS Parsing ────────────────────────────────────────────

  describe('ADMIN_IDS parsing', () => {
    it('should parse comma-separated numbers correctly', () => {
      const result = envSchema.safeParse({
        ...validPollingEnv,
        ADMIN_IDS: '111,222,333',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ADMIN_IDS).toEqual([111, 222, 333]);
      }
    });

    it('should handle whitespace around IDs', () => {
      const result = envSchema.safeParse({
        ...validPollingEnv,
        ADMIN_IDS: ' 111 , 222 , 333 ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ADMIN_IDS).toEqual([111, 222, 333]);
      }
    });

    it('should return empty array when ADMIN_IDS is empty', () => {
      const result = envSchema.safeParse({
        ...validPollingEnv,
        ADMIN_IDS: '',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ADMIN_IDS).toEqual([]);
      }
    });

    it('should return empty array when ADMIN_IDS is not set (default)', () => {
      const result = envSchema.safeParse(validPollingEnv);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ADMIN_IDS).toEqual([]);
      }
    });

    it('should filter out invalid (non-numeric) entries', () => {
      const result = envSchema.safeParse({
        ...validPollingEnv,
        ADMIN_IDS: '111,abc,333',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ADMIN_IDS).toEqual([111, 333]);
      }
    });

    it('should filter out negative numbers', () => {
      const result = envSchema.safeParse({
        ...validPollingEnv,
        ADMIN_IDS: '111,-5,333',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ADMIN_IDS).toEqual([111, 333]);
      }
    });

    it('should handle a single ID', () => {
      const result = envSchema.safeParse({
        ...validPollingEnv,
        ADMIN_IDS: '42',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ADMIN_IDS).toEqual([42]);
      }
    });
  });

  // ─── Missing Required Fields ────────────────────────────────────────

  describe('missing required fields', () => {
    it('should fail when BOT_TOKEN is missing', () => {
      const { BOT_TOKEN, ...env } = validPollingEnv;
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it('should fail when BOT_USERNAME is missing', () => {
      const { BOT_USERNAME, ...env } = validPollingEnv;
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it('should fail when ADMIN_CHAT_ID is missing', () => {
      const { ADMIN_CHAT_ID, ...env } = validPollingEnv;
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it('should fail when DATABASE_URL is missing', () => {
      const { DATABASE_URL, ...env } = validPollingEnv;
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });
  });

  // ─── Invalid Values ────────────────────────────────────────────────

  describe('invalid values', () => {
    it('should fail when BOT_TOKEN is empty', () => {
      const result = envSchema.safeParse({ ...validPollingEnv, BOT_TOKEN: '' });
      expect(result.success).toBe(false);
    });

    it('should fail when ADMIN_CHAT_ID is not a number', () => {
      const result = envSchema.safeParse({
        ...validPollingEnv,
        ADMIN_CHAT_ID: 'not-a-number',
      });
      expect(result.success).toBe(false);
    });

    it('should fail when ADMIN_CHAT_ID is negative', () => {
      const result = envSchema.safeParse({
        ...validPollingEnv,
        ADMIN_CHAT_ID: '-1',
      });
      expect(result.success).toBe(false);
    });

    it('should fail when BOT_MODE is invalid', () => {
      const result = envSchema.safeParse({
        ...validPollingEnv,
        BOT_MODE: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should fail when DATABASE_URL is not a valid URL', () => {
      const result = envSchema.safeParse({
        ...validPollingEnv,
        DATABASE_URL: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('should fail when NODE_ENV is not a valid value', () => {
      const result = envSchema.safeParse({
        ...validPollingEnv,
        NODE_ENV: 'staging',
      });
      expect(result.success).toBe(false);
    });

    it('should fail when PORT exceeds 65535', () => {
      const result = envSchema.safeParse({
        ...validPollingEnv,
        PORT: '99999',
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── Webhook Mode Validations ──────────────────────────────────────

  describe('webhook mode constraints', () => {
    it('should fail when webhook mode is set but WEBHOOK_URL is missing', () => {
      const result = envSchema.safeParse({
        ...validPollingEnv,
        BOT_MODE: 'webhook',
        WEBHOOK_SECRET: 'secret',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const webhookUrlIssue = result.error.issues.find((i) => i.path.includes('WEBHOOK_URL'));
        expect(webhookUrlIssue).toBeDefined();
      }
    });

    it('should fail when webhook mode is set but WEBHOOK_SECRET is missing', () => {
      const result = envSchema.safeParse({
        ...validPollingEnv,
        BOT_MODE: 'webhook',
        WEBHOOK_URL: 'https://bot.example.com',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const secretIssue = result.error.issues.find((i) => i.path.includes('WEBHOOK_SECRET'));
        expect(secretIssue).toBeDefined();
      }
    });

    it('should not require WEBHOOK_URL/SECRET in polling mode', () => {
      const result = envSchema.safeParse(validPollingEnv);
      expect(result.success).toBe(true);
    });
  });
});
