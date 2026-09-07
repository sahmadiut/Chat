/**
 * Structured callback data helpers.
 *
 * Telegram limits callback data to 64 UTF-8 bytes. Keeping construction and
 * parsing in one place prevents ad-hoc formats and makes routing predictable.
 */

const CALLBACK_DATA_LIMIT = 64;
const CALLBACK_SEGMENT_PATTERN = /^[a-zA-Z0-9_-]+$/;

export interface ParsedCallbackData {
  module: string;
  action: string;
  params: string[];
  raw: string;
}

function assertRouteSegment(value: string, name: string): void {
  if (!CALLBACK_SEGMENT_PATTERN.test(value)) {
    throw new Error(`${name} must contain only letters, numbers, underscores, or hyphens`);
  }
}

/** Build callback data in `module:action:param` format. */
export function buildCallbackData(module: string, action: string, ...params: string[]): string {
  assertRouteSegment(module, 'Callback module');
  assertRouteSegment(action, 'Callback action');

  const data = [module, action, ...params.map((param) => encodeURIComponent(param))].join(':');
  if (Buffer.byteLength(data, 'utf8') > CALLBACK_DATA_LIMIT) {
    throw new Error(`Callback data exceeds Telegram's ${CALLBACK_DATA_LIMIT}-byte limit`);
  }

  return data;
}

/** Parse structured callback data, returning null for malformed values. */
export function parseCallbackData(data: string): ParsedCallbackData | null {
  if (Buffer.byteLength(data, 'utf8') > CALLBACK_DATA_LIMIT) return null;

  const [module, action, ...encodedParams] = data.split(':');
  if (!module || !action) return null;
  if (!CALLBACK_SEGMENT_PATTERN.test(module) || !CALLBACK_SEGMENT_PATTERN.test(action)) return null;

  try {
    return {
      module,
      action,
      params: encodedParams.map((param) => decodeURIComponent(param)),
      raw: data,
    };
  } catch {
    return null;
  }
}
