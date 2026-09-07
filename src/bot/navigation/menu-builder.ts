/** Dynamic nested inline-menu builder with breadcrumb navigation. */

import { InlineKeyboard } from 'grammy';
import type { BotContext } from '../context.js';
import { buildCallbackData } from './callback-data.js';

export interface MenuItem {
  label: string | ((ctx: BotContext) => string | Promise<string>);
  callbackData?: string | ((ctx: BotContext) => string | Promise<string>);
  submenuId?: string;
  visible?: (ctx: BotContext) => boolean | Promise<boolean>;
  /** Start a new row after this item. Defaults to true. */
  row?: boolean;
}

export interface MenuDefinition {
  id: string;
  parentId?: string;
  title: string | ((ctx: BotContext) => string | Promise<string>);
  body?: string | ((ctx: BotContext) => string | Promise<string>);
  items: (ctx: BotContext) => readonly MenuItem[] | Promise<readonly MenuItem[]>;
}

export interface MenuRenderOptions {
  backLabel?: string;
  homeLabel?: string;
  breadcrumbSeparator?: string;
}

export interface RenderedMenu {
  text: string;
  keyboard: InlineKeyboard;
  breadcrumbs: Array<{ id: string; title: string }>;
}

async function resolveText(
  value: string | ((ctx: BotContext) => string | Promise<string>),
  ctx: BotContext,
): Promise<string> {
  return typeof value === 'function' ? value(ctx) : value;
}

/** Registry and renderer for menus whose contents adapt to the current context. */
export class MenuBuilder {
  readonly #menus = new Map<string, MenuDefinition>();
  readonly #rootId: string;

  constructor(root: MenuDefinition) {
    this.#rootId = root.id;
    this.add(root);
  }

  add(menu: MenuDefinition): this {
    if (this.#menus.has(menu.id)) {
      throw new Error(`Menu already registered: ${menu.id}`);
    }
    if (menu.parentId === menu.id) {
      throw new Error(`Menu cannot be its own parent: ${menu.id}`);
    }

    this.#menus.set(menu.id, menu);
    return this;
  }

  has(id: string): boolean {
    return this.#menus.has(id);
  }

  async render(
    ctx: BotContext,
    id = this.#rootId,
    options: MenuRenderOptions = {},
  ): Promise<RenderedMenu> {
    const menu = this.#menus.get(id);
    if (!menu) throw new Error(`Unknown menu: ${id}`);

    const lineage = this.#getLineage(menu);
    const breadcrumbs = await Promise.all(
      lineage.map(async (entry) => ({ id: entry.id, title: await resolveText(entry.title, ctx) })),
    );
    const title = breadcrumbs.at(-1)?.title ?? '';
    const body = menu.body ? await resolveText(menu.body, ctx) : title;
    const breadcrumbText = breadcrumbs
      .map((entry) => entry.title)
      .join(options.breadcrumbSeparator ?? ' › ');
    const text = breadcrumbText === body ? body : `${breadcrumbText}\n\n${body}`;
    const keyboard = await this.#buildKeyboard(ctx, menu, options);

    return { text, keyboard, breadcrumbs };
  }

  async #buildKeyboard(
    ctx: BotContext,
    menu: MenuDefinition,
    options: MenuRenderOptions,
  ): Promise<InlineKeyboard> {
    const keyboard = new InlineKeyboard();
    for (const item of await menu.items(ctx)) {
      const rendered = await this.#renderItem(ctx, item);
      if (!rendered) continue;
      keyboard.text(rendered.label, rendered.callbackData);
      if (item.row !== false) keyboard.row();
    }

    if (menu.parentId) {
      keyboard
        .text(options.backLabel ?? '‹ Back', buildCallbackData('menu', 'open', menu.parentId))
        .text(options.homeLabel ?? '⌂ Home', buildCallbackData('menu', 'open', this.#rootId));
    }
    return keyboard;
  }

  async #renderItem(
    ctx: BotContext,
    item: MenuItem,
  ): Promise<{ callbackData: string; label: string } | null> {
    if (item.visible && !(await item.visible(ctx))) return null;

    const label = await resolveText(item.label, ctx);
    if (item.submenuId) {
      if (!this.#menus.has(item.submenuId)) throw new Error(`Unknown submenu: ${item.submenuId}`);
      return {
        label,
        callbackData: buildCallbackData('menu', 'open', item.submenuId),
      };
    }
    if (!item.callbackData) throw new Error(`Menu item "${label}" needs callbackData or submenuId`);
    return { label, callbackData: await resolveText(item.callbackData, ctx) };
  }

  #getLineage(menu: MenuDefinition): MenuDefinition[] {
    const lineage: MenuDefinition[] = [];
    const visited = new Set<string>();
    let current: MenuDefinition | undefined = menu;

    while (current) {
      if (visited.has(current.id)) throw new Error(`Menu parent cycle detected at: ${current.id}`);
      visited.add(current.id);
      lineage.unshift(current);
      current = current.parentId ? this.#menus.get(current.parentId) : undefined;
    }

    if (lineage[0]?.id !== this.#rootId) {
      throw new Error(`Menu ${menu.id} is not connected to root ${this.#rootId}`);
    }

    return lineage;
  }
}
