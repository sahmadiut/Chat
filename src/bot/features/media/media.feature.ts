/** Automatic photo, document, and video storage handlers. */

import { Composer } from 'grammy';
import { createLogger } from '#root/utils/logger.js';
import type { BotContext } from '../../context.js';
import { downloadTelegramFile } from '../../media/download.js';

const log = createLogger('MediaFeature');

interface IncomingMedia {
  fileId: string;
  fileName: string;
  fileSize?: number;
  mimeType: string;
  kind: 'document' | 'photo' | 'video';
}

async function storeIncomingMedia(ctx: BotContext, media: IncomingMedia): Promise<void> {
  try {
    const stored = await downloadTelegramFile(ctx.api, media.fileId, {
      expectedSize: media.fileSize,
      fileName: media.fileName,
      mimeType: media.mimeType,
    });

    log.info(
      {
        userId: ctx.from?.id,
        chatId: ctx.chat?.id,
        kind: media.kind,
        mimeType: stored.mimeType,
        size: stored.size,
        fileName: stored.fileName,
      },
      'Telegram media stored',
    );
    await ctx.reply(ctx.t('media-saved', { kind: ctx.t(`media-kind-${media.kind}`) }));
  } catch (error) {
    log.warn(
      { error, userId: ctx.from?.id, chatId: ctx.chat?.id, kind: media.kind },
      'Telegram media rejected',
    );
    const reason = error instanceof Error ? error.message : ctx.t('error-generic');
    await ctx.reply(ctx.t('media-rejected', { reason }));
  }
}

export const mediaFeature = new Composer<BotContext>();

mediaFeature.on('message:photo', async (ctx) => {
  const photo = ctx.message.photo.at(-1);
  if (!photo) return;

  await storeIncomingMedia(ctx, {
    fileId: photo.file_id,
    fileName: `${photo.file_unique_id}.jpg`,
    fileSize: photo.file_size,
    mimeType: 'image/jpeg',
    kind: 'photo',
  });
});

mediaFeature.on('message:document', async (ctx) => {
  const document = ctx.message.document;
  await storeIncomingMedia(ctx, {
    fileId: document.file_id,
    fileName: document.file_name ?? document.file_unique_id,
    fileSize: document.file_size,
    mimeType: document.mime_type ?? 'application/octet-stream',
    kind: 'document',
  });
});

mediaFeature.on('message:video', async (ctx) => {
  const video = ctx.message.video;
  await storeIncomingMedia(ctx, {
    fileId: video.file_id,
    fileName: video.file_name ?? `${video.file_unique_id}.mp4`,
    fileSize: video.file_size,
    mimeType: video.mime_type ?? 'video/mp4',
    kind: 'video',
  });
});
