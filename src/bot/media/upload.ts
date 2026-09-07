/** Upload validated files from local storage to Telegram. */

import { open, stat } from 'node:fs/promises';
import path from 'node:path';
import { type Api, InputFile } from 'grammy';
import type { Message } from 'grammy/types';
import { env } from '#root/config/env.js';
import {
  DEFAULT_ALLOWED_MEDIA_MIME_TYPES,
  DEFAULT_MAX_MEDIA_SIZE_BYTES,
  type MediaValidationOptions,
  detectMimeType,
  inferMimeType,
  validateMediaMetadata,
} from './validation.js';

export type UploadMediaKind = 'document' | 'photo' | 'video';

export interface UploadLocalFileOptions extends MediaValidationOptions {
  allowedRoot?: string;
  caption?: string;
  mimeType?: string;
}

function assertWithinRoot(filePath: string, allowedRoot: string): void {
  const relative = path.relative(allowedRoot, filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('File is outside the configured upload directory');
  }
}

/** Send a local file only after path, size, and magic-byte MIME validation. */
export async function uploadLocalFile(
  api: Api,
  chatId: number | string,
  filePath: string,
  kind: UploadMediaKind = 'document',
  options: UploadLocalFileOptions = {},
): Promise<Message> {
  const allowedRoot = path.resolve(options.allowedRoot ?? env.UPLOAD_DIR);
  const resolvedPath = path.resolve(filePath);
  assertWithinRoot(resolvedPath, allowedRoot);

  const fileStat = await stat(resolvedPath);
  if (!fileStat.isFile()) throw new Error('Upload path is not a regular file');

  const maxBytes = options.maxBytes ?? DEFAULT_MAX_MEDIA_SIZE_BYTES;
  const allowedMimeTypes = options.allowedMimeTypes ?? DEFAULT_ALLOWED_MEDIA_MIME_TYPES;
  const declaredMimeType = validateMediaMetadata(
    {
      size: fileStat.size,
      mimeType: options.mimeType ?? inferMimeType(resolvedPath),
      fileName: resolvedPath,
    },
    { maxBytes, allowedMimeTypes },
  );

  const handle = await open(resolvedPath, 'r');
  const sample = Buffer.alloc(Math.min(fileStat.size, 4096));
  await handle.read(sample, 0, sample.length, 0);
  await handle.close();
  const detectedMimeType = detectMimeType(sample);
  if (!detectedMimeType || detectedMimeType !== declaredMimeType) {
    throw new Error(
      `Upload MIME mismatch: declared ${declaredMimeType}, detected ${detectedMimeType ?? 'unknown'}`,
    );
  }

  const input = new InputFile(resolvedPath);
  const sendOptions = options.caption ? { caption: options.caption } : undefined;
  switch (kind) {
    case 'photo':
      if (!detectedMimeType.startsWith('image/')) {
        throw new Error('Only image files can be uploaded as photos');
      }
      return api.sendPhoto(chatId, input, sendOptions);
    case 'video':
      if (!detectedMimeType.startsWith('video/')) {
        throw new Error('Only video files can be uploaded as videos');
      }
      return api.sendVideo(chatId, input, sendOptions);
    default:
      return api.sendDocument(chatId, input, sendOptions);
  }
}
