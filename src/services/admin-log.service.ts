/**
 * Admin Log Service
 *
 * Records and retrieves administrative action audit logs and tracks errors.
 */

import { desc, eq } from 'drizzle-orm';
import { db } from '#root/database/index.js';
import { type AdminLog, type NewAdminLog, adminLogs } from '#root/database/schema/index.js';
import { createLogger } from '#root/utils/logger.js';

const log = createLogger('AdminLogService');

export const AdminLogService = {
  /**
   * Log an administrative action.
   */
  async logAction(data: {
    adminTelegramId: number;
    action: string;
    targetUserId?: number;
    details?: string;
    metadata?: Record<string, unknown>;
  }): Promise<AdminLog | null> {
    try {
      const [entry] = await db
        .insert(adminLogs)
        .values({
          adminTelegramId: data.adminTelegramId,
          action: data.action,
          targetUserId: data.targetUserId ?? null,
          details: data.details ?? null,
          metadata: data.metadata ?? null,
        })
        .returning();

      return entry ?? null;
    } catch (err) {
      log.error({ err, data }, 'Failed to record admin log');
      return null;
    }
  },

  /**
   * Get the most recent admin action logs.
   */
  async getRecentLogs(limit = 20): Promise<AdminLog[]> {
    return db.select().from(adminLogs).orderBy(desc(adminLogs.createdAt)).limit(limit);
  },

  /**
   * Get admin actions performed on a specific target user.
   */
  async getLogsForUser(targetUserId: number, limit = 20): Promise<AdminLog[]> {
    return db
      .select()
      .from(adminLogs)
      .where(eq(adminLogs.targetUserId, targetUserId))
      .orderBy(desc(adminLogs.createdAt))
      .limit(limit);
  },
};
