/**
 * Admin Inline Keyboards
 *
 * ADMIN MENU (Inline Keyboard, minimal — exactly these 5 items):
 * [📊 Stats]        [👥 Users]
 * [📢 Broadcast]    [⚙️ Settings]
 * [❌ Close]
 *
 * 1. Stats
 *    [🔙 Back]
 *
 * 2. Users
 *    [🔍 Search]
 *    [📋 List] (paginated)
 *    [🔙 Back]
 *
 *    → Clicking a user in list/search opens their card:
 *    [✉️ Message]  [🚫 Ban] (or [✅ Unban] if already banned)
 *    [🔙 Back to list]
 *
 *    → Ban/Unban confirmation:
 *    [✅ Confirm]  [❌ Cancel]
 *
 * 3. Broadcast (step-by-step flow)
 *    Step 1: [All users] [Active only] / [❌ Cancel]
 *    Step 3: [✅ Send] [✏️ Edit] [❌ Cancel]
 *    Step 4: [🔙 Back]
 *
 * 4. Settings
 *    [🔧 Maintenance mode: ✅/❌]  (toggle)
 *    [📢 Force channel join: ✅/❌]  (toggle)
 *    [✉️ Edit welcome message]
 *    [🌐 Language]  (switch between English/Persian)
 *    [🔙 Back]
 *
 * 5. Close — removes the admin message
 */

import { InlineKeyboard } from 'grammy';
import type { User } from '#root/database/schema/index.js';

export interface AdminLabels {
  stats: string;
  users: string;
  broadcast: string;
  settings: string;
  close: string;
}

/**
 * Main Admin Root Keyboard (Minimal 5 items)
 */
export function buildAdminMainMenuKeyboard(labels?: Partial<AdminLabels>): InlineKeyboard {
  return new InlineKeyboard()
    .text(labels?.stats ?? '📊 Stats', 'admin:stats')
    .text(labels?.users ?? '👥 Users', 'admin:users')
    .row()
    .text(labels?.broadcast ?? '📢 Broadcast', 'admin:broadcast')
    .text(labels?.settings ?? '⚙️ Settings', 'admin:settings')
    .row()
    .text(labels?.close ?? '❌ Close', 'admin:close');
}

/**
 * Stats View Keyboard
 */
export function buildStatsViewKeyboard(backLabel = '🔙 Back'): InlineKeyboard {
  return new InlineKeyboard().text(backLabel, 'admin:dashboard');
}

/**
 * Users Submenu Keyboard
 */
export function buildUsersSubmenuKeyboard(labels: {
  search: string;
  list: string;
  back: string;
}): InlineKeyboard {
  return new InlineKeyboard()
    .text(labels.search, 'admin:users:search')
    .row()
    .text(labels.list, 'admin:users:list:1')
    .row()
    .text(labels.back, 'admin:dashboard');
}

/**
 * Paginated Users List Keyboard
 */
export function buildPaginatedUsersKeyboard(options: {
  users: User[];
  page: number;
  totalPages: number;
  prevLabel: string;
  nextLabel: string;
  pageLabel: string;
  backLabel: string;
}): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  for (const user of options.users) {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
    const badge = user.isBanned ? '🚫 ' : '👤 ';
    keyboard
      .text(`${badge}${fullName} (${user.telegramId})`, `admin:users:card:${user.telegramId}`)
      .row();
  }

  // Pagination Row: [⬅️ Prev] [Page X/Y] [➡️ Next]
  const pageRow: Array<{ text: string; data: string }> = [];
  if (options.page > 1) {
    pageRow.push({ text: options.prevLabel, data: `admin:users:list:${options.page - 1}` });
  }

  pageRow.push({ text: options.pageLabel, data: `admin:users:list:${options.page}` });

  if (options.page < options.totalPages) {
    pageRow.push({ text: options.nextLabel, data: `admin:users:list:${options.page + 1}` });
  }

  for (const btn of pageRow) {
    keyboard.text(btn.text, btn.data);
  }
  keyboard.row();

  // Last Row: [🔙 Back]
  keyboard.text(options.backLabel, 'admin:users');

  return keyboard;
}

