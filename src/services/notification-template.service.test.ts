import { describe, expect, it, vi } from 'vitest';

vi.mock('#root/database/index.js', () => ({ db: {} }));

import { interpolateNotificationTemplate } from './notification-template.service.js';

describe('interpolateNotificationTemplate', () => {
  it('interpolates and HTML-escapes variables', () => {
    expect(
      interpolateNotificationTemplate('Hello <b>{{ name }}</b> — {{count}}', {
        name: '<Ada & Bob>',
        count: 2,
      }),
    ).toBe('Hello <b>&lt;Ada &amp; Bob&gt;</b> — 2');
  });

  it('escapes MarkdownV2 values and rejects missing variables', () => {
    expect(interpolateNotificationTemplate('{{value}}', { value: 'a_b!' }, 'MarkdownV2')).toBe(
      'a\\_b\\!',
    );
    expect(() => interpolateNotificationTemplate('Hello {{name}}', {})).toThrow(/Missing/);
  });
});
