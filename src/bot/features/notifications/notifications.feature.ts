/** User-facing notification preference menu using structured callback routing. */

import { Composer, InlineKeyboard } from 'grammy';
import { buildCallbackData } from '#root/bot/navigation/callback-data.js';
import { CallbackRouter } from '#root/bot/navigation/callback-router.js';
import { createPaginationKeyboard, paginate } from '#root/bot/navigation/pagination.js';
import {
  DEFAULT_NOTIFICATION_TYPES,
  NotificationPreferenceService,
} from '#root/services/notification-preference.service.js';
import type { BotContext } from '../../context.js';

const PAGE_SIZE = 2;
const router = new CallbackRouter();

function typeLabel(ctx: BotContext, type: string): string {
  return ctx.t(`notifications-type-${type.replaceAll('_', '-')}`);
}

async function buildPreferenceKeyboard(ctx: BotContext, requestedPage = 1) {
  if (!ctx.from) throw new Error('Notification preferences require a Telegram user');

  const preferences = await NotificationPreferenceService.getForUser(ctx.from.id);
  const page = paginate(preferences, requestedPage, PAGE_SIZE);
  const rows = page.items.map((preference) => [
    InlineKeyboard.text(
      `${preference.enabled ? '✅' : '🔕'} ${typeLabel(ctx, preference.type)}`,
      buildCallbackData('notify', 'toggle', preference.type, String(page.page)),
    ),
  ]);
  const pagination = createPaginationKeyboard({
    page: page.page,
    totalPages: page.totalPages,
    callbackData: (targetPage) =>
      targetPage === page.page
        ? buildCallbackData('notify', 'noop')
        : buildCallbackData('notify', 'preferences', String(targetPage)),
    previousLabel: ctx.t('pagination-previous'),
    nextLabel: ctx.t('pagination-next'),
  });

  return new InlineKeyboard([...rows, ...pagination.inline_keyboard])
    .row()
    .text(ctx.t('common-back'), 'user:profile:back');
}

async function renderPreferences(ctx: BotContext, page = 1, edit = true): Promise<void> {
  const payload = {
    parse_mode: 'HTML' as const,
    reply_markup: await buildPreferenceKeyboard(ctx, page),
  };
  if (edit) {
    await ctx.editMessageText(ctx.t('notifications-title'), payload);
  } else {
    await ctx.reply(ctx.t('notifications-title'), payload);
  }
}

router.on('notify', 'preferences', async (ctx, callback) => {
  const page = Number(callback.params[0] ?? 1);
  await ctx.answerCallbackQuery();
  await renderPreferences(ctx, page);
});

router.on('notify', 'toggle', async (ctx, callback) => {
  const type = callback.params[0];
  const page = Number(callback.params[1] ?? 1);
  if (!ctx.from || !type) {
    await ctx.answerCallbackQuery({ text: ctx.t('error-generic') });
    return;
  }

  const enabled = await NotificationPreferenceService.toggle(ctx.from.id, type);
  await ctx.answerCallbackQuery({
    text: ctx.t(enabled ? 'notifications-enabled' : 'notifications-disabled'),
  });
  await renderPreferences(ctx, page);
});

router.on('notify', 'noop', async (ctx) => {
  await ctx.answerCallbackQuery();
});

export const notificationsFeature = new Composer<BotContext>();
notificationsFeature.use(router.middleware());
notificationsFeature.command('notifications', async (ctx) => {
  await renderPreferences(ctx, 1, false);
});
