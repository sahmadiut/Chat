import { describe, expect, it } from 'vitest';
import {
  detectMimeType,
  isMimeTypeAllowed,
  sanitizeFileName,
  validateMediaMetadata,
} from './validation.js';

describe('media validation', () => {
  it.each([
    [Buffer.from([0xff, 0xd8, 0xff, 0xe0]), 'image/jpeg'],
    [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), 'image/png'],
    [Buffer.from('GIF89a', 'ascii'), 'image/gif'],
    [Buffer.from('%PDF-1.7', 'ascii'), 'application/pdf'],
    [
      Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32]),
      'video/mp4',
    ],
  ])('detects magic bytes for %s', (bytes, expected) => {
    expect(detectMimeType(bytes)).toBe(expected);
  });

  it('enforces size and MIME allowlists', () => {
    expect(
      validateMediaMetadata(
        { size: 10, mimeType: 'image/jpeg' },
        { maxBytes: 20, allowedMimeTypes: ['image/*'] },
      ),
    ).toBe('image/jpeg');
    expect(() =>
      validateMediaMetadata({ size: 21, mimeType: 'image/jpeg' }, { maxBytes: 20 }),
    ).toThrow(/exceeds/);
    expect(() => validateMediaMetadata({ size: 10, mimeType: 'application/x-msdownload' })).toThrow(
      /not allowed/,
    );
    expect(isMimeTypeAllowed('image/webp', ['image/*'])).toBe(true);
  });

  it('removes traversal and unsafe filename characters', () => {
    expect(sanitizeFileName('../../bad<name>.pdf')).toBe('bad-name-.pdf');
    expect(sanitizeFileName('..')).toBe('telegram-file');
  });
});
