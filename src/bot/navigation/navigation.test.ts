import { describe, expect, it } from 'vitest';
import { buildCallbackData, parseCallbackData } from './callback-data.js';
import { createPaginationKeyboard, paginate } from './pagination.js';

describe('callback data', () => {
  it('round-trips structured and encoded parameters', () => {
    const data = buildCallbackData('users', 'view', '42', 'hello:world');

    expect(data).toBe('users:view:42:hello%3Aworld');
    expect(parseCallbackData(data)).toEqual({
      module: 'users',
      action: 'view',
      params: ['42', 'hello:world'],
      raw: data,
    });
  });

  it('rejects malformed routes and oversized payloads', () => {
    expect(parseCallbackData('only-one-segment')).toBeNull();
    expect(() => buildCallbackData('bad module', 'open')).toThrow();
    expect(() => buildCallbackData('menu', 'open', 'x'.repeat(64))).toThrow(/64-byte/);
  });
});

describe('pagination', () => {
  it('clamps list pages and reports navigation state', () => {
    expect(paginate([1, 2, 3, 4, 5], 99, 2)).toMatchObject({
      items: [5],
      page: 3,
      totalItems: 5,
      totalPages: 3,
      hasPrevious: true,
      hasNext: false,
    });
  });

  it('builds previous, status, and next callback buttons', () => {
    const keyboard = createPaginationKeyboard({
      page: 2,
      totalPages: 3,
      callbackData: (page) => `list:page:${page}`,
    });

    expect(keyboard.inline_keyboard[0]?.map((button) => button.text)).toEqual(['‹', '2/3', '›']);
    expect(
      keyboard.inline_keyboard[0]?.map(
        (button) => 'callback_data' in button && button.callback_data,
      ),
    ).toEqual(['list:page:1', 'list:page:2', 'list:page:3']);
  });
});
