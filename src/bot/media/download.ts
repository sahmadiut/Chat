/** Download Telegram files to validated local storage. */

import { randomUUID } from 'node:crypto';
import { mkdir, open, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import type { Api } from 'grammy';
import { env } from '#root/config/env.js';
import {
  DEFAULT_ALLOWED_MEDIA_MIME_TYPES,
  DEFAULT_MAX_MEDIA_SIZE_BYTES,
  type MediaValidationOptions,
  detectMimeType,
  sanitizeFileName,
  validateMediaMetadata,
} from './validation.js';

export interface DownloadTelegramFileOptions extends MediaValidationOptions {
  destinationDir?: string;
  expectedSize?: number;
  fileName?: string;
  mimeType?: string;
  fetcher?: typeof fetch;
}

export interface DownloadedTelegramFile {
  fileId: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  size: number;
}

const MIME_EXTENSIONS: Readonly<Record<string, string>> = {
  'application/pdf': '.pdf',
  'application/zip': '.zip',
  'image/gif': '.gif',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'text/plain': '.txt',
  'video/mp4': '.mp4',
};

async function streamToFile(
  response: Response,
  temporaryPath: string,
  maxBytes: number,
): Promise<number> {
  if (!response.body) throw new Error('Telegram file download returned no body');

  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error(`Media file exceeds the ${Math.floor(maxBytes / 1024 / 1024)} MB limit`);
  }

  let size = 0;
  const handle = await open(temporaryPath, 'wx');
  try {
    const reader = response.body.getReader();
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error(`Media file exceeds the ${Math.floor(maxBytes / 1024 / 1024)} MB limit`);
      }
      await handle.write(chunk.value);
    }
    await handle.close();
    return size;
  } catch (error) {
    await handle.close().catch(() => undefined);
    throw error;
  }
}

async function verifyFileContents(
  temporaryPath: string,
  size: number,
  declaredMimeType: string,
  options: Pick<DownloadTelegramFileOptions, 'maxBytes' | 'allowedMimeTypes'>,
): Promise<string> {
  const sampleHandle = await open(temporaryPath, 'r');
  const sample = Buffer.alloc(Math.min(size, 4096));
  await sampleHandle.read(sample, 0, sample.length, 0);
  await sampleHandle.close();

  const detectedMimeType = detectMimeType(sample);
  if (!detectedMimeType)
    throw new Error('Media MIME type could not be verified from file contents');

  const maxBytes = options.maxBytes ?? DEFAULT_MAX_MEDIA_SIZE_BYTES;
  const allowedMimeTypes = options.allowedMimeTypes ?? DEFAULT_ALLOWED_MEDIA_MIME_TYPES;
  validateMediaMetadata({ size, mimeType: detectedMimeType }, { maxBytes, allowedMimeTypes });

  if (detectedMimeType !== declaredMimeType) {
    throw new Error(
      `Media MIME mismatch: declared ${declaredMimeType}, detected ${detectedMimeType}`,
    );
  }
  return detectedMimeType;
}

/**
 * Download a Telegram file with streaming size enforcement and magic-byte MIME
 * verification. Partial files are removed whenever validation or I/O fails.
 */
export async function downloadTelegramFile(
  api: Api,
  fileId: string,
  options: DownloadTelegramFileOptions = {},
): Promise<DownloadedTelegramFile> {
  const telegramFile = await api.getFile(fileId);
  if (!telegramFile.file_path) throw new Error('Telegram did not return a downloadable file path');

  const remoteName = path.basename(telegramFile.file_path);
  const requestedName = sanitizeFileName(options.fileName ?? remoteName);
  const declaredMimeType = validateMediaMetadata(
    {
      size: options.expectedSize ?? telegramFile.file_size,
      mimeType: options.mimeType,
      fileName: requestedName,
    },
    options,
  );

  const destinationDir = path.resolve(options.destinationDir ?? env.DOWNLOAD_DIR);
  const id = randomUUID();
  const extension = path.extname(requestedName) || MIME_EXTENSIONS[declaredMimeType] || '';
  const baseName = sanitizeFileName(path.basename(requestedName, path.extname(requestedName)));
  const fileName = `${baseName}-${id}${extension}`;
  const finalPath = path.join(destinationDir, fileName);
  const temporaryPath = `${finalPath}.part`;

  await mkdir(destinationDir, { recursive: true });

  try {
    const url = `https://api.telegram.org/file/bot${env.BOT_TOKEN}/${telegramFile.file_path}`;
    const response = await (options.fetcher ?? fetch)(url);
    if (!response.ok) throw new Error(`Telegram file download failed with HTTP ${response.status}`);

    const size = await streamToFile(
      response,
      temporaryPath,
      options.maxBytes ?? DEFAULT_MAX_MEDIA_SIZE_BYTES,
    );
    const mimeType = await verifyFileContents(temporaryPath, size, declaredMimeType, options);

    await rename(temporaryPath, finalPath);
    return { fileId, filePath: finalPath, fileName, mimeType, size };
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
}
