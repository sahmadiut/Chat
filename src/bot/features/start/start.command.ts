/**
 * Start & User Features — Command & Message Handlers
 *
 * USER MENU (Reply Keyboard, max 4-5 buttons):
 * [📋 Help]      [👤 My Profile]
 * [📞 Support]   [ℹ️ About]
 *
 * Provides:
 * - /start & /home -> sends welcome + fixed Reply Keyboard
 * - /help -> static help text
 * - /profile -> user info card + [✏️ Edit Info] [🌐 Language] inline buttons
 * - /support -> enters supportConversation to forward message to admin
 * - /about -> static about text
 * - Language switcher -> immediately renegotiates locale and updates reply keyboard
 */

import { Composer } from 'grammy';
import { getBotCommands } from '#root/bot/commands.js';
import { isAdminUser } from '#root/bot/filters/admin.filter.js';
import { UserService } from '#root/services/user.service.js';
import type { BotContext } from '../../context.js';
import {
  createLanguageInlineKeyboard,
  createUserProfileKeyboard,
  createUserReplyKeyboard,
} from './start.keyboard.js';
import { escapeHtml, formatTelegramMessage, getWelcomeMessage } from './start.presentation.js';

export const startFeature = new Composer<BotContext>();

export function getMainReplyKeyboard(ctx: BotContext) {
  return createUserReplyKeyboard({
    help: ctx.t('menu-user-help'),
    profile: ctx.t('menu-user-profile'),
    support: ctx.t('menu-user-support'),
    about: ctx.t('menu-user-about'),
  });
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().replace('T', ' ').slice(0, 10);
}

async function renderProfileMessage(ctx: BotContext) {
  const userId = ctx.from?.id;
  if (!userId) return { text: ctx.t('error-generic'), reply_markup: undefined };

  const user = await UserService.findByTelegramId(userId);
  const firstName = user?.firstName ?? ctx.from?.first_name ?? '';
  const lastName = user?.lastName ?? ctx.from?.last_name ?? '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const username = user?.username ? `@${escapeHtml(user.username)}` : '—';
  const joinedDate = formatDate(user?.createdAt ?? new Date());
  const status = user?.isBanned
    ? ctx.t('user-profile-status-banned')
    : ctx.t('user-profile-status-active');

  const text = [
    ctx.t('user-profile-title'),
    '━━━━━━━━━━━━━━━━━━━━',
    ctx.t('user-profile-name', { name: escapeHtml(fullName) }),
    ctx.t('user-profile-id', { id: String(userId) }),
    ctx.t('user-profile-username', { username }),
    ctx.t('user-profile-joined', { joined: joinedDate }),
    ctx.t('user-profile-status', { status }),
    '━━━━━━━━━━━━━━━━━━━━',
  ].join('\n');

  const keyboard = createUserProfileKeyboard({
    notifications: ctx.t('user-profile-btn-notifications'),
    language: ctx.t('user-profile-btn-lang'),
    back: ctx.t('common-back'),
  });

  return { text, keyboard };
}

/**
 * /start command handler.
 * Sends welcome message and sets up the persistent Reply Keyboard.
 */
startFeature.command('start', async (ctx) => {
  const text = await getWelcomeMessage(ctx);
  await ctx.reply(text, {
    parse_mode: 'HTML',
    reply_markup: getMainReplyKeyboard(ctx),
  });
});

/**
 * /help command handler & Help button handler.
 */
async function handleHelp(ctx: BotContext) {
  const messageKey = ctx.from && isAdminUser(ctx.from.id) ? 'help-admin' : 'help';
  await ctx.reply(formatTelegramMessage(ctx.t(messageKey)), {
    parse_mode: 'HTML',
    reply_markup: getMainReplyKeyboard(ctx),
  });
}
startFeature.command('help', handleHelp);
startFeature.hears(
  [/^(?:📋|🧭)?\s*(?:Help|Help & Features|Help & guide|راهنما|راهنما و امکانات)/i],
  handleHelp,
);

/**
 * /about command handler & About button handler.
 */