/**
 * User Card Keyboard:
 * [✉️ Message]  [🚫 Ban] (or [✅ Unban])
 * [🔙 Back to list]
 */
export function buildUserCardKeyboard(options: {
  userId: number;
  isBanned: boolean;
  messageLabel: string;
  banLabel: string;
  unbanLabel: string;
  backLabel: string;
  backCallback?: string;
}): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  const banButtonLabel = options.isBanned ? options.unbanLabel : options.banLabel;
  const banAction = options.isBanned ? 'unban' : 'ban';

  keyboard
    .text(options.messageLabel, `admin:users:dm:${options.userId}`)
    .text(banButtonLabel, `admin:users:${banAction}:ask:${options.userId}`)
    .row()
    .text(options.backLabel, options.backCallback ?? 'admin:users:list:1');

  return keyboard;
}

/**
 * Destructive Action Confirmation Keyboard:
 * [✅ Confirm]  [❌ Cancel]
 */
export function buildActionConfirmKeyboard(options: {
  action: string;
  param: string | number;
  confirmLabel: string;
  cancelLabel: string;
  cancelCallback: string;
}): InlineKeyboard {
  return new InlineKeyboard()
    .text(options.confirmLabel, `admin:confirm:${options.action}:${options.param}`)
    .text(options.cancelLabel, options.cancelCallback);
}

/**
 * Broadcast Step 1 Audience Keyboard:
 * [All users] [Active only]
 * [❌ Cancel]
 */
export function buildBroadcastAudienceKeyboard(labels: {
  all: string;
  active: string;
  cancel: string;
}): InlineKeyboard {
  return new InlineKeyboard()
    .text(labels.all, 'admin:broadcast:aud:all')
    .row()
    .text(labels.active, 'admin:broadcast:aud:active')
    .row()
    .text(labels.cancel, 'admin:dashboard');
}

/**
 * Broadcast Step 3 Preview Keyboard:
 * [✅ Send]  [✏️ Edit]  [❌ Cancel]
 */
export function buildBroadcastPreviewKeyboard(labels: {
  send: string;
  edit: string;
  cancel: string;
}): InlineKeyboard {
  return new InlineKeyboard()
    .text(labels.send, 'admin:broadcast:send')
    .text(labels.edit, 'admin:broadcast:edit')
    .text(labels.cancel, 'admin:broadcast:cancel');
}

/**
 * Settings Submenu Keyboard:
 * [🔧 Maintenance mode: ✅/❌]  (toggle)
 * [📢 Force channel join: ✅/❌]  (toggle)
 * [✉️ Edit welcome message]
 * [🌐 Language]  (switch between English/Persian)
 * [🔙 Back]
 */
export function buildAdminSettingsKeyboard(options: {
  maintenanceLabel: string;
  forceJoinLabel: string;
  editWelcomeLabel: string;
  languageLabel: string;
  backLabel: string;
}): InlineKeyboard {
  return new InlineKeyboard()
    .text(options.maintenanceLabel, 'admin:settings:toggle:maint')
    .row()
    .text(options.forceJoinLabel, 'admin:settings:toggle:forcejoin')
    .row()
    .text(options.editWelcomeLabel, 'admin:settings:editwelcome')
    .row()
    .text(options.languageLabel, 'admin:settings:lang')
    .row()
    .text(options.backLabel, 'admin:dashboard');
}

/**
 * Admin Language Switcher Keyboard
 */
export function buildAdminLanguageKeyboard(labels: {
  english: string;
  persian: string;
  back: string;
}): InlineKeyboard {
  return new InlineKeyboard()
    .text(labels.english, 'admin:settings:setlang:en')
    .text(labels.persian, 'admin:settings:setlang:fa')
    .row()
    .text(labels.back, 'admin:settings');
}

// ─── Backward compatibility exports ─────────────────────────────────
export function buildUsersMenuKeyboard(locale = 'en'): InlineKeyboard {
  return buildUsersSubmenuKeyboard({
    search: locale.startsWith('fa') ? '🔍 جست‌وجو' : '🔍 Search',
    list: locale.startsWith('fa') ? '📋 فهرست کاربران' : '📋 List',
    back: locale.startsWith('fa') ? '🔙 بازگشت' : '🔙 Back',
  });
}

