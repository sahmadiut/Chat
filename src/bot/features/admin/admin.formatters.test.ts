/**
 * Admin Formatters — Unit Tests
 */

import { describe, expect, it } from 'vitest';
import {
  escapeHtml,
  formatAdminDashboard,
  formatAdminStats,
  formatAdminUserCard,
  formatBroadcastReport,
  formatDate,
  formatLogsView,
  formatSettingsMenu,
  formatStatisticsView,
  formatUserProfile,
} from './admin.formatters.js';

describe('Admin Formatters', () => {
  describe('escapeHtml', () => {
    it('escapes HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss") & test</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;) &amp; test&lt;/script&gt;',
      );
    });

    it('handles null and undefined', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });
  });

  describe('formatDate', () => {
    it('formats valid date objects', () => {
      const date = new Date('2026-08-27T12:30:00Z');
      expect(formatDate(date)).toContain('2026-08-27');
    });

    it('handles null date', () => {
      expect(formatDate(null)).toBe('N/A');
    });
  });

  describe('formatAdminStats', () => {
    it('formats stats with localized translation helper', () => {
      const output = formatAdminStats({
        userStats: {
          total: 100,
          active: 80,
          blocked: 15,
          banned: 5,
          premium: 10,
          bots: 0,
          newToday: 12,
          newThisWeek: 35,
        },
        t: (key, args) => `[${key}: ${JSON.stringify(args ?? {})}]`,
      });

      expect(output).toContain('admin-stats-total');
      expect(output).toContain('100');
      expect(output).toContain('admin-stats-active-today');
      expect(output).toContain('12');
      expect(output).toContain('admin-stats-new-7days');
      expect(output).toContain('35');
      expect(output).toContain('admin-stats-banned');
      expect(output).toContain('5');
    });
  });

  describe('formatAdminUserCard', () => {
    it('formats user card with localized translation helper', () => {
      const user = {
        telegramId: 987654321,
        firstName: 'Alice',
        lastName: 'Smith',
        username: 'alice_s',
        languageCode: 'en',
        isBot: false,
        isPremium: true,
        addedToAttachmentMenu: false,
        isBlocked: false,
        isBanned: false,
        banReason: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-08-27T00:00:00Z'),
      };

      const output = formatAdminUserCard({
        user,
        t: (key, args) => `[${key}: ${JSON.stringify(args ?? {})}]`,
      });

      expect(output).toContain('Alice Smith');
      expect(output).toContain('987654321');
      expect(output).toContain('@alice_s');
      expect(output).toContain('user-profile-status-active');
    });
  });

  describe('formatBroadcastReport', () => {
    it('formats broadcast report with sent and failed counts', () => {
      const output = formatBroadcastReport({
        sent: 45,
        failed: 2,
        t: (key, args) => `[${key}: ${JSON.stringify(args ?? {})}]`,
      });

      expect(output).toContain('admin-broadcast-step4-report');
      expect(output).toContain('45');
      expect(output).toContain('2');
    });
  });

  describe('formatAdminDashboard', () => {
    it('renders dashboard with stats and active system badge', () => {
      const output = formatAdminDashboard({
        isMaintenance: false,
        totalUsers: 1500,
        newToday: 25,
        totalMessagesToday: 4200,
      });

      expect(output).toContain('👑 <b>Admin Control Panel</b>');
      expect(output).toContain('🟢 <b>System active</b>');
      expect(output).toContain('1500');
      expect(output).toContain('+25');
      expect(output).toContain('4200');
    });

    it('renders maintenance badge when maintenance is on', () => {
      const output = formatAdminDashboard({
        isMaintenance: true,
        totalUsers: 10,
        newToday: 1,
        totalMessagesToday: 5,
      });

      expect(output).toContain('🔴 <b>Maintenance on</b>');
    });
  });

  describe('formatUserProfile', () => {
    it('renders user details correctly', () => {
      const user = {
        telegramId: 987654321,
        firstName: 'Alice',
        lastName: 'Smith',
        username: 'alice_s',
        languageCode: 'en',
        isBot: false,
        isPremium: true,
        addedToAttachmentMenu: false,
        isBlocked: false,
        isBanned: false,
        banReason: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-08-27T00:00:00Z'),
      };

      const output = formatUserProfile(user);
      expect(output).toContain('987654321');
      expect(output).toContain('Alice Smith');
      expect(output).toContain('@alice_s');
      expect(output).toContain('⭐ <b>Premium</b>');
    });

    it('displays ban reason when user is banned', () => {
      const user = {
        telegramId: 111,
        firstName: 'Bad',
        lastName: 'Actor',
        username: null,
        languageCode: 'en',
        isBot: false,
        isPremium: false,
        addedToAttachmentMenu: false,
        isBlocked: false,
        isBanned: true,
        banReason: 'Spamming channels',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const output = formatUserProfile(user);
      expect(output).toContain('🚫 <b>Banned</b>');
      expect(output).toContain('Spamming channels');
    });
  });

  describe('formatStatisticsView', () => {
    it('formats user demographic and message counts', () => {
      const stats = {
        userStats: {
          total: 100,
          active: 80,
          blocked: 15,
          banned: 5,
          premium: 10,
          bots: 0,
          newToday: 5,
          newThisWeek: 20,
        },
        todayMessages: {
          incoming: 50,
          outgoing: 50,
          total: 100,
        },
        dailyActivity: [{ date: '2026-08-27', incoming: 50, outgoing: 50 }],
      };

      const output = formatStatisticsView(stats);
      expect(output).toContain('📊 <b>Bot Statistics & Analytics</b>');
      expect(output).toContain('Total Users: <code>100</code>');
      expect(output).toContain('Active Users: <code>80</code> (80.0%)');
      expect(output).toContain('08-27');
    });
  });

  describe('formatSettingsMenu', () => {
    it('shows maintenance status without global language-breaking message overrides', () => {
      const output = formatSettingsMenu({
        isMaintenance: false,
        hasCustomStart: true,
        hasCustomHelp: false,
      });

      expect(output).toContain('🟢 <b>DISABLED</b>');
      expect(output).not.toContain('/start');
      expect(output).not.toContain('/help');
    });
  });

  describe('formatLogsView', () => {
    it('renders recent errors and admin actions', () => {
      const output = formatLogsView({
        recentErrors: [
          {
            timestamp: '2026-08-27T12:00:00Z',
            message: 'Telegram 403 Forbidden',
            name: 'BotError',
          },
        ],
        recentAdminActions: [
          {
            action: 'ban_user',
            targetUserId: 123,
            details: 'Banned for spam',
            createdAt: new Date('2026-08-27T12:05:00Z'),
          },
        ],
      });

      expect(output).toContain('Telegram 403 Forbidden');
      expect(output).toContain('ban_user');
      expect(output).toContain('Banned for spam');
    });
  });
});
