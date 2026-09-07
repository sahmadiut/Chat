import type { BotContext } from '../../context.js';

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatTelegramMessage(text: string): string {
  if (/<\/?[a-z][^>]*>/i.test(text)) return text;

  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/gs, '<b>$1</b>')
    .replace(/__(.+?)__/gs, '<b>$1</b>')
    .replace(/(^|\s)\*(\S.+?\S)\*(?=\s|$)/gms, '$1<i>$2</i>')
    .replace(/(^|\s)_(\S.+?\S)_(?=\s|$)/gms, '$1<i>$2</i>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');
}

export async function getWelcomeMessage(ctx: BotContext): Promise<string> {
  const firstName = ctx.from?.first_name ?? ctx.t('friend');
  return formatTelegramMessage(ctx.t('welcome', { name: firstName }));
}
