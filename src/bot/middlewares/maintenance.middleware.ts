/**
 * Maintenance Mode Middleware
 *
 * Checks if the bot is currently in maintenance mode.
 * When enabled, non-admin users receive a maintenance notice and their updates are halted.
 * Admins bypass maintenance mode seamlessly.
 */

import type { Middleware } from 'grammy';
import { SettingService } from '#root/services/setting.service.js';
import { createLogger } from '#root/utils/logger.js';
import type { BotContext } from '../context.js';
import { isAdminUser } from '../filters/admin.filter.js';

const log = createLogger('MaintenanceMiddleware');

export function createMaintenanceMiddleware(): Middleware<BotContext> {
  return async (ctx, next) => {
    const userId = ctx.from?.id;

    // Admins always bypass maintenance mode
    if (userId && isAdminUser(userId)) {
      return next();
    }

    // Check maintenance mode state
    const isMaintenance = await SettingService.isMaintenanceMode();
    if (isMaintenance) {
      log.debug({ userId }, 'Update blocked due to active maintenance mode');

      if (ctx.callbackQuery) {
        await ctx.answerCallbackQuery({
          text: ctx.t('maintenance-mode-alert'),
          show_alert: true,
        });
        return;
      }

      if (ctx.message) {
        await ctx.reply(ctx.t('maintenance-mode-alert'), { parse_mode: 'HTML' });
        return;
      }

      return;
    }

    return next();
  };
}
