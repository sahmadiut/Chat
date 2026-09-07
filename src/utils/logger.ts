/**
 * Logger Configuration (Pino)
 *
 * Provides structured, high-performance JSON logging in production
 * and human-readable colorized output in development via pino-pretty.
 *
 * Three logging modes:
 *   1. App logger   — single rolling file + console (module-scoped child loggers)
 *   2. User logger  — per-user file at logs/users/{userId}.log
 *   3. Module logger — per-module file at logs/modules/{moduleName}.log
 *
 * Usage:
 *   import { createLogger, createUserLogger, createModuleLogger } from '#root/utils/logger.js';
 *
 *   const log = createLogger('UserService');        // app log (module-scoped)
 *   const userLog = createUserLogger(123456);       // per-user file
 *   const modLog = createModuleLogger('payments');  // per-module file
 */

import fs from 'node:fs';
import path from 'node:path';
import pino from 'pino';
import type { Logger } from 'pino';
import { env, isDev } from '#root/config/env.js';

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Ensure a directory exists, creating it recursively if needed.
 */
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ─── App Logger (rolling file + console) ─────────────────────────────

/**
 * Build the Pino transport configuration for the main app logger.
 * In development: pipes to pino-pretty for colorized, human-readable logs.
 * In production: uses the default Pino JSON output for log aggregation.
 */
function buildTransport(): pino.TransportMultiOptions {
  const targets: pino.TransportTargetOptions[] = [
    {
      target: 'pino-roll',
      options: {
        file: `${env.LOG_DIR}/app`,
        frequency: 'daily',
        mkdir: true,
        extension: '.log',
      },
    },
  ];

  if (isDev) {
    targets.push({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss.l',
        ignore: 'pid,hostname',
      },
    });
  } else {
    targets.push({
      target: 'pino/file',
      options: { destination: 1 }, // stdout
    });
  }

  return { targets };
}

/**
 * Root logger instance.
 * All modules should use `createLogger('ModuleName')` for scoped logging.
 */
export const logger: Logger = pino({
  level: env.LOG_LEVEL,
  transport: buildTransport(),
  // Add the application name to every log line in production
  ...(isDev ? {} : { name: 'telegram-bot' }),
});

/**
 * Factory to create a child logger with a module name.
 * Writes to the main app log file.
 *
 * @param moduleName - The name of the module (e.g., 'Database', 'Redis', 'BullMQ')
 * @returns A child Pino logger instance
 *
 * @example
 * const log = createLogger('UserService');
 * log.info({ userId: 42 }, 'User created');
 */
export function createLogger(moduleName: string): Logger {
  return logger.child({ module: moduleName });
}

// ─── Per-User Logger ──────────────────────────────────────────────────

/** In-memory cache of per-user loggers to avoid re-creating streams */
const userLoggers = new Map<number, Logger>();

/**
 * Get or create a Pino logger that writes to `logs/users/{userId}.log`.
 * Each user gets their own file, making it easy to audit a specific user's
 * interactions without grepping through the main app log.
 *
 * The logger is cached per-process so only one stream is opened per user.
 *
 * @param userId - Telegram user ID
 * @returns A Pino logger instance scoped to that user
 *
 * @example
 * const userLog = createUserLogger(ctx.from.id);
 * userLog.info({ command: '/start' }, 'User started the bot');
 */
export function createUserLogger(userId: number): Logger {
  const cached = userLoggers.get(userId);
  if (cached) return cached;

  const userLogDir = path.join(env.LOG_DIR, 'users');
  ensureDir(userLogDir);

  const filePath = path.join(userLogDir, `${userId}.log`);
  const stream = fs.createWriteStream(filePath, { flags: 'a' });

  const userLogger = pino(
    {
      level: env.LOG_LEVEL,
      base: { userId },
    },
    stream,
  );

  userLoggers.set(userId, userLogger);
  return userLogger;
}

// ─── Per-Module Logger ────────────────────────────────────────────────

/** In-memory cache of per-module file loggers */
const moduleFileLoggers = new Map<string, Logger>();

/**
 * Get or create a Pino logger that writes to `logs/modules/{moduleName}.log`.
 * Unlike `createLogger()` (which writes to the rolling app log), this writes
 * to a dedicated file for the module — useful for high-traffic modules where
 * you want their logs isolated (e.g., a payments or broadcast module).
 *
 * The logger is cached per-process so only one stream is opened per module.
 *
 * @param moduleName - A stable identifier for the module (lowercase, no spaces)
 * @returns A Pino logger instance writing to logs/modules/{moduleName}.log
 *
 * @example
 * const log = createModuleLogger('broadcast');
 * log.info({ jobId }, 'Broadcast job started');
 */
export function createModuleLogger(moduleName: string): Logger {
  const cached = moduleFileLoggers.get(moduleName);
  if (cached) return cached;

  const moduleLogDir = path.join(env.LOG_DIR, 'modules');
  ensureDir(moduleLogDir);

  const filePath = path.join(moduleLogDir, `${moduleName}.log`);
  const stream = fs.createWriteStream(filePath, { flags: 'a' });

  const modLogger = pino(
    {
      level: env.LOG_LEVEL,
      base: { module: moduleName },
    },
    stream,
  );

  moduleFileLoggers.set(moduleName, modLogger);
  return modLogger;
}
