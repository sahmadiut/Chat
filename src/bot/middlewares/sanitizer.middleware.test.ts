/**
 * Input Sanitization Middleware — Unit Tests
 *
 * Tests the sanitizeInput function and createSanitizerMiddleware for
 * stripping dangerous HTML while preserving Telegram-safe tags.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BotContext } from '#root/bot/context.js';

// Mock logger before importing
vi.mock('#root/utils/logger.js', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  }),
}));

const { sanitizeInput, createSanitizerMiddleware } = await import(
  '#root/bot/middlewares/sanitizer.middleware.js'
);

// ─── sanitizeInput ──────────────────────────────────────────────────

describe('sanitizeInput', () => {
  // ── Script Tags ──────────────────────────────────────────────────

  describe('script tag removal', () => {
    it('should strip simple script tags', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      expect(sanitizeInput(input)).toBe('Hello  World');
    });

    it('should strip script tags with attributes', () => {
      const input = 'Hi <script type="text/javascript">evil()</script> there';
      expect(sanitizeInput(input)).toBe('Hi  there');
    });

    it('should strip multiline script tags', () => {
      const input = 'Before <script>\nvar x = 1;\nalert(x);\n</script> After';
      expect(sanitizeInput(input)).toBe('Before  After');
    });
  });

  // ── Event Handlers ───────────────────────────────────────────────

  describe('event handler removal', () => {
    it('should strip onclick handlers', () => {
      const input = 'Click <div onclick="steal()">here</div>';
      expect(sanitizeInput(input)).not.toContain('onclick');
    });

    it('should strip onerror handlers', () => {
      const input = '<img onerror="evil()" src="x">';
      expect(sanitizeInput(input)).not.toContain('onerror');
    });

    it('should strip onload handlers', () => {
      const input = '<body onload="hack()">';
      expect(sanitizeInput(input)).not.toContain('onload');
    });

    it('should strip onmouseover handlers', () => {
      const input = '<span onmouseover="track()">text</span>';
      expect(sanitizeInput(input)).not.toContain('onmouseover');
    });
  });

  // ── Allowed HTML Tags ────────────────────────────────────────────

  describe('allowed Telegram HTML tags', () => {
    it('should preserve <b> tags', () => {
      const input = 'This is <b>bold</b> text';
      expect(sanitizeInput(input)).toBe('This is <b>bold</b> text');
    });

    it('should preserve <i> tags', () => {
      const input = 'This is <i>italic</i> text';
      expect(sanitizeInput(input)).toBe('This is <i>italic</i> text');
    });

    it('should preserve <u> tags', () => {
      const input = 'This is <u>underlined</u> text';
      expect(sanitizeInput(input)).toBe('This is <u>underlined</u> text');
    });

    it('should preserve <s> tags', () => {
      const input = 'This is <s>strikethrough</s> text';
      expect(sanitizeInput(input)).toBe('This is <s>strikethrough</s> text');
    });

    it('should preserve <code> tags', () => {
      const input = 'Use <code>console.log()</code> for debugging';
      expect(sanitizeInput(input)).toBe('Use <code>console.log()</code> for debugging');
    });

    it('should preserve <pre> tags', () => {
      const input = '<pre>const x = 1;</pre>';
      expect(sanitizeInput(input)).toBe('<pre>const x = 1;</pre>');
    });

    it('should preserve <a> tags with href', () => {
      const input = 'Visit <a href="https://example.com">here</a>';
      expect(sanitizeInput(input)).toBe('Visit <a href="https://example.com">here</a>');
    });

    it('should preserve multiple allowed tags together', () => {
      const input = '<b>Bold</b> and <i>italic</i> and <code>code</code>';
      expect(sanitizeInput(input)).toBe('<b>Bold</b> and <i>italic</i> and <code>code</code>');
    });
  });

  // ── Dangerous Tags (non-allowed) ─────────────────────────────────

  describe('dangerous tag removal', () => {
    it('should strip <div> tags', () => {
      const input = '<div>content</div>';
      expect(sanitizeInput(input)).toBe('content');
    });

    it('should strip <form> tags', () => {
      const input = '<form action="/steal">content</form>';
      expect(sanitizeInput(input)).toBe('content');
    });

    it('should strip <table> tags', () => {
      const input = '<table>data</table>';
      expect(sanitizeInput(input)).toBe('data');
    });

    it('should strip <p> tags', () => {
      const input = '<p>paragraph</p>';
      expect(sanitizeInput(input)).toBe('paragraph');
    });

    it('should strip <h1> tags', () => {
      const input = '<h1>heading</h1>';
      expect(sanitizeInput(input)).toBe('heading');
    });
  });

  // ── JavaScript Protocol ──────────────────────────────────────────

  describe('javascript: protocol removal', () => {
    it('should strip javascript: protocol', () => {
      const input = 'javascript:alert(1)';
      expect(sanitizeInput(input)).not.toContain('javascript:');
    });

    it('should strip javascript: with spaces', () => {
      const input = 'javascript :alert(1)';
      expect(sanitizeInput(input)).not.toContain('javascript');
    });

    it('should be case-insensitive for javascript: protocol', () => {
      const input = 'JavaScript:alert(1)';
      expect(sanitizeInput(input)).not.toMatch(/javascript\s*:/i);
    });
  });

  // ── Data URI ─────────────────────────────────────────────────────

  describe('data URI removal', () => {
    it('should strip data:text/html URIs', () => {
      const input = 'data:text/html,<script>alert(1)</script>';
      expect(sanitizeInput(input)).not.toContain('data:text/html');
    });
  });

  // ── Clean Input ──────────────────────────────────────────────────

  describe('clean input passthrough', () => {
    it('should return clean text unchanged', () => {
      const input = 'Hello, this is a normal message!';
      expect(sanitizeInput(input)).toBe('Hello, this is a normal message!');
    });

    it('should handle empty string', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('should handle text with numbers and special characters', () => {
      const input = 'Price: $42.99 (10% off) — great deal!';
      expect(sanitizeInput(input)).toBe('Price: $42.99 (10% off) — great deal!');
    });

    it('should handle unicode text', () => {
      const input = 'سلام دنیا! 🌍 Hello World!';
      expect(sanitizeInput(input)).toBe('سلام دنیا! 🌍 Hello World!');
    });

    it('should trim whitespace from result', () => {
      const input = '  Hello World  ';
      expect(sanitizeInput(input)).toBe('Hello World');
    });
  });
});

// ─── createSanitizerMiddleware ──────────────────────────────────────

describe('createSanitizerMiddleware', () => {
  const next = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    next.mockResolvedValue(undefined);
  });

  it('should sanitize message text', async () => {
    const ctx = {
      message: { text: 'Hello <script>alert(1)</script> World' },
      from: { id: 42 },
    } as unknown as BotContext;

    const middleware = createSanitizerMiddleware();
    // biome-ignore lint/suspicious/noExplicitAny: test mock casting
    await (middleware as any)(ctx, next);

    expect((ctx.message as { text: string }).text).toBe('Hello  World');
    expect(next).toHaveBeenCalledOnce();
  });

  it('should sanitize callback query data', async () => {
    const ctx = {
      callbackQuery: { data: 'action_<script>x</script>_ok' },
      from: { id: 42 },
    } as unknown as BotContext;

    const middleware = createSanitizerMiddleware();
    // biome-ignore lint/suspicious/noExplicitAny: test mock casting
    await (middleware as any)(ctx, next);

    expect((ctx.callbackQuery as { data: string }).data).toBe('action__ok');
    expect(next).toHaveBeenCalledOnce();
  });

  it('should not modify clean message text', async () => {
    const ctx = {
      message: { text: 'Hello World' },
      from: { id: 42 },
    } as unknown as BotContext;

    const middleware = createSanitizerMiddleware();
    // biome-ignore lint/suspicious/noExplicitAny: test mock casting
    await (middleware as any)(ctx, next);

    expect((ctx.message as { text: string }).text).toBe('Hello World');
    expect(next).toHaveBeenCalledOnce();
  });

  it('should call next when no message text is present', async () => {
    const ctx = {
      message: { photo: [] },
      from: { id: 42 },
    } as unknown as BotContext;

    const middleware = createSanitizerMiddleware();
    // biome-ignore lint/suspicious/noExplicitAny: test mock casting
    await (middleware as any)(ctx, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('should call next when ctx.message is undefined', async () => {
    const ctx = { from: { id: 42 } } as unknown as BotContext;

    const middleware = createSanitizerMiddleware();
    // biome-ignore lint/suspicious/noExplicitAny: test mock casting
    await (middleware as any)(ctx, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
