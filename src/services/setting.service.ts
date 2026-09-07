/**
 * Setting Service
 *
 * Provides cache-first access to dynamic bot-wide settings stored in PostgreSQL.
 * Keys are cached in Redis with a 5-minute TTL and invalidated on update.
 *
 * Supported built-in keys:
 * - 'maintenance_mode': 'true' | 'false' (default: 'false')
 * Legacy custom message keys remain readable for backward compatibility,
 * but the live interface uses locale files exclusively.
 */

import { eq } from 'drizzle-orm';
import { cacheDel, cacheGet, cacheSet } from '#root/cache/utils.js';
import { db } from '#root/database/index.js';
import { type BotSetting, botSettings } from '#root/database/schema/index.js';
import { createLogger } from '#root/utils/logger.js';

const log = createLogger('SettingService');

const SETTING_CACHE_PREFIX = 'bot:settings:';
const SETTING_CACHE_TTL = 300; // 5 minutes

export const SettingService = {
  /**
   * Get a setting by its key.
   * Checks Redis cache first before querying PostgreSQL.
   */
  async get(key: string): Promise<string | null> {
    const cacheKey = `${SETTING_CACHE_PREFIX}${key}`;

    const cached = await cacheGet<string>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const row = await db.query.botSettings.findFirst({
      where: eq(botSettings.key, key),
    });

    if (row) {
      await cacheSet(cacheKey, row.value, SETTING_CACHE_TTL);
      return row.value;
    }

    return null;
  },

  /**
   * Set a setting value (upsert) and invalidate cache.
   */
  async set(key: string, value: string, description?: string): Promise<BotSetting> {
    const [row] = await db
      .insert(botSettings)
      .values({
        key,
        value,
        description: description ?? null,
      })
      .onConflictDoUpdate({
        target: botSettings.key,
        set: {
          value,
          ...(description ? { description } : {}),
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!row) {
      throw new Error(`Failed to set setting for key=${key}`);
    }

    await cacheDel(`${SETTING_CACHE_PREFIX}${key}`);
    log.info({ key, value }, 'Bot setting updated');
    return row;
  },

  /**
   * Check if Maintenance Mode is enabled.
   */
  async isMaintenanceMode(): Promise<boolean> {
    const val = await this.get('maintenance_mode');
    return val === 'true';
  },

  /**
   * Set Maintenance Mode state.
   */
  async setMaintenanceMode(enabled: boolean): Promise<void> {
    await this.set(
      'maintenance_mode',
      enabled ? 'true' : 'false',
      'Toggle bot maintenance mode (blocks non-admins)',
    );
  },

  /**
   * Check if Force Channel Join is enabled.
   */
  async isForceChannelJoin(): Promise<boolean> {
    const val = await this.get('force_channel_join');
    return val === 'true';
  },

  /**
   * Set Force Channel Join state.
   */
  async setForceChannelJoin(enabled: boolean): Promise<void> {
    await this.set(
      'force_channel_join',
      enabled ? 'true' : 'false',
      'Toggle force channel join requirement',
    );
  },

  /**
   * Get default bot language ('fa' | 'en') or null if not set in DB.
   */
  async getDefaultLanguage(): Promise<string | null> {
    return this.get('default_language');
  },

  /**
   * Set default bot language ('fa' | 'en').
   */
  async setDefaultLanguage(lang: 'fa' | 'en'): Promise<void> {
    await this.set('default_language', lang, 'Bot-wide default language');
  },

  /**
   * Get custom start message or null if default.
   */
  async getCustomStartMessage(): Promise<string | null> {
    return this.get('custom_start_message');
  },

  /**
   * Set or clear custom start message.
   */
  async setCustomStartMessage(text: string | null): Promise<void> {
    if (!text || text.trim() === '') {
      await this.delete('custom_start_message');
    } else {
      await this.set('custom_start_message', text, 'Custom /start welcome message');
    }
  },

  /**
   * Get custom help message or null if default.
   */
  async getCustomHelpMessage(): Promise<string | null> {
    return this.get('custom_help_message');
  },

  /**
   * Set or clear custom help message.
   */
  async setCustomHelpMessage(text: string | null): Promise<void> {
    if (!text || text.trim() === '') {
      await this.delete('custom_help_message');
    } else {
      await this.set('custom_help_message', text, 'Custom /help message');
    }
  },

  /**
   * Delete a setting key from database and cache.
   */
  async delete(key: string): Promise<void> {
    await db.delete(botSettings).where(eq(botSettings.key, key));
    await cacheDel(`${SETTING_CACHE_PREFIX}${key}`);
    log.info({ key }, 'Bot setting deleted');
  },

  /**
   * Get all settings.
   */
  async getAll(): Promise<BotSetting[]> {
    return db.select().from(botSettings);
  },
};
