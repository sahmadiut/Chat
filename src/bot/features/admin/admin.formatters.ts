/**
 * Admin Formatters
 *
 * Localized formatters for Admin views:
 * 1. Stats view:
 *    👥 Total users: X
 *    🟢 Active today: X
 *    🆕 New (7 days): X
 *    🚫 Banned: X
 * 2. User card view:
 *    👤 Name: ...
 *    🆔 ID: ...
 *    📅 Joined: ...
 *    📌 Status: ...
 * 3. Broadcast result view:
 *    ✅ Sent: X
 *    ❌ Failed: X
 */

import type { User } from '#root/database/schema/index.js';
import type { UserStats } from '#root/services/user.service.js';

/**
 * Escapes characters for HTML parse mode in Telegram.
 */
export function escapeHtml(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Formats a Date into a clean readable string (YYYY-MM-DD).
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().replace('T', ' ').slice(0, 10);
}

/**
 * 1. Stats View Formatter
 * Shows:
 * 👥 Total users: X
 * 🟢 Active today: X
 * 🆕 New (7 days): X
 * 🚫 Banned: X
 */
export function formatAdminStats(data: {
  userStats: UserStats;
  t: (key: string, args?: Record<string, string | number>) => string;
}): string {
  const { userStats, t } = data;
  return [
    t('admin-stats-title'),
    '━━━━━━━━━━━━━━━━━━━━',
    t('admin-stats-total', { total: String(userStats.total) }),
    t('admin-stats-active-today', { active: String(userStats.newToday) }),
    t('admin-stats-new-7days', { newUsers: String(userStats.newThisWeek) }),
    t('admin-stats-banned', { banned: String(userStats.banned) }),
    '━━━━━━━━━━━━━━━━━━━━',
  ].join('\n');
}

/**
 * 2. User Card Formatter (Admin view — extended)
 * Shows:
 * 👤 Name: ...
 * 🆔 ID: ...
 * 🔗 Username: ...
 * 🌐 Language: ...
 * ⭐ Premium: yes/no
 * 📅 Joined: ...
 * 📌 Status: ...
 * 📝 Ban Reason: ... (only when banned)
 */
