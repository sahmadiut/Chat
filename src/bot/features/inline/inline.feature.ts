/** Inline-mode scaffold that can be extended with domain-specific search results. */

import { Composer } from 'grammy';
import type { BotContext } from '../../context.js';

export const inlineFeature = new Composer<BotContext>();

inlineFeature.on('inline_query', async (ctx) => {
  const query = ctx.inlineQuery.query.trim().slice(0, 256);
  const title = query ? ctx.t('inline-result-title', { query }) : ctx.t('inline-empty-title');
  const message = query
    ? ctx.t('inline-result-message', { query })
    : ctx.t('inline-empty-message', { username: ctx.me.username });

  await ctx.answerInlineQuery(
    [
      {
        type: 'article',
        id: query ? 'query-result' : 'inline-help',
        title,
        description: ctx.t('inline-result-description'),
        input_message_content: {
          message_text: message,
        },
      },
    ],
    {
      cache_time: 15,
      is_personal: true,
    },
  );
});
