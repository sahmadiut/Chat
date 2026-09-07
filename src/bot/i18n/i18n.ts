/**
 * i18n Setup
 *
 * Configures the grammY i18n plugin using Project Fluent (.ftl) files.
 * Translation files are loaded from the `locales/` directory.
 *
 * Uses a custom `localeNegotiator` to resolve the language in order:
 * 1. User's explicit choice saved in session (`ctx.session.custom.__language_code`)
 * 2. User's Telegram language (`ctx.from.language_code`) matched against supported locales
 * 3. Default bot language (`env.DEFAULT_LANGUAGE` or fallback 'fa')
 *
 * Usage in handlers:
 *   await ctx.t('welcome');                    // Uses user's detected locale
 *   await ctx.t('greeting', { name: 'John' }); // With interpolation
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { I18n } from '@grammyjs/i18n';
import { env } from '#root/config/env.js';
import { SettingService } from '#root/services/setting.service.js';
import { UserService } from '#root/services/user.service.js';
import type { BotConversationContext } from '../context.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const SUPPORTED_LOCALES = ['fa', 'en'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function resolveSupportedLocale(langCode?: string | null): SupportedLocale | undefined {
  if (!langCode) return undefined;
  const normalized = langCode.toLowerCase().trim();
  if (normalized.startsWith('fa') || normalized.startsWith('pes') || normalized.startsWith('prs')) {
    return 'fa';
  }
  if (normalized.startsWith('en')) {
    return 'en';
  }
  return undefined;
}

/**
 * i18n instance configured with:
 * - Default locale: from environment or 'fa'
 * - Locale files directory: `<project_root>/locales/`
 * - Custom locale negotiator for multi-key session strategy, DB user settings, and bot default settings
 * - Fluent bundle options for optimal formatting
 */
export const i18n = new I18n<BotConversationContext>({
  defaultLocale: env.DEFAULT_LANGUAGE ?? 'fa',
  directory: path.resolve(__dirname, '../../../locales'),
  localeNegotiator: async (ctx) => {
    // 1. Explicit user choice saved in session (fastest, in-memory/Redis)
    const session = await ctx.session;
    const sessionLocale = session?.custom?.__language_code;
    const resolvedSession = resolveSupportedLocale(sessionLocale);
    if (resolvedSession) return resolvedSession;

    // 2. User's saved language preference in Database
    const userId = ctx.from?.id;
    if (userId) {
      const user = await UserService.findByTelegramId(userId);
      const resolvedDb = resolveSupportedLocale(user?.languageCode);
      if (resolvedDb) {
        // Sync back to session so subsequent lookups are instant
        if (session?.custom) {
          session.custom.__language_code = resolvedDb;
        }
        return resolvedDb;
      }
    }

    // 3. Dynamic bot default language set by Admin in settings/DB
    const dynamicBotDefault = await SettingService.getDefaultLanguage();
    const resolvedDynamicDefault = resolveSupportedLocale(dynamicBotDefault);
    if (resolvedDynamicDefault) return resolvedDynamicDefault;

    // 4. Default bot language from environment (env.DEFAULT_LANGUAGE or fallback 'fa')
    return resolveSupportedLocale(env.DEFAULT_LANGUAGE) ?? 'fa';
  },
  globalTranslationContext: (ctx) => ({
    // Add global variables available in all translations
    botUsername: ctx.me.username,
  }),
});
