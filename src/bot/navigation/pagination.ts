/** Generic list and inline-keyboard pagination helpers. */

import { InlineKeyboard } from 'grammy';

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

/** Slice an in-memory list into a clamped, one-based page. */
export function paginate<T>(items: readonly T[], requestedPage = 1, pageSize = 10): Page<T> {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new Error('Page size must be a positive integer');
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const normalizedPage = Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 1;
  const page = Math.min(totalPages, Math.max(1, normalizedPage));
  const offset = (page - 1) * pageSize;

  return {
    items: items.slice(offset, offset + pageSize),
    page,
    pageSize,
    totalItems: items.length,
    totalPages,
    hasPrevious: page > 1,
    hasNext: page < totalPages,
  };
}

export interface PaginationKeyboardOptions {
  page: number;
  totalPages: number;
  callbackData: (page: number) => string;
  previousLabel?: string;
  nextLabel?: string;
  pageLabel?: (page: number, totalPages: number) => string;
}

/** Build a reusable previous/current/next navigation row. */
export function createPaginationKeyboard(options: PaginationKeyboardOptions): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  const totalPages = Math.max(1, Math.trunc(options.totalPages));
  const page = Math.min(totalPages, Math.max(1, Math.trunc(options.page)));

  if (page > 1) {
    keyboard.text(options.previousLabel ?? '‹', options.callbackData(page - 1));
  }

  keyboard.text(
    options.pageLabel?.(page, totalPages) ?? `${page}/${totalPages}`,
    options.callbackData(page),
  );

  if (page < totalPages) {
    keyboard.text(options.nextLabel ?? '›', options.callbackData(page + 1));
  }

  return keyboard;
}
