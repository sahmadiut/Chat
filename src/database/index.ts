/**
 * Database Connection & Drizzle Instance
 *
 * Creates a PostgreSQL connection using the `postgres` (postgres.js) driver
 * and initializes the Drizzle ORM instance with all schema definitions.
 *
 * On startup, `ensureDatabase()` will:
 *   1. Create the database if it doesn't exist
 *   2. Sync the schema (create/alter tables) via `drizzle-kit push`
 *
 * Usage:
 *   import { db } from '#root/database/index.js';
 *   const allUsers = await db.select().from(users);
 *
 * Shutdown:
 *   import { closeDatabase } from '#root/database/index.js';
 *   await closeDatabase(); // Called during graceful shutdown
 */

import { execSync } from 'node:child_process';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '#root/config/env.js';
import { createLogger } from '#root/utils/logger.js';
import * as schema from './schema/index.js';

const log = createLogger('Database');

/**
 * Underlying postgres.js client.
 * Configured with sensible defaults for a long-running bot process.
 */
const client = postgres(env.DATABASE_URL, {
  /* Maximum number of connections in the pool */
  max: 10,
  /* Log queries in development for debugging */
  onnotice: (notice) => log.debug({ notice }, 'PostgreSQL notice'),
});

/**
 * Drizzle ORM instance — the primary interface for all database operations.
 * Includes all schema definitions for type-safe queries.
 */
export const db = drizzle(client, {
  schema,
  logger: env.NODE_ENV === 'development',
});

// ─── Database Auto-Setup ─────────────────────────────────────────────

/**
 * Parse the DATABASE_URL to extract connection components.
 */
function parseDatabaseUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port || '5432',
    user: parsed.username,
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.slice(1), // remove leading '/'
  };
}

/**
 * Ensure the target database exists. If it doesn't, connect to the
 * default `postgres` database and CREATE it.
 */
async function ensureDatabaseExists(): Promise<void> {
  const { host, port, user, password, database } = parseDatabaseUrl(env.DATABASE_URL);

  // Connect to the default 'postgres' database to check/create ours
  const adminUrl = `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/postgres`;
  const adminClient = postgres(adminUrl, { max: 1 });

  try {
    const result = await adminClient`
      SELECT 1 FROM pg_database WHERE datname = ${database}
    `;

    if (result.length === 0) {
      log.info({ database }, `Database "${database}" does not exist — creating it...`);
      try {
        // CREATE DATABASE cannot run inside a transaction, so use unsafe
        await adminClient.unsafe(`CREATE DATABASE "${database}"`);
        log.info({ database }, `Database "${database}" created successfully`);
      } catch (err) {
        if (err instanceof Error && 'code' in err && err.code === '42501') {
          log.error(
            `Permission denied to create database "${database}". Please either:\n` +
              `  1. Create the database manually: CREATE DATABASE "${database}";\n` +
              `  2. Or grant CREATEDB privilege to user "${user}": ALTER USER "${user}" CREATEDB;`,
          );
        }
        throw err;
      }
    } else {
      log.debug({ database }, `Database "${database}" already exists`);
    }
  } finally {
    await adminClient.end();
  }
}

/**
 * Sync the Drizzle schema to the database using `drizzle-kit push`.
 * This reads the schema files and creates/alters tables as needed,
 * without requiring pre-generated migration files.
 */
function syncSchema(): void {
  log.info('Syncing database schema (drizzle-kit push)...');
  try {
    const result = execSync('npx tsx node_modules/drizzle-kit/bin.cjs push --force', {
      stdio: 'pipe',
      encoding: 'utf-8',
      cwd: process.cwd(),
      env: { ...process.env },
    });
    if (result) {
      log.info({ output: result.trim() }, 'drizzle-kit push output');
    }
    log.info('Database schema synced successfully');
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; message: string };
    log.error({ stdout: error.stdout, stderr: error.stderr }, 'Failed to sync database schema');
    throw new Error(`Schema sync failed: ${error.message}`);
  }
}

/**
 * Full database setup: ensure the database exists, then sync the schema.
 * Call this once during application startup.
 */
export async function ensureDatabase(): Promise<void> {
  await ensureDatabaseExists();
  syncSchema();

  // Verify that critical tables were actually created
  const tables = await client<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename IN ('users', 'chats')
  `;
  const tableNames = tables.map((t) => t.tablename);
  if (!tableNames.includes('users') || !tableNames.includes('chats')) {
    log.error(
      { foundTables: tableNames },
      'Schema sync reported success but critical tables are missing! ' +
        'Try running "npm run db:push" manually to diagnose.',
    );
    throw new Error('Database schema verification failed: missing critical tables');
  }
  log.info({ tables: tableNames }, 'Database schema verified — critical tables exist');
}

/**
 * Gracefully close the database connection pool.
 * Should be called during application shutdown to release all connections.
 */
export async function closeDatabase(): Promise<void> {
  log.info('Closing database connection pool...');
  await client.end();
  log.info('Database connection pool closed');
}
