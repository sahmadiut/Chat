/** Media metadata, MIME, and filename validation helpers. */

import path from 'node:path';

export const DEFAULT_MAX_MEDIA_SIZE_BYTES = 20 * 1024 * 1024;
export const DEFAULT_ALLOWED_MEDIA_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'application/pdf',
  'application/zip',
  'text/plain',
] as const;

export interface MediaValidationOptions {
  maxBytes?: number;
  allowedMimeTypes?: readonly string[];
}

export interface MediaMetadata {
  size?: number;
  mimeType?: string;
  fileName?: string;
}

const EXTENSION_MIME_TYPES: Readonly<Record<string, string>> = {
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.txt': 'text/plain',
  '.webp': 'image/webp',
  '.zip': 'application/zip',
};

export function normalizeMimeType(mimeType: string): string {
  return mimeType.split(';', 1)[0]?.trim().toLowerCase() ?? '';
}

export function isMimeTypeAllowed(mimeType: string, allowedMimeTypes: readonly string[]): boolean {
  const normalized = normalizeMimeType(mimeType);
  return allowedMimeTypes.some((allowed) => {
    const candidate = normalizeMimeType(allowed);
    return candidate.endsWith('/*')
      ? normalized.startsWith(candidate.slice(0, -1))
      : normalized === candidate;
  });
}

export function inferMimeType(fileName: string): string | undefined {
  return EXTENSION_MIME_TYPES[path.extname(fileName).toLowerCase()];
}

function hasBytes(bytes: Uint8Array, signature: readonly number[], offset = 0): boolean {
  return signature.every((value, index) => bytes[offset + index] === value);
}

function hasAscii(bytes: Uint8Array, signature: string, offset = 0): boolean {
  return (
    Buffer.from(bytes.subarray(offset, offset + signature.length)).toString('ascii') === signature
  );
}

function looksLikeText(bytes: Uint8Array): boolean {
  if (bytes.length === 0) return false;
  const characters = [...Buffer.from(bytes).toString('utf8')];
  return characters.every((character) => {
    const code = character.charCodeAt(0);
    return character !== '�' && (code >= 32 || ['\n', '\r', '\t'].includes(character));
  });
}

const MIME_SIGNATURES: ReadonlyArray<{
  mimeType: string;
  matches: (bytes: Uint8Array) => boolean;
}> = [
  { mimeType: 'image/jpeg', matches: (bytes) => hasBytes(bytes, [0xff, 0xd8, 0xff]) },
  {
    mimeType: 'image/png',
    matches: (bytes) => hasBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  {
    mimeType: 'image/webp',
    matches: (bytes) => hasAscii(bytes, 'RIFF') && hasAscii(bytes, 'WEBP', 8),
  },
  {
    mimeType: 'image/gif',
    matches: (bytes) => hasAscii(bytes, 'GIF87a') || hasAscii(bytes, 'GIF89a'),
  },
  { mimeType: 'application/pdf', matches: (bytes) => hasAscii(bytes, '%PDF-') },
  {
    mimeType: 'application/zip',
    matches: (bytes) =>
      hasBytes(bytes, [0x50, 0x4b, 0x03, 0x04]) ||
      hasBytes(bytes, [0x50, 0x4b, 0x05, 0x06]) ||
      hasBytes(bytes, [0x50, 0x4b, 0x07, 0x08]),
  },
  { mimeType: 'video/mp4', matches: (bytes) => hasAscii(bytes, 'ftyp', 4) },
  { mimeType: 'text/plain', matches: looksLikeText },
];

/** Detect supported file types from magic bytes rather than trusting metadata alone. */
export function detectMimeType(bytes: Uint8Array): string | undefined {
  return MIME_SIGNATURES.find((signature) => signature.matches(bytes))?.mimeType;
}

/** Validate declared metadata before allocating storage or downloading bytes. */
export function validateMediaMetadata(
  metadata: MediaMetadata,
  options: MediaValidationOptions = {},
): string {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_MEDIA_SIZE_BYTES;
  if (metadata.size !== undefined && (!Number.isFinite(metadata.size) || metadata.size < 0)) {
    throw new Error('Media file size is invalid');
  }
  if (metadata.size !== undefined && metadata.size > maxBytes) {
    throw new Error(`Media file exceeds the ${Math.floor(maxBytes / 1024 / 1024)} MB limit`);
  }

  const mimeType = metadata.mimeType
    ? normalizeMimeType(metadata.mimeType)
    : metadata.fileName
      ? inferMimeType(metadata.fileName)
      : undefined;
  if (!mimeType) throw new Error('Media MIME type could not be determined');

  const allowed = options.allowedMimeTypes ?? DEFAULT_ALLOWED_MEDIA_MIME_TYPES;
  if (!isMimeTypeAllowed(mimeType, allowed)) {
    throw new Error(`Media MIME type is not allowed: ${mimeType}`);
  }

  return mimeType;
}

/** Strip traversal and control characters while preserving a useful extension. */
export function sanitizeFileName(fileName: string): string {
  const unsafeCharacters = '<>:"/\\|?*';
  const base = [...path.basename(fileName)]
    .map((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127 || unsafeCharacters.includes(character) ? '-' : character;
    })
    .join('')
    .trim();
  const normalized = base.replace(/^\.+/, '').slice(0, 120);
  return normalized || 'telegram-file';
}
