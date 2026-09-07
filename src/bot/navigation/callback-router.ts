/** Callback query router for structured `module:action:param` data. */

import type { Middleware } from 'grammy';
import type { BotContext } from '../context.js';
import { type ParsedCallbackData, parseCallbackData } from './callback-data.js';

export type CallbackRouteHandler = (
  ctx: BotContext,
  callback: ParsedCallbackData,
) => void | Promise<void>;

/**
 * Dispatches callback queries by module and action while leaving unmatched
 * updates available to downstream composers.
 */
export class CallbackRouter {
  readonly #routes = new Map<string, CallbackRouteHandler>();

  on(module: string, action: string, handler: CallbackRouteHandler): this {
    const key = `${module}:${action}`;
    if (this.#routes.has(key)) {
      throw new Error(`Callback route already registered: ${key}`);
    }

    this.#routes.set(key, handler);
    return this;
  }

  middleware(): Middleware<BotContext> {
    return async (ctx, next) => {
      const data = ctx.callbackQuery?.data;
      if (!data) {
        await next();
        return;
      }

      const callback = parseCallbackData(data);
      if (!callback) {
        await next();
        return;
      }

      const handler = this.#routes.get(`${callback.module}:${callback.action}`);
      if (!handler) {
        await next();
        return;
      }

      await handler(ctx, callback);
    };
  }
}
