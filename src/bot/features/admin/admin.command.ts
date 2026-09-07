/**
 * Admin Feature — Command & Callback Handlers
 *
 * ADMIN MENU (Inline Keyboard, minimal — exactly these 5 items):
 * [📊 Stats]        [👥 Users]
 * [📢 Broadcast]    [⚙️ Settings]
 * [❌ Close]
 *
 * 1. Stats -> Shows Stats view + [🔙 Back]
 * 2. Users -> [🔍 Search] [📋 List] (paginated) [🔙 Back]
 *    -> User card: [✉️ Message] [🚫 Ban] / [✅ Unban], [🔙 Back to list]
 *    -> Ban/Unban confirmation step: [✅ Confirm] [❌ Cancel]
 * 3. Broadcast -> 4-step wizard
 * 4. Settings -> [🔧 Maintenance: ✅/❌] [📢 Force channel join: ✅/❌] [✉️ Edit welcome message] [🌐 Language] [🔙 Back]
 * 5. Close -> deletes/removes admin panel message
 */

import { Composer, InlineKeyboard } from 'grammy';
import { getBotCommands } from '#root/bot/commands.js';
import { AdminLogService } from '#root/services/admin-log.service.js';
import { SettingService } from '#root/services/setting.service.js';
import { UserService } from '#root/services/user.service.js';
import type { BotContext } from '../../context.js';
import { isAdmin, isAdminUser } from '../../filters/admin.filter.js';
import { escapeHtml, formatAdminStats, formatAdminUserCard } from './admin.formatters.js';
import {
  buildActionConfirmKeyboard,
  buildAdminLanguageKeyboard,
  buildAdminMainMenuKeyboard,
  buildAdminSettingsKeyboard,
  buildPaginatedUsersKeyboard,
  buildStatsViewKeyboard,
  buildUserCardKeyboard,
  buildUsersSubmenuKeyboard,
} from './admin.keyboards.js';

export const adminFeature = new Composer<BotContext>();

export function getAdminRootKeyboard(ctx: BotContext) {
  return buildAdminMainMenuKeyboard({
    stats: ctx.t('admin-btn-stats'),
    users: ctx.t('admin-btn-users'),
    broadcast: ctx.t('admin-btn-broadcast'),
    settings: ctx.t('admin-btn-settings'),
    close: ctx.t('admin-btn-close'),
  });
}

// ─── Main Admin Panel Entrypoint ─────────────────────────────────────

adminFeature.command('admin', async (ctx) => {
  if (!ctx.from || !isAdminUser(ctx.from.id)) {
    await ctx.reply(ctx.t('admin-access-denied'), {
      parse_mode: 'HTML',
    });
    return;
  }

  await ctx.reply(ctx.t('admin-menu-title'), {
    parse_mode: 'HTML',
    reply_markup: getAdminRootKeyboard(ctx),
  });
});

// Guard: all callbacks below this require admin privileges
adminFeature.use(isAdmin);

/**
 * Root Dashboard navigation
 */
adminFeature.callbackQuery('admin:dashboard', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(ctx.t('admin-menu-title'), {
    parse_mode: 'HTML',
    reply_markup: getAdminRootKeyboard(ctx),
  });
});

/**
 * 5. Close Panel
 */
adminFeature.callbackQuery('admin:close', async (ctx) => {
  await ctx.answerCallbackQuery({
    text: ctx.t('admin-closed-alert'),
  });
  await ctx.deleteMessage();
});

// ─── 1. Stats Section ────────────────────────────────────────────────

adminFeature.callbackQuery('admin:stats', async (ctx) => {
  await ctx.answerCallbackQuery();
  const userStats = await UserService.getStats();
  const text = formatAdminStats({
    userStats,
    t: (k, a) => ctx.t(k, a),
  });

  await ctx.editMessageText(text, {
    parse_mode: 'HTML',
    reply_markup: buildStatsViewKeyboard(ctx.t('common-back')),
  });
});

