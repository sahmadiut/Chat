/**
 * Settings Feature — Keyboard
 *
 * Inline keyboards for the settings interface,
 * including the language picker.
 */

import { InlineKeyboard } from 'grammy';

/**
 * Main settings menu keyboard.
 */
export function createSettingsKeyboard(labels: {
  language: string;
  notifications: string;
  home: string;
}): InlineKeyboard {
  return new InlineKeyboard()
    .text(labels.language, 'user:settings:language')
    .row()
    .text(labels.notifications, 'notify:preferences')
    .row()
    .text(labels.home, 'user:home');
}

/**
 * Language selection keyboard.
 * Each button's callback data encodes the locale code.
 */
export function createLanguageKeyboard(labels: {
  english: string;
  persian: string;
  back: string;
  home: string;
}): InlineKeyboard {
  return new InlineKeyboard()
    .text(labels.english, 'user:settings:language:en')
    .text(labels.persian, 'user:settings:language:fa')
    .row()
    .text(labels.back, 'user:settings')
    .text(labels.home, 'user:home');
}