export function buildUserActionKeyboard(user: User, locale = 'en'): InlineKeyboard {
  return buildUserCardKeyboard({
    userId: user.telegramId,
    isBanned: user.isBanned,
    messageLabel: locale.startsWith('fa') ? '✉️ ارسال پیام' : '✉️ Message',
    banLabel: locale.startsWith('fa') ? '🚫 مسدود کردن' : '🚫 Ban',
    unbanLabel: locale.startsWith('fa') ? '✅ رفع مسدودیت' : '✅ Unban',
    backLabel: locale.startsWith('fa') ? '🔙 بازگشت به فهرست' : '🔙 Back to list',
  });
}

export function buildStatisticsKeyboard(locale = 'en'): InlineKeyboard {
  return buildStatsViewKeyboard(locale.startsWith('fa') ? '🔙 بازگشت' : '🔙 Back');
}

export function buildSettingsMenuKeyboard(
  data: { isMaintenance: boolean },
  locale = 'en',
): InlineKeyboard {
  return buildAdminSettingsKeyboard({
    maintenanceLabel: data.isMaintenance
      ? locale.startsWith('fa')
        ? '🔧 حالت تعمیر: ✅'
        : '🔧 Maintenance mode: ✅'
      : locale.startsWith('fa')
        ? '🔧 حالت تعمیر: ❌'
        : '🔧 Maintenance mode: ❌',
    forceJoinLabel: locale.startsWith('fa') ? '📢 عضویت اجباری: ❌' : '📢 Force channel join: ❌',
    editWelcomeLabel: locale.startsWith('fa')
      ? '✉️ ویرایش پیام خوش‌آمدگویی'
      : '✉️ Edit welcome message',
    languageLabel: locale.startsWith('fa') ? '🌐 زبان' : '🌐 Language',
    backLabel: locale.startsWith('fa') ? '🔙 بازگشت' : '🔙 Back',
  });
}

export function buildLogsKeyboard(locale = 'en'): InlineKeyboard {
  return new InlineKeyboard().text(
    locale.startsWith('fa') ? '🔙 بازگشت' : '🔙 Back',
    'admin:dashboard',
  );
}

export function buildBackToAdminKeyboard(locale = 'en'): InlineKeyboard {
  return new InlineKeyboard().text(
    locale.startsWith('fa') ? '🔙 بازگشت' : '🔙 Back',
    'admin:dashboard',
  );
}

export function buildAdminSectionNavigation(
  _section: 'users' | 'broadcast' | 'settings',
  locale = 'en',
): InlineKeyboard {
  return new InlineKeyboard().text(
    locale.startsWith('fa') ? '🔙 بازگشت' : '🔙 Back',
    'admin:dashboard',
  );
}

export function buildUserProfileNavigation(userId: number, locale = 'en'): InlineKeyboard {
  return new InlineKeyboard().text(
    locale.startsWith('fa') ? '🔙 بازگشت به کاربر' : '🔙 Back to user',
    `admin:users:card:${userId}`,
  );
}

export function buildSearchResultsKeyboard(users: User[], locale = 'en'): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  for (const u of users) {
    keyboard.text(`${u.firstName} (${u.telegramId})`, `admin:users:card:${u.telegramId}`).row();
  }
  keyboard.text(locale.startsWith('fa') ? '🔙 بازگشت' : '🔙 Back', 'admin:users');
  return keyboard;
}

export function buildBroadcastMenuKeyboard(locale = 'en'): InlineKeyboard {
  return new InlineKeyboard().text(
    locale.startsWith('fa') ? '🔙 بازگشت' : '🔙 Back',
    'admin:dashboard',
  );
}

export function buildBroadcastConfirmKeyboard(isTest: boolean, locale = 'en'): InlineKeyboard {
  return new InlineKeyboard()
    .text(
      locale.startsWith('fa') ? '✅ تأیید' : '✅ Confirm',
      isTest ? 'admin:broadcast:confirm:test' : 'admin:broadcast:confirm:all',
    )
    .text(locale.startsWith('fa') ? '❌ انصراف' : '❌ Cancel', 'admin:broadcast');
}
