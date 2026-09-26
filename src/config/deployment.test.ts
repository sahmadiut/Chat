import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const base = {
  BOT_TOKEN: '123456:test-token',
  BOT_USERNAME: 'test_bot',
  ADMIN_CHAT_ID: '123456789',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/test_bot',
  REDIS_URL: 'redis://localhost:6379',
};

function check(overrides: Record<string, string>) {
  const env = { ...process.env, ...base, ...overrides };
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/config/env.ts'], {
    cwd: process.cwd(),
    env,
    encoding: 'utf8',
  });
  return { status: result.status, output: result.stderr + result.stdout };
}

describe('deployment configuration', () => {
  it('accepts local development polling', () => {
    expect(check({ APP_ENV: 'development', NODE_ENV: 'development', BOT_MODE: 'polling' }).status).toBe(0);
  });

  it.each(['staging', 'production'])('accepts isolated %s webhook configuration', (appEnv) => {
    const result = check({ APP_ENV: appEnv, NODE_ENV: 'production', BOT_MODE: 'webhook', WEBHOOK_URL: 'https://bot.example.com', WEBHOOK_SECRET: 'test-secret' });
    expect(result.status, result.output).toBe(0);
  });

  it('rejects production Node mode without an explicit deployment boundary', () => {
    const result = check({ APP_ENV: 'development', NODE_ENV: 'production', BOT_MODE: 'polling' });
    expect(result.status).toBe(1);
    expect(result.output).toContain('APP_ENV');
  });

  it('rejects polling in staging', () => {
    const result = check({ APP_ENV: 'staging', NODE_ENV: 'production', BOT_MODE: 'polling' });
    expect(result.status).toBe(1);
    expect(result.output).toContain('BOT_MODE');
  });

  it('rejects HTTP webhook URLs in production', () => {
    const result = check({ APP_ENV: 'production', NODE_ENV: 'production', BOT_MODE: 'webhook', WEBHOOK_URL: 'http://bot.example.com', WEBHOOK_SECRET: 'test-secret' });
    expect(result.status).toBe(1);
    expect(result.output).toContain('HTTPS');
  });
});
