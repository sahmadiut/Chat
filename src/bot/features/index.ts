/**
 * Feature Registry
 *
 * Registers all feature composers onto a parent Composer.
 * Import this in `bot.ts` and `bot.use(features)` to wire everything up.
 *
 * To add a new feature:
 * 1. Create a directory under `features/` (e.g., `features/help/`)
 * 2. Export a `Composer<BotContext>` from the feature's command file
 * 3. Import and `.use()` it here
 */

import { Composer } from 'grammy';
import type { BotContext } from '../context.js';

import { adminFeature } from './admin/admin.command.js';
import { inlineFeature } from './inline/inline.feature.js';
import { mediaFeature } from './media/media.feature.js';
import { notificationsFeature } from './notifications/notifications.feature.js';
import { settingsFeature } from './settings/settings.command.js';
import { startFeature } from './start/start.command.js';
import { webAppFeature } from './web-app/web-app.feature.js';

/** Parent composer that aggregates all feature modules */
const features = new Composer<BotContext>();

// Register all features
features.use(startFeature);
features.use(settingsFeature);
features.use(adminFeature);
features.use(notificationsFeature);
features.use(webAppFeature);
features.use(inlineFeature);
features.use(mediaFeature);

export { features };