// ─── 2. Users Section ────────────────────────────────────────────────

adminFeature.callbackQuery('admin:users', async (ctx) => {
  await ctx.answerCallbackQuery();
  const keyboard = buildUsersSubmenuKeyboard({
    search: ctx.t('admin-users-btn-search'),
    list: ctx.t('admin-users-btn-list'),
    back: ctx.t('common-back'),
  });

  await ctx.editMessageText(ctx.t('admin-users-title'), {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
});

adminFeature.callbackQuery('admin:users:search', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter('searchUserConversation');
});

// Paginated Users List (admin:users:list:<page>)
adminFeature.callbackQuery(/^admin:users:list:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const page = Math.max(1, Number(ctx.match[1]));
  const pageSize = 5;
  const paginated = await UserService.getAll(page, pageSize);

  const keyboard = buildPaginatedUsersKeyboard({
    users: paginated.data,
    page: paginated.page,
    totalPages: paginated.totalPages,
    prevLabel: ctx.t('common-prev'),
    nextLabel: ctx.t('common-next'),
    pageLabel: ctx.t('common-page', {
      current: String(paginated.page),
      total: String(paginated.totalPages),
    }),
    backLabel: ctx.t('common-back'),
  });

  await ctx.editMessageText(ctx.t('admin-users-title'), {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
});

// View User Card as a new message (e.g. from Support Alert: admin:users:view:<userId>)
adminFeature.callbackQuery(/^admin:users:view:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = Number(ctx.match[1]);
  const user = await UserService.findByTelegramId(userId);

  if (!user) {
    await ctx.reply(ctx.t('error-generic'));
    return;
  }

  const text = formatAdminUserCard({ user, t: (k, a) => ctx.t(k, a) });
  const keyboard = buildUserCardKeyboard({
    userId: user.telegramId,
    isBanned: user.isBanned,
    messageLabel: ctx.t('admin-users-btn-message'),
    banLabel: ctx.t('admin-users-btn-ban'),
    unbanLabel: ctx.t('admin-users-btn-unban'),
    backLabel: ctx.t('common-close'),
    backCallback: 'admin:close',
  });

  await ctx.reply(text, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
});

// View User Card (admin:users:card:<userId>)
adminFeature.callbackQuery(/^admin:users:card:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = Number(ctx.match[1]);
  const user = await UserService.findByTelegramId(userId);

  if (!user) {
    await ctx.reply(ctx.t('error-generic'));
    return;
  }

  const text = formatAdminUserCard({ user, t: (k, a) => ctx.t(k, a) });
  const keyboard = buildUserCardKeyboard({
    userId: user.telegramId,
    isBanned: user.isBanned,
    messageLabel: ctx.t('admin-users-btn-message'),
    banLabel: ctx.t('admin-users-btn-ban'),
    unbanLabel: ctx.t('admin-users-btn-unban'),
    backLabel: ctx.t('admin-users-btn-back-list'),
  });

  await ctx.editMessageText(text, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
});

// Direct message to user from user card or support alert
adminFeature.callbackQuery(/^admin:users:dm:(\d+)(?::(\d+))?$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter('directMessageConversation');
});

// Ask Confirmation for Ban
adminFeature.callbackQuery(/^admin:users:ban:ask:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = Number(ctx.match[1]);
  const user = await UserService.findByTelegramId(userId);
  if (!user) return;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const text = ctx.t('admin-confirm-ban-title', {
    name: escapeHtml(fullName),
    id: String(userId),
  });

  const keyboard = buildActionConfirmKeyboard({
    action: 'ban',
    param: userId,
    confirmLabel: ctx.t('common-confirm'),
    cancelLabel: ctx.t('common-cancel'),
    cancelCallback: `admin:users:card:${userId}`,
  });

  await ctx.editMessageText(text, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
});

// Ask Confirmation for Unban
adminFeature.callbackQuery(/^admin:users:unban:ask:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = Number(ctx.match[1]);
  const user = await UserService.findByTelegramId(userId);
  if (!user) return;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const text = ctx.t('admin-confirm-unban-title', {
    name: escapeHtml(fullName),
    id: String(userId),
  });

  const keyboard = buildActionConfirmKeyboard({
    action: 'unban',
    param: userId,
    confirmLabel: ctx.t('common-confirm'),
    cancelLabel: ctx.t('common-cancel'),
    cancelCallback: `admin:users:card:${userId}`,
  });

  await ctx.editMessageText(text, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
});

// Execute Confirmed Ban
adminFeature.callbackQuery(/^admin:confirm:ban:(\d+)$/, async (ctx) => {
  const userId = Number(ctx.match[1]);
  await UserService.banUser(userId, 'Banned by admin via panel');

  if (ctx.from) {
    await AdminLogService.logAction({
      adminTelegramId: ctx.from.id,
      action: 'ban_user',
      targetUserId: userId,
      details: 'User banned via admin panel confirmation',
    });
  }

  await ctx.answerCallbackQuery({
    text: ctx.t('admin-action-ban-success', { id: String(userId) }),
  });

  const updated = await UserService.findByTelegramId(userId);
  if (updated) {
    const text = formatAdminUserCard({ user: updated, t: (k, a) => ctx.t(k, a) });
    const keyboard = buildUserCardKeyboard({
      userId: updated.telegramId,
      isBanned: updated.isBanned,
      messageLabel: ctx.t('admin-users-btn-message'),
      banLabel: ctx.t('admin-users-btn-ban'),
      unbanLabel: ctx.t('admin-users-btn-unban'),
      backLabel: ctx.t('admin-users-btn-back-list'),
    });
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  }
});

// Execute Confirmed Unban
adminFeature.callbackQuery(/^admin:confirm:unban:(\d+)$/, async (ctx) => {
  const userId = Number(ctx.match[1]);
  await UserService.unbanUser(userId);

  if (ctx.from) {
    await AdminLogService.logAction({
      adminTelegramId: ctx.from.id,
      action: 'unban_user',
      targetUserId: userId,
      details: 'User unbanned via admin panel confirmation',
    });
  }

  await ctx.answerCallbackQuery({
    text: ctx.t('admin-action-unban-success', { id: String(userId) }),
  });

  const updated = await UserService.findByTelegramId(userId);
  if (updated) {
    const text = formatAdminUserCard({ user: updated, t: (k, a) => ctx.t(k, a) });
    const keyboard = buildUserCardKeyboard({
      userId: updated.telegramId,
      isBanned: updated.isBanned,
      messageLabel: ctx.t('admin-users-btn-message'),
      banLabel: ctx.t('admin-users-btn-ban'),
      unbanLabel: ctx.t('admin-users-btn-unban'),
      backLabel: ctx.t('admin-users-btn-back-list'),
    });
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  }
});

// ─── 3. Broadcast Section ────────────────────────────────────────────

adminFeature.callbackQuery('admin:broadcast', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter('broadcastConversation');
});

