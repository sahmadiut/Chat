/** Telegram Mini App launcher and service-message payload scaffold. */

import { Composer, InlineKeyboard } from 'grammy';
import { z } from 'zod';
import { env } from '#root/config/env.js';
import type { BotContext } from '../../context.js';

export const webAppPayloadSchema = z
  .object({
    action: z.literal('submit'),
    value: z.string().trim().min(1).max(500),
  })
  .strict();

export type WebAppPayload = z.infer<typeof webAppPayloadSchema>;

export function getWebAppUrl(): string | null {
  const url =
    env.WEB_APP_URL ??
    (env.WEBHOOK_URL ? `${env.WEBHOOK_URL.replace(/\/$/, '')}/webapp` : undefined);
  return url ?? null;
}

export const webAppFeature = new Composer<BotContext>();

webAppFeature.command('webapp', async (ctx) => {
  if (ctx.chat.type !== 'private') {
    await ctx.reply(ctx.t('webapp-private-only'));
    return;
  }

  const url = getWebAppUrl();
  if (!url) {
    await ctx.reply(ctx.t('webapp-unavailable'));
    return;
  }

  const keyboard = new InlineKeyboard().webApp(ctx.t('webapp-open-button'), url);
  await ctx.reply(ctx.t('webapp-intro'), { reply_markup: keyboard });
});

webAppFeature.on('message:web_app_data', async (ctx) => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(ctx.message.web_app_data.data);
  } catch {
    await ctx.reply(ctx.t('webapp-invalid-data'));
    return;
  }

  const payload = webAppPayloadSchema.safeParse(parsed);
  if (!payload.success) {
    await ctx.reply(ctx.t('webapp-invalid-data'));
    return;
  }

  await ctx.reply(ctx.t('webapp-data-received', { value: payload.data.value }));
});
