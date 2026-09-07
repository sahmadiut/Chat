/**
 * Error Classes & Global Error Handler — Unit Tests
 *
 * Tests the custom error class hierarchy (AppError, DatabaseError, CacheError, BotError)
 * and the handleGlobalError function.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies before importing
vi.mock('#root/config/env.js', () => ({
  env: {
    BOT_TOKEN: 'test-token',
    ADMIN_CHAT_ID: 123456789,
    NODE_ENV: 'test',
    LOG_LEVEL: 'info',
  },
}));

vi.mock('#root/utils/logger.js', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  }),
}));

// Mock grammy Api class
const mockSendMessage = vi.fn();
vi.mock('grammy', () => ({
  Api: vi.fn().mockImplementation(() => ({
    sendMessage: mockSendMessage,
  })),
}));

const { AppError, DatabaseError, CacheError, BotError, handleGlobalError } = await import(
  '#root/utils/errors.js'
);

describe('Error Classes', () => {
  // ─── AppError ──────────────────────────────────────────────────────

  describe('AppError', () => {
    it('should create an error with default values', () => {
      const error = new AppError('Something went wrong');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Something went wrong');
      expect(error.name).toBe('AppError');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    it('should accept custom statusCode and isOperational', () => {
      const error = new AppError('Not found', {
        statusCode: 404,
        isOperational: false,
      });

      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(false);
    });

    it('should preserve the cause', () => {
      const cause = new Error('Original error');
      const error = new AppError('Wrapper', { cause });

      expect(error.cause).toBe(cause);
    });

    it('should have a proper stack trace', () => {
      const error = new AppError('Test');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });

  // ─── DatabaseError ─────────────────────────────────────────────────

  describe('DatabaseError', () => {
    it('should have statusCode 503 and be operational', () => {
      const error = new DatabaseError('Connection failed');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.name).toBe('DatabaseError');
      expect(error.statusCode).toBe(503);
      expect(error.isOperational).toBe(true);
    });

    it('should preserve the cause', () => {
      const cause = new Error('ECONNREFUSED');
      const error = new DatabaseError('DB down', cause);

      expect(error.cause).toBe(cause);
    });
  });

  // ─── CacheError ────────────────────────────────────────────────────

  describe('CacheError', () => {
    it('should have statusCode 503 and be operational', () => {
      const error = new CacheError('Redis timeout');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(CacheError);
      expect(error.name).toBe('CacheError');
      expect(error.statusCode).toBe(503);
      expect(error.isOperational).toBe(true);
    });
  });

  // ─── BotError ──────────────────────────────────────────────────────

  describe('BotError', () => {
    it('should have statusCode 502 and be operational', () => {
      const error = new BotError('Telegram API error');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(BotError);
      expect(error.name).toBe('BotError');
      expect(error.statusCode).toBe(502);
      expect(error.isOperational).toBe(true);
    });
  });
});

// ─── handleGlobalError ──────────────────────────────────────────────

describe('handleGlobalError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send an alert to admin via Telegram', async () => {
    mockSendMessage.mockResolvedValue({});

    await handleGlobalError(new AppError('Test error'), { userId: 42 });

    expect(mockSendMessage).toHaveBeenCalledOnce();
    const [chatId, message, options] = mockSendMessage.mock.calls[0] ?? [];
    expect(chatId).toBe(123456789);
    expect(message).toContain('Test error');
    expect(options.parse_mode).toBe('HTML');
  });

  it('should handle non-Error objects', async () => {
    mockSendMessage.mockResolvedValue({});

    await handleGlobalError('just a string error');

    expect(mockSendMessage).toHaveBeenCalledOnce();
    const [, message] = mockSendMessage.mock.calls[0] ?? [];
    expect(message).toContain('just a string error');
  });

  it('should not throw when Telegram alert fails', async () => {
    mockSendMessage.mockRejectedValue(new Error('Telegram API down'));

    // Should not throw
    await expect(
      handleGlobalError(new Error('Test'), { context: 'test' }),
    ).resolves.toBeUndefined();
  });

  it('should include context info in the alert message', async () => {
    mockSendMessage.mockResolvedValue({});

    await handleGlobalError(new Error('Boom'), {
      updateId: 12345,
      userId: 42,
    });

    const [, message] = mockSendMessage.mock.calls[0] ?? [];
    expect(message).toContain('Context');
  });

  it('should indicate operational status for AppError instances', async () => {
    mockSendMessage.mockResolvedValue({});

    await handleGlobalError(new AppError('Operational fail'));

    const [, message] = mockSendMessage.mock.calls[0] ?? [];
    expect(message).toContain('Yes'); // isOperational = true
  });
});
