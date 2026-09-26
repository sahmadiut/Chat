import { beforeEach, describe, expect, it, vi } from 'vitest';

const calls = vi.hoisted(() => [] as string[]);

vi.mock('@grammyjs/runner', () => ({
  run: () => {
    calls.push('runner.start');
    return { stop: () => calls.push('runner.stop') };
  },
}));

vi.mock('#root/config/env.js', () => ({
  env: { BOT_MODE: 'polling', NODE_ENV: 'development', APP_ENV: 'development', LOG_LEVEL: 'info', DEFAULT_LANGUAGE: 'en' },
  getAdminIds: () => [123],
  isPolling: true,
  isWebhook: false,
}));

vi.mock('#root/bot/bot.js', () => ({
  bot: {
    botInfo: { id: 1, username: 'test_bot' },
    init: async () => { calls.push('bot.init'); },
    api: {
      setMyCommands: async () => { calls.push('commands'); },
      deleteWebhook: async () => { calls.push('webhook.delete'); },
    },
  },
}));

vi.mock('#root/bot/commands.js', () => ({ getBotCommands: () => [] }));
vi.mock('#root/database/index.js', () => ({
  ensureDatabase: async () => { calls.push('database.ready'); },
  closeDatabase: async () => {},
}));
vi.mock('#root/cache/index.js', () => ({ closeRedis: async () => {} }));
vi.mock('#root/queue/index.js', () => ({ closeQueues: async () => {} }));
vi.mock('#root/utils/logger.js', () => ({
  createLogger: () => ({ info: () => {}, warn: () => {}, error: () => {}, fatal: () => {} }),
}));

describe('development runtime entrypoint', () => {
  beforeEach(() => { calls.length = 0; });

  it('starts polling after database, bot, and commands are ready', async () => {
    await import('./main.js');
    await vi.waitFor(() => expect(calls).toContain('runner.start'));
    expect(calls.indexOf('database.ready')).toBeLessThan(calls.indexOf('bot.init'));
    expect(calls.indexOf('bot.init')).toBeLessThan(calls.indexOf('commands'));
    expect(calls.indexOf('commands')).toBeLessThan(calls.indexOf('webhook.delete'));
    expect(calls.indexOf('webhook.delete')).toBeLessThan(calls.indexOf('runner.start'));
    expect(calls.filter((call) => call === 'commands')).toHaveLength(6);
  });
});
