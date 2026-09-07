/**
 * Settings Feature — Command Handler
 *
 * Handles the /settings command and language selection.
 * Allows users to change their preferred language via inline keyboard.
 */

import { Composer } from 'grammy';
import { getBotCommands } from '#root/bot/commands.js';
import { isAdminUser } from '#root/bot/filters/admin.filter.js';
import { UserService } from '#root/services/user.service.js';
import type { BotContext } from '../../context.js';
import { getMainReplyKeyboard } from '../start/start.command.js';
import { createStartKeyboard } from '../start/start.keyboard.js';
import { getWelcomeMessage } from '../start/start.presentation.js';
import { createLanguageKeyboard, createSettingsKeyboard } from './settings.keyboard.js';

export const settingsFeature = new Composer<BotContext>();

function settingsKeyboard(ctx: BotContext) {
  return createSettingsKeyboard({
    language: ctx.t('settings-language-button'),
    notifications: ctx.t('settings-notifications-button'),
    home: ctx.t('settings-home-button'),
  });
}

function languageKeyboard(ctx: BotContext) {
  return createLanguageKeyboard({
    english: ctx.t('language-english'),
    persian: ctx.t('language-persian'),
    back: ctx.t('settings-back-button'),
    home: ctx.t('menu-home'),
  });
}

function startKeyboard(ctx: BotContext) {
  return createStartKeyboard({
    settings: ctx.t('menu-settings'),
    help: ctx.t('menu-help'),
    admin: ctx.from && isAdminUser(ctx.from.id) ? ctx.t('menu-admin') : undefined,
  });
}

/**
 * /settings command — shows the main settings menu.
 */
settingsFeature.command('settings', async (ctx) => {
  await ctx.reply(ctx.t('settings-title'), {
    parse_mode: 'HTML',
    reply_markup: settingsKeyboard(ctx),
  });
});

/**
 * Callback: open settings from other screens (e.g., start keyboard).
 */
settingsFeature.callbackQuery('user:settings', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(ctx.t('settings-title'), {
    parse_mode: 'HTML',
    reply_markup: settingsKeyboard(ctx),
  });
});

/**
 * Callback: show language selection keyboard.
 */
settingsFeature.callbackQuery('user:settings:language', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(ctx.t('settings-language'), {
    parse_mode: 'HTML',
    reply_markup: languageKeyboard(ctx),
  });
});

/**
 * Callback: handle language selection.
 * Updates the i18n locale for the current user.
 */
settingsFeature.callbackQuery(/^user:settings:language:(en|fa)$/, async (ctx) => {
  const locale = ctx.match[1] ?? 'en';

  // Store language in the multi-key session's custom data
  const session = await ctx.session;
  session.custom.__language_code = locale;

  // Persist to database so choice remains across sessions/restarts
  if (ctx.from) {
    await UserService.updateLanguage(ctx.from.id, locale);
  }

  // Update the active i18n locale for this request
  await ctx.i18n.renegotiateLocale();

  // Keep Telegram's native command menu aligned with the language selected in the bot.
  if (ctx.chat?.type === 'private' && ctx.from) {
    const commands = getBotCommands(locale, isAdminUser(ctx.from.id));
    const scope = { type: 'chat' as const, chat_id: ctx.chat.id };
    await ctx.api.setMyCommands(commands, { scope });
  }

  await ctx.answerCallbackQuery({
    text: ctx.t('settings-language-changed'),
  });

  // Refresh the settings view with the new locale
  await ctx.editMessageText(ctx.t('settings-title'), {
    parse_mode: 'HTML',
    reply_markup: settingsKeyboard(ctx),
  });

  // Update persistent reply keyboard to new language
  await ctx.reply(ctx.t('settings-language-changed'), {
    parse_mode: 'HTML',
    reply_markup: getMainReplyKeyboard(ctx),
  });
});

/**
 * Callback: navigate back (close settings).
 */
settingsFeature.callbackQuery('user:home', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(await getWelcomeMessage(ctx), {
    parse_mode: 'HTML',
    reply_markup: startKeyboard(ctx),
  });
});
