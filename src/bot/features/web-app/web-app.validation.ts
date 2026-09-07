/** Telegram Mini App init-data signature and freshness validation. */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

const telegramWebAppUserSchema = z.object({
  id: z.number().int().positive(),
  is_bot: z.boolean().optional(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional(),
  is_premium: z.boolean().optional(),
  allows_write_to_pm: z.boolean().optional(),
  photo_url: z.string().url().optional(),
});

export interface WebAppInitData {
  authDate: Date;
  queryId?: string;
  user?: z.infer<typeof telegramWebAppUserSchema>;
  raw: Readonly<Record<string, string>>;
}

export interface ValidateWebAppInitDataOptions {
  maxAgeSeconds?: number;
  now?: Date;
}

/**
 * Validate data according to Telegram's HMAC-SHA256 Mini App algorithm and
 * reject stale payloads to reduce replay exposure.
 */
export function validateWebAppInitData(
  initData: string,
  botToken: string,
  options: ValidateWebAppInitDataOptions = {},
): WebAppInitData {
  const params = new URLSearchParams(initData);
  const receivedHash = params.get('hash');
  if (!receivedHash || !/^[a-f0-9]{64}$/i.test(receivedHash)) {
    throw new Error('Telegram Web App hash is missing or malformed');
  }
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculatedHash = createHmac('sha256', secretKey).update(dataCheckString).digest();
  const receivedHashBuffer = Buffer.from(receivedHash, 'hex');
  if (
    calculatedHash.length !== receivedHashBuffer.length ||
    !timingSafeEqual(calculatedHash, receivedHashBuffer)
  ) {
    throw new Error('Telegram Web App signature is invalid');
  }

  const authDateValue = params.get('auth_date');
  if (!authDateValue || !/^\d+$/.test(authDateValue)) {
    throw new Error('Telegram Web App auth_date is missing or malformed');
  }
  const authDateSeconds = Number(authDateValue);
  const now = options.now ?? new Date();
  const ageSeconds = Math.floor(now.getTime() / 1000) - authDateSeconds;
  const maxAgeSeconds = options.maxAgeSeconds ?? 300;
  if (ageSeconds < -30 || ageSeconds > maxAgeSeconds) {
    throw new Error('Telegram Web App init data has expired');
  }

  const userValue = params.get('user');
  let user: WebAppInitData['user'];
  if (userValue) {
    try {
      user = telegramWebAppUserSchema.parse(JSON.parse(userValue));
    } catch {
      throw new Error('Telegram Web App user data is malformed');
    }
  }

  return {
    authDate: new Date(authDateSeconds * 1000),
    queryId: params.get('query_id') ?? undefined,
    user,
    raw: Object.freeze(Object.fromEntries(params.entries())),
  };
}
