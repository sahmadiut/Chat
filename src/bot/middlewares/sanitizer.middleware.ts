/**
 * Input Sanitization Middleware
 *
 * Strips potentially dangerous HTML tags and script injections from
 * user-provided text input before it reaches command handlers.
 *
 * This is a defense-in-depth measure — even though Telegram renders
 * messages in its own client, sanitizing input prevents stored XSS
 * if user data is ever displayed in a web dashboard or admin panel.
 */

import type { Middleware } from 'grammy';
import { createLogger } from '#root/utils/logger.js';
import type { BotContext } from '../context.js';

const log = createLogger('Sanitizer');

/**
 * Dangerous patterns to strip from user input.
 * Removes HTML tags, script injections, and common XSS vectors.
 */
const SANITIZE_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // Script tags and their content
  { pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, replacement: '' },
  // Event handler attributes (onclick, onerror, etc.)
  { pattern: /\bon\w+\s*=\s*["'][^"']*["']/gi, replacement: '' },
  // JavaScript protocol in URLs
  { pattern: /javascript\s*:/gi, replacement: '' },
  // Data URIs with potentially executable content
  { pattern: /data\s*:\s*text\/html/gi, replacement: '' },
  // HTML tags (except safe Telegram-supported ones)
  { pattern: /<\/?(?!b|i|u|s|code|pre|a\b)[a-z][^>]*>/gi, replacement: '' },
];

/**
 * Sanitize a string by removing dangerous patterns.
 */
export function sanitizeInput(text: string): string {
  let sanitized = text;
  for (const { pattern, replacement } of SANITIZE_PATTERNS) {
    sanitized = sanitized.replace(pattern, replacement);
  }
  return sanitized.trim();
}

/**
 * Creates the input sanitization middleware.
 * Modifies `ctx.message.text` in-place before downstream handlers see it.
 */
export function createSanitizerMiddleware(): Middleware<BotContext> {
  return async (ctx, next) => {
    if (ctx.message?.text) {
      const original = ctx.message.text;
      const sanitized = sanitizeInput(original);

      if (original !== sanitized) {
        log.debug({ userId: ctx.from?.id, original, sanitized }, 'User input was sanitized');
        // Overwrite the text in the update object
        (ctx.message as { text: string }).text = sanitized;
      }
    }

    // Inline-mode queries can be reflected into result content.
    if (ctx.inlineQuery?.query) {
      const original = ctx.inlineQuery.query;
      const sanitized = sanitizeInput(original);
      if (original !== sanitized) {
        (ctx.inlineQuery as { query: string }).query = sanitized;
      }
    }

    // Also sanitize callback query data
    if (ctx.callbackQuery?.data) {
      const original = ctx.callbackQuery.data;
      const sanitized = sanitizeInput(original);
      if (original !== sanitized) {
        (ctx.callbackQuery as { data: string }).data = sanitized;
      }
    }

    await next();
  };
}