// ─── 4. Settings Section ─────────────────────────────────────────────

async function renderAdminSettings(ctx: BotContext) {
  const [isMaintenance, isForceJoin, defaultLang] = await Promise.all([
    SettingService.isMaintenanceMode(),
    SettingService.isForceChannelJoin(),
    SettingService.getDefaultLanguage(),
  ]);

  const currentDefaultLang = defaultLang ?? 'fa';
  const langDisplay = currentDefaultLang === 'fa' ? '🇮🇷 فارسی' : '🇬🇧 English';

  const maintenanceLabel = isMaintenance
    ? ctx.t('admin-settings-maint-on')
    : ctx.t('admin-settings-maint-off');

  const forceJoinLabel = isForceJoin
    ? ctx.t('admin-settings-force-join-on')
    : ctx.t('admin-settings-force-join-off');

  const keyboard = buildAdminSettingsKeyboard({
    maintenanceLabel,
    forceJoinLabel,
    editWelcomeLabel: ctx.t('admin-settings-edit-welcome'),
    languageLabel: `${ctx.t('admin-settings-language')}: ${langDisplay}`,
    backLabel: ctx.t('common-back'),
  });

  return { text: ctx.t('admin-settings-title'), keyboard };
}

adminFeature.callbackQuery('admin:settings', async (ctx) => {
  await ctx.answerCallbackQuery();
  const { text, keyboard } = await renderAdminSettings(ctx);
  await ctx.editMessageText(text, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
});

// Toggle Maintenance Mode
adminFeature.callbackQuery('admin:settings:toggle:maint', async (ctx) => {
  const current = await SettingService.isMaintenanceMode();
  const next = !current;
  await SettingService.setMaintenanceMode(next);

  if (ctx.from) {
    await AdminLogService.logAction({
      adminTelegramId: ctx.from.id,
      action: 'toggle_maintenance',
      details: `Maintenance mode ${next ? 'enabled' : 'disabled'}`,
    });
  }

  await ctx.answerCallbackQuery();
  const { text, keyboard } = await renderAdminSettings(ctx);
  await ctx.editMessageText(text, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
});

// Toggle Force Channel Join
adminFeature.callbackQuery('admin:settings:toggle:forcejoin', async (ctx) => {
  const current = await SettingService.isForceChannelJoin();
  const next = !current;
  await SettingService.setForceChannelJoin(next);

  if (ctx.from) {
    await AdminLogService.logAction({
      adminTelegramId: ctx.from.id,
      action: 'toggle_force_join',
      details: `Force channel join ${next ? 'enabled' : 'disabled'}`,
    });
  }

  await ctx.answerCallbackQuery();
  const { text, keyboard } = await renderAdminSettings(ctx);
  await ctx.editMessageText(text, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
});

// Edit Welcome Message
adminFeature.callbackQuery('admin:settings:editwelcome', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter('editWelcomeMessageConversation');
});

// Admin Language Switcher Submenu
adminFeature.callbackQuery('admin:settings:lang', async (ctx) => {
  await ctx.answerCallbackQuery();
  const keyboard = buildAdminLanguageKeyboard({
    english: ctx.t('language-english'),
    persian: ctx.t('language-persian'),
    back: ctx.t('common-back'),
  });

  await ctx.editMessageText(ctx.t('admin-settings-language-prompt'), {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
});

// Handle Admin Setting Language Switch (Changes bot-wide default language & updates admin session)
adminFeature.callbackQuery(/^admin:settings:setlang:(en|fa)$/, async (ctx) => {
  const locale = (ctx.match[1] as 'en' | 'fa') ?? 'en';

  // Update bot-wide default language in database
  await SettingService.setDefaultLanguage(locale);

  // Also update admin's own session and DB language
  const session = await ctx.session;
  session.custom.__language_code = locale;
  if (ctx.from) {
    await UserService.updateLanguage(ctx.from.id, locale);
  }
  await ctx.i18n.renegotiateLocale();

  if (ctx.chat?.type === 'private' && ctx.from) {
    const commands = getBotCommands(locale, true);
    const scope = { type: 'chat' as const, chat_id: ctx.chat.id };
    await ctx.api.setMyCommands(commands, { scope });
  }

  if (ctx.from) {
    await AdminLogService.logAction({
      adminTelegramId: ctx.from.id,
      action: 'change_default_language',
      details: `Bot default language changed to ${locale}`,
    });
  }

  await ctx.answerCallbackQuery({
    text: ctx.t('settings-language-changed'),
  });

  const { text, keyboard } = await renderAdminSettings(ctx);
  await ctx.editMessageText(text, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
});
