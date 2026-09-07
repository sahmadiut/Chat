import { describe, expect, it } from 'vitest';
import type { BotContext } from '../context.js';
import { MenuBuilder } from './menu-builder.js';

describe('MenuBuilder', () => {
  it('renders dynamic items and breadcrumb navigation', async () => {
    const ctx = { from: { id: 7 } } as unknown as BotContext;
    const menus = new MenuBuilder({
      id: 'root',
      title: 'Home',
      items: () => [{ label: 'Account', submenuId: 'account' }],
    }).add({
      id: 'account',
      parentId: 'root',
      title: (currentCtx) => `User ${currentCtx.from?.id}`,
      body: 'Account settings',
      items: () => [
        { label: 'Visible action', callbackData: 'account:edit' },
        { label: 'Hidden action', callbackData: 'account:hidden', visible: () => false },
      ],
    });

    const rendered = await menus.render(ctx, 'account');

    expect(rendered.text).toBe('Home › User 7\n\nAccount settings');
    expect(rendered.breadcrumbs).toEqual([
      { id: 'root', title: 'Home' },
      { id: 'account', title: 'User 7' },
    ]);
    expect(rendered.keyboard.inline_keyboard.flat().map((button) => button.text)).toEqual([
      'Visible action',
      '‹ Back',
      '⌂ Home',
    ]);
  });

  it('detects disconnected menu trees', async () => {
    const menus = new MenuBuilder({ id: 'root', title: 'Home', items: () => [] }).add({
      id: 'orphan',
      parentId: 'missing',
      title: 'Orphan',
      items: () => [],
    });

    await expect(menus.render({} as BotContext, 'orphan')).rejects.toThrow(/not connected/);
  });
});