async function handleAbout(ctx: BotContext) {
  await ctx.reply(formatTelegramMessage(ctx.t('about')), {
    parse_mode: 'HTML',
    reply_markup: getMainReplyKeyboard(ctx),
  });
}
startFeature.command('about', handleAbout);
startFeature.hears([/^(?:ℹ️)?\s*(?:About|About this bot|درباره|درباره ربات)/i], handleAbout);

/**
 * /profile command handler & My Profile button handler.
 */
async function handleProfile(ctx: BotContext) {
  const { text, keyboard } = await renderProfileMessage(ctx);
  await ctx.reply(text, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
}
startFeature.command('profile', handleProfile);
startFeature.hears([/^(?:👤)?\s*(?:My Profile|Profile|پروفایل|پروفایل من)/i], handleProfile);

/**
 * /support command handler & Support button handler.
 */
async function handleSupport(ctx: BotContext) {
  await ctx.conversation.enter('supportConversation');
}
startFeature.command('support', handleSupport);
startFeature.hears(
  [/^(?:📞)?\s*(?:Support|Contact Support|پشتیبانی|ارتباط با پشتیبانی)/i],
  handleSupport,
);

// ─── Profile Inline Actions ──────────────────────────────────────────

startFeature.callbackQuery('user:profile:language', async (ctx) => {
  await ctx.answerCallbackQuery();
  const keyboard = createLanguageInlineKeyboard({
    english: ctx.t('language-english'),
    persian: ctx.t('language-persian'),
    back: ctx.t('common-back'),
  });

  await ctx.editMessageText(ctx.t('settings-language'), {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
});

startFeature.callbackQuery(/^user:lang:(en|fa)$/, async (ctx) => {
  const locale = ctx.match[1] ?? 'en';

  const session = await ctx.session;
  session.custom.__language_code = locale;

  // Persist user language choice in database
  if (ctx.from) {
    await UserService.updateLanguage(ctx.from.id, locale);
  }

  await ctx.i18n.renegotiateLocale();

  // Update commands for this chat
  if (ctx.chat?.type === 'private' && ctx.from) {
    const commands = getBotCommands(locale, isAdminUser(ctx.from.id));
    const scope = { type: 'chat' as const, chat_id: ctx.chat.id };
    await ctx.api.setMyCommands(commands, { scope });
  }

  await ctx.answerCallbackQuery({
    text: ctx.t('settings-language-changed'),
  });

  // Re-render the user's profile card in the newly chosen language
  const { text, keyboard } = await renderProfileMessage(ctx);
  await ctx.editMessageText(text, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });

  // Send an updated Reply Keyboard in the new language
  await ctx.reply(ctx.t('settings-language-changed'), {
    parse_mode: 'HTML',
    reply_markup: getMainReplyKeyboard(ctx),
  });
});

startFeature.callbackQuery('user:profile:back', async (ctx) => {
  await ctx.answerCallbackQuery();
  const { text, keyboard } = await renderProfileMessage(ctx);
  await ctx.editMessageText(text, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
});

// Backward compatibility routes for legacy buttons
startFeature.callbackQuery('user:help', async (ctx) => {
  await ctx.answerCallbackQuery();
  await handleHelp(ctx);
});

startFeature.callbackQuery('user:about', async (ctx) => {
  await ctx.answerCallbackQuery();
  await handleAbout(ctx);
});

startFeature.callbackQuery('user:home', async (ctx) => {
  await ctx.answerCallbackQuery();
  const text = await getWelcomeMessage(ctx);
  await ctx.reply(text, {
    parse_mode: 'HTML',
    reply_markup: getMainReplyKeyboard(ctx),
  });
});

/**
 * Fallback handler — fires for any private text message that didn't match
 * a command or a known menu button. Reminds the user to use the keyboard.
 */
startFeature.on('message:text', async (ctx) => {
  await ctx.reply(ctx.t('unknown-command'), {
    parse_mode: 'HTML',
    reply_markup: getMainReplyKeyboard(ctx),
  });
});
