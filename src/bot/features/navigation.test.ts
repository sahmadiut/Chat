import type { InlineKeyboardButton, KeyboardButton } from 'grammy/types';
import { describe, expect, it } from 'vitest';
import { getBotCommands } from '../commands.js';
import {
  buildAdminMainMenuKeyboard,
  buildAdminSettingsKeyboard,
  buildPaginatedUsersKeyboard,
  buildStatsViewKeyboard,
  buildUserCardKeyboard,
  buildUsersSubmenuKeyboard,
} from './admin/admin.keyboards.js';
import {
  createLanguageInlineKeyboard,
  createSupportAdminKeyboard,
  createUserProfileKeyboard,
  createUserReplyKeyboard,
} from './start/start.keyboard.js';

function callbacks(keyboard: { inline_keyboard: InlineKeyboardButton[][] }): unknown[][] {
  return keyboard.inline_keyboard.map((row) =>
    row.map((button) => ('callback_data' in button ? button.callback_data : undefined)),
  );
}

function replyButtons(keyboard: { keyboard: (KeyboardButton | string)[][] }): string[][] {
  return keyboard.keyboard.map((row) =>
    row.map((button) =>
      typeof button === 'string' ? button : 'text' in button ? button.text : '',
    ),
  );
}

describe('User Menu Navigation (Reply & Inline)', () => {
  it('creates 4-button user reply keyboard', () => {
    const enKeyboard = createUserReplyKeyboard({
      help: '📋 Help',
      profile: '👤 My Profile',
      support: '📞 Support',
      about: 'ℹ️ About',
    });

    expect(replyButtons(enKeyboard)).toEqual([
      ['📋 Help', '👤 My Profile'],
      ['📞 Support', 'ℹ️ About'],
    ]);

    const faKeyboard = createUserReplyKeyboard({
      help: '📋 راهنما',
      profile: '👤 پروفایل من',
      support: '📞 پشتیبانی',
      about: 'ℹ️ درباره ربات',
    });

    expect(replyButtons(faKeyboard)).toEqual([
      ['📋 راهنما', '👤 پروفایل من'],
      ['📞 پشتیبانی', 'ℹ️ درباره ربات'],
    ]);
  });

  it('provides profile inline navigation with notifications, language and back', () => {
    const profileKeyboard = createUserProfileKeyboard({
      notifications: '🔔 Notifications',
      language: '🌐 Language',
      back: '🔙 Back',
    });

    expect(callbacks(profileKeyboard)).toEqual([
      ['notify:preferences:1'],
      ['user:profile:language', 'user:profile:back'],
    ]);
  });

  it('provides language switch inline keyboard', () => {
    const langKeyboard = createLanguageInlineKeyboard({
      english: '🇬🇧 English',
      persian: '🇮🇷 فارسی',
      back: '🔙 Back',
    });

    expect(callbacks(langKeyboard)).toEqual([
      ['user:lang:en', 'user:lang:fa'],
      ['user:profile:back'],
    ]);
  });

  it('provides support admin alert inline keyboard with user card, direct reply and ban actions', () => {
    const adminSupportKeyboard = createSupportAdminKeyboard({
      viewUser: '👤 View User',
      reply: '✉️ Reply',
      ban: '🚫 Ban',
      userId: 123456789,
      messageId: 555,
    });

    expect(callbacks(adminSupportKeyboard)).toEqual([
      ['admin:users:view:123456789', 'admin:users:dm:123456789:555'],
      ['admin:users:ban:ask:123456789'],
    ]);
  });
});

describe('Admin Menu Navigation (Inline)', () => {
  it('builds minimal 5-item root admin menu', () => {
    const adminMenu = buildAdminMainMenuKeyboard({
      stats: '📊 Stats',
      users: '👥 Users',
      broadcast: '📢 Broadcast',
      settings: '⚙️ Settings',
      close: '❌ Close',
    });

    expect(callbacks(adminMenu)).toEqual([
      ['admin:stats', 'admin:users'],
      ['admin:broadcast', 'admin:settings'],
      ['admin:close'],
    ]);
  });

  it('builds stats view with back button', () => {
    const statsKeyboard = buildStatsViewKeyboard('🔙 Back');
    expect(callbacks(statsKeyboard)).toEqual([['admin:dashboard']]);
  });

  it('builds users submenu with search, paginated list and back', () => {
    const usersSubmenu = buildUsersSubmenuKeyboard({
      search: '🔍 Search',
      list: '📋 List',
      back: '🔙 Back',
    });

    expect(callbacks(usersSubmenu)).toEqual([
      ['admin:users:search'],
      ['admin:users:list:1'],
      ['admin:dashboard'],
    ]);
  });

  it('builds paginated users list with prev/page/next and user cards', () => {
    const mockUsers = [
      {
        telegramId: 101,
        firstName: 'Alice',
        lastName: 'Smith',
        username: 'alice',
        languageCode: 'en',
        isBot: false,
        isPremium: false,
        addedToAttachmentMenu: false,
        isBlocked: false,
        isBanned: false,
        banReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const keyboard = buildPaginatedUsersKeyboard({
      users: mockUsers,
      page: 2,
      totalPages: 5,
      prevLabel: '⬅️ Prev',
      nextLabel: '➡️ Next',
      pageLabel: 'Page 2/5',
      backLabel: '🔙 Back',
    });

    expect(callbacks(keyboard)).toEqual([
      ['admin:users:card:101'],
      ['admin:users:list:1', 'admin:users:list:2', 'admin:users:list:3'],
      ['admin:users'],
    ]);
  });

  it('builds user card actions with ban/unban toggle and back to list', () => {
    const activeUserCard = buildUserCardKeyboard({
      userId: 101,
      isBanned: false,
      messageLabel: '✉️ Message',
      banLabel: '🚫 Ban',
      unbanLabel: '✅ Unban',
      backLabel: '🔙 Back to list',
    });

    expect(callbacks(activeUserCard)).toEqual([
      ['admin:users:dm:101', 'admin:users:ban:ask:101'],
      ['admin:users:list:1'],
    ]);

    const bannedUserCard = buildUserCardKeyboard({
      userId: 101,
      isBanned: true,
      messageLabel: '✉️ Message',
      banLabel: '🚫 Ban',
      unbanLabel: '✅ Unban',
      backLabel: '🔙 Back to list',
    });

    expect(callbacks(bannedUserCard)).toEqual([
      ['admin:users:dm:101', 'admin:users:unban:ask:101'],
      ['admin:users:list:1'],
    ]);
  });

  it('builds admin settings with live toggles, edit welcome, language, and back', () => {
    const settingsKeyboard = buildAdminSettingsKeyboard({
      maintenanceLabel: '🔧 Maintenance mode: ❌',
      forceJoinLabel: '📢 Force channel join: ❌',
      editWelcomeLabel: '✉️ Edit welcome message',
      languageLabel: '🌐 Language',
      backLabel: '🔙 Back',
    });

    expect(callbacks(settingsKeyboard)).toEqual([
      ['admin:settings:toggle:maint'],
      ['admin:settings:toggle:forcejoin'],
      ['admin:settings:editwelcome'],
      ['admin:settings:lang'],
      ['admin:dashboard'],
    ]);
  });

  it('exposes admin commands only for administrators', () => {
    expect(getBotCommands('en', false).map(({ command }) => command)).toEqual([
      'start',
      'help',
      'profile',
      'notifications',
      'support',
      'about',
    ]);
    expect(getBotCommands('fa', true).map(({ command }) => command)).toEqual([
      'start',
      'help',
      'profile',
      'notifications',
      'support',
      'about',
      'admin',
    ]);
  });
});
