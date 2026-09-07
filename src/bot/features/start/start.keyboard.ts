/**
 * Start & User Feature — Keyboards
 *
 * User Menu (Reply Keyboard, max 4-5 buttons):
 * [📋 Help]      [👤 My Profile]
 * [📞 Support]   [ℹ️ About]
 *
 * Plus Inline Keyboards for contextual interactions (My Profile, Language switcher, Back).
 */

import { InlineKeyboard, Keyboard } from 'grammy';

/**
 * Main User Reply Keyboard (Fixed bottom menu)
 */
export function createUserReplyKeyboard(labels: {
  help: string;
  profile: string;
  support: string;
  about: string;
}): Keyboard {
  return new Keyboard()
    .text(labels.help)
    .text(labels.profile)
    .row()
    .text(labels.support)
    .text(labels.about)
    .resized()
    .persistent();
}

/**
 * User Profile Inline Keyboard:
 * [🔔 Notifications]
 * [🌐 Language]  [🔙 Back]
 */
export function createUserProfileKeyboard(labels: {
  notifications: string;
  language: string;
  back: string;
}): InlineKeyboard {
  return new InlineKeyboard()
    .text(labels.notifications, 'notify:preferences:1')
    .row()
    .text(labels.language, 'user:profile:language')
    .text(labels.back, 'user:profile:back');
}

/**
 * Language Selector Inline Keyboard
 */
export function createLanguageInlineKeyboard(labels: {
  english: string;
  persian: string;
  back: string;
}): InlineKeyboard {
  return new InlineKeyboard()
    .text(labels.english, 'user:lang:en')
    .text(labels.persian, 'user:lang:fa')
    .row()
    .text(labels.back, 'user:profile:back');
}

/**
 * Single Back Inline Keyboard
 */
export function createBackInlineKeyboard(label: string, callbackData: string): InlineKeyboard {
  return new InlineKeyboard().text(label, callbackData);
}

/**
 * Support Admin Alert Inline Keyboard:
 * [👤 View User] [✉️ Reply]
 * [🚫 Ban]
 */
export function createSupportAdminKeyboard(labels: {
  viewUser: string;
  reply: string;
  ban: string;
  userId: number;
  messageId?: number;
}): InlineKeyboard {
  const replyCallback = labels.messageId
    ? `admin:users:dm:${labels.userId}:${labels.messageId}`
    : `admin:users:dm:${labels.userId}`;

  return new InlineKeyboard()
    .text(labels.viewUser, `admin:users:view:${labels.userId}`)
    .text(labels.reply, replyCallback)
    .row()
    .text(labels.ban, `admin:users:ban:ask:${labels.userId}`);
}

// ─── Backward compatibility exports for existing references ───────────
export function createStartKeyboard(labels: {
  settings: string;
  help: string;
  admin?: string;
}): InlineKeyboard {
  const keyboard = new InlineKeyboard()
    .text(labels.help, 'user:help')
    .row()
    .text(labels.settings, 'user:settings');

  if (labels.admin) {
    keyboard.row().text(labels.admin, 'admin:dashboard');
  }

  return keyboard;
}

export function createHelpKeyboard(labels: { about: string; home: string }): InlineKeyboard {
  return new InlineKeyboard().text(labels.about, 'user:about').row().text(labels.home, 'user:home');
}

export function createAboutKeyboard(labels: { back: string; home: string }): InlineKeyboard {
  return new InlineKeyboard().text(labels.back, 'user:help').text(labels.home, 'user:home');
}