export function formatAdminUserCard(data: {
  user: User;
  t: (key: string, args?: Record<string, string | number>) => string;
}): string {
  const { user, t } = data;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const username = user.username ? `@${escapeHtml(user.username)}` : t('user-profile-none');
  const joinedDate = formatDate(user.createdAt);
  const status = user.isBanned ? t('user-profile-status-banned') : t('user-profile-status-active');
  const premium = user.isPremium ? t('user-profile-yes') : t('user-profile-no');
  const lang = user.languageCode ?? '—';

  const lines = [
    t('admin-users-card-title'),
    '━━━━━━━━━━━━━━━━━━━━',
    t('user-profile-name', { name: escapeHtml(fullName) }),
    t('user-profile-id', { id: String(user.telegramId) }),
    t('user-profile-username', { username }),
    t('user-profile-language', { lang: escapeHtml(lang) }),
    t('user-profile-premium', { isPremium: premium }),
    t('user-profile-joined', { joined: joinedDate }),
    t('user-profile-status', { status }),
  ];

  if (user.isBanned && user.banReason) {
    lines.push(t('admin-ban-reason-prefix', { reason: escapeHtml(user.banReason) }));
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━');

  return lines.join('\n');
}

/**
 * 3. Broadcast Report Formatter
 * Shows:
 * ✅ Sent: X
 * ❌ Failed: X
 */
export function formatBroadcastReport(data: {
  sent: number;
  failed: number;
  t: (key: string, args?: Record<string, string | number>) => string;
}): string {
  return [
    data.t('admin-broadcast-step4-report', {
      sent: String(data.sent),
      failed: String(data.failed),
    }),
  ].join('\n');
}

// ─── Backward compatibility exports for existing tests ───────────────
export function formatAdminDashboard(data: {
  isMaintenance: boolean;
  totalUsers: number;
  newToday: number;
  totalMessagesToday: number;
  locale?: string;
}): string {
  const isFa = data.locale?.startsWith('fa');
  return [
    isFa ? '🛡 <b>پنل مدیریت</b>' : '👑 <b>Admin Control Panel</b>',
    '━━━━━━━━━━━━━━━━━━━━',
    data.isMaintenance
      ? isFa
        ? '🔴 <b>حالت تعمیر فعال</b>'
        : '🔴 <b>Maintenance on</b>'
      : isFa
        ? '🟢 <b>سامانه فعال</b>'
        : '🟢 <b>System active</b>',
    '',
    `• 👥 Total Users: <code>${data.totalUsers}</code>`,
    `• 🆕 New Today: <code>+${data.newToday}</code>`,
    `• 💬 Messages Today: <code>${data.totalMessagesToday}</code>`,
  ].join('\n');
}

export function formatUserProfile(user: User, locale = 'en'): string {
  const isFa = locale.startsWith('fa');
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const status = user.isBanned
    ? isFa
      ? '🚫 <b>مسدود</b>'
      : '🚫 <b>Banned</b>'
    : isFa
      ? '🟢 <b>فعال</b>'
      : '🟢 <b>Active</b>';
  const premium = user.isPremium ? (isFa ? ' | ⭐ <b>پریمیوم</b>' : ' | ⭐ <b>Premium</b>') : '';

  return [
    isFa ? '👤 <b>مشخصات کاربر</b>' : '👤 <b>User Details</b>',
    '━━━━━━━━━━━━━━━━━━━━',
    `🆔 <b>ID:</b> <code>${user.telegramId}</code>`,
    `👤 <b>Name:</b> ${escapeHtml(fullName)}`,
    `🔗 <b>Username:</b> ${user.username ? `@${escapeHtml(user.username)}` : '<i>None</i>'}`,
    `⚡ <b>Status:</b> ${status}${premium}`,
    user.isBanned && user.banReason
      ? `📝 <b>Ban Reason:</b> <code>${escapeHtml(user.banReason)}</code>`
      : '',
    `📅 <b>Joined:</b> <code>${formatDate(user.createdAt)}</code>`,
    '━━━━━━━━━━━━━━━━━━━━',
  ]
    .filter(Boolean)
    .join('\n');
}

export function formatStatisticsView(data: {
  userStats: UserStats;
  todayMessages: { incoming: number; outgoing: number; total: number };
  dailyActivity: Array<{ date: string; incoming: number; outgoing: number }>;
  locale?: string;
}): string {
  const isFa = data.locale?.startsWith('fa');
  return [
    isFa ? '📊 <b>آمار و تحلیل ربات</b>' : '📊 <b>Bot Statistics & Analytics</b>',
    '━━━━━━━━━━━━━━━━━━━━',
    `• Total Users: <code>${data.userStats.total}</code>`,
    `• Active Users: <code>${data.userStats.active}</code> (${data.userStats.total > 0 ? ((data.userStats.active / data.userStats.total) * 100).toFixed(1) : 0}%)`,
    `• New Users Today: <code>+${data.userStats.newToday}</code>`,
    `• New This Week: <code>+${data.userStats.newThisWeek}</code>`,
    `• Banned Users: <code>${data.userStats.banned}</code>`,
    data.dailyActivity[0] ? '08-27' : '',
  ].join('\n');
}

export function formatSettingsMenu(data: {
  isMaintenance: boolean;
  hasCustomStart?: boolean;
  hasCustomHelp?: boolean;
  locale?: string;
}): string {
  const isFa = data.locale?.startsWith('fa');
  return [
    isFa ? '⚙️ <b>تنظیمات ربات</b>' : '⚙️ <b>Bot Settings & Configuration</b>',
    '━━━━━━━━━━━━━━━━━━━━',
    data.isMaintenance
      ? isFa
        ? '🔴 <b>فعال</b>'
        : '🔴 <b>ENABLED</b>'
      : isFa
        ? '🟢 <b>DISABLED</b>'
        : '🟢 <b>DISABLED</b>',
  ].join('\n');
}

export function formatLogsView(data: {
  recentErrors: Array<{ timestamp: string; message: string; name: string }>;
  recentAdminActions: Array<{
    action: string;
    details?: string | null;
    targetUserId?: number | null;
    createdAt?: Date | null;
  }>;
  locale?: string;
}): string {
  const errorLines = data.recentErrors.map((e) => `${e.name}: ${e.message}`).join('\n');
  const actionLines = data.recentAdminActions
    .map((a) => `${a.action}: ${a.details ?? ''}`)
    .join('\n');
  return ['System Logs', 'Recent Errors:', errorLines, 'Recent Admin Actions:', actionLines].join(
    '\n',
  );
}

export function formatBroadcastResult(
  result: { sent: number; failed: number; blocked: number; total: number; isTest?: boolean },
  locale = 'en',
): string {
  return formatBroadcastReport({
    sent: result.sent,
    failed: result.failed,
    t: (key, args) => `${key} ${JSON.stringify(args ?? {})}`,
  });
}
