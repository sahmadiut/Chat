import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { validateWebAppInitData } from './web-app.validation.js';

const BOT_TOKEN = '123456:test-token';
const NOW = new Date('2026-08-27T12:00:00.000Z');

function signInitData(values: Record<string, string>): string {
  const dataCheckString = Object.entries(values)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const hash = createHmac('sha256', secret).update(dataCheckString).digest('hex');
  return new URLSearchParams({ ...values, hash }).toString();
}

describe('validateWebAppInitData', () => {
  it('validates signature, freshness, and Telegram user data', () => {
    const initData = signInitData({
      auth_date: String(Math.floor(NOW.getTime() / 1000) - 30),
      query_id: 'query-1',
      user: JSON.stringify({ id: 42, first_name: 'Ada', username: 'ada' }),
    });

    const result = validateWebAppInitData(initData, BOT_TOKEN, { now: NOW });

    expect(result.queryId).toBe('query-1');
    expect(result.user).toMatchObject({ id: 42, first_name: 'Ada', username: 'ada' });
  });

  it('rejects tampered and expired init data', () => {
    const valid = signInitData({
      auth_date: String(Math.floor(NOW.getTime() / 1000) - 30),
      user: JSON.stringify({ id: 42, first_name: 'Ada' }),
    });
    expect(() => validateWebAppInitData(`${valid}x`, BOT_TOKEN, { now: NOW })).toThrow();

    const expired = signInitData({
      auth_date: String(Math.floor(NOW.getTime() / 1000) - 301),
    });
    expect(() => validateWebAppInitData(expired, BOT_TOKEN, { now: NOW })).toThrow(/expired/);
  });
});
