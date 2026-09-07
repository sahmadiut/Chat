/** Persistent lifecycle analytics for grammY conversations. */

import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '#root/database/index.js';
import { conversations } from '#root/database/schema/index.js';
import { createLogger } from '#root/utils/logger.js';

const log = createLogger('ConversationAnalyticsService');

type ConversationStatus = (typeof conversations.$inferSelect)['status'];
type FinishedConversationStatus = Extract<
  ConversationStatus,
  'cancelled' | 'completed' | 'stopped' | 'timed_out'
>;

export interface ConversationAnalyticsStats {
  started: number;
  completed: number;
  cancelled: number;
  timedOut: number;
  active: number;
  averageDurationMs: number | null;
}

export const ConversationAnalyticsService = {
  async start(userId: number, chatId: number, command: string): Promise<number> {
    const [row] = await db
      .insert(conversations)
      .values({ userId, chatId, command, status: 'active' })
      .returning({ id: conversations.id });
    if (!row) throw new Error(`Failed to start conversation analytics for ${command}`);

    log.debug({ conversationId: row.id, userId, chatId, command }, 'Conversation started');
    return row.id;
  },

  async complete(userId: number, chatId: number, command: string): Promise<void> {
    await this.finishActive(userId, chatId, command, 'completed');
  },

  async cancel(
    userId: number,
    chatId: number,
    command: string,
    status: Exclude<FinishedConversationStatus, 'completed'> = 'cancelled',
    reason?: string,
  ): Promise<void> {
    await this.finishActive(userId, chatId, command, status, reason);
  },

  async finishActive(
    userId: number,
    chatId: number,
    command: string,
    status: FinishedConversationStatus,
    reason?: string,
  ): Promise<void> {
    const active = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.userId, userId),
        eq(conversations.chatId, chatId),
        eq(conversations.command, command),
        eq(conversations.status, 'active'),
      ),
      orderBy: [desc(conversations.createdAt)],
    });
    if (!active) return;

    const completedAt = new Date();
    const durationMs = Math.max(0, completedAt.getTime() - (active.createdAt?.getTime() ?? 0));
    await db
      .update(conversations)
      .set({
        status,
        notes: reason ?? active.notes,
        completedAt,
        durationMs,
        updatedAt: completedAt,
      })
      .where(and(eq(conversations.id, active.id), eq(conversations.status, 'active')));

    log.debug({ conversationId: active.id, status, durationMs }, 'Conversation finished');
  },

  async getStats(command?: string): Promise<ConversationAnalyticsStats> {
    const where = command ? eq(conversations.command, command) : undefined;
    const [row] = await db
      .select({
        started: sql<number>`count(*)`.mapWith(Number),
        completed:
          sql<number>`count(*) filter (where ${conversations.status} = 'completed')`.mapWith(
            Number,
          ),
        cancelled:
          sql<number>`count(*) filter (where ${conversations.status} in ('cancelled', 'stopped'))`.mapWith(
            Number,
          ),
        timedOut:
          sql<number>`count(*) filter (where ${conversations.status} = 'timed_out')`.mapWith(
            Number,
          ),
        active: sql<number>`count(*) filter (where ${conversations.status} = 'active')`.mapWith(
          Number,
        ),
        averageDurationMs: sql<
          number | null
        >`avg(${conversations.durationMs}) filter (where ${conversations.durationMs} is not null)`.mapWith(
          Number,
        ),
      })
      .from(conversations)
      .where(where);

    return {
      started: row?.started ?? 0,
      completed: row?.completed ?? 0,
      cancelled: row?.cancelled ?? 0,
      timedOut: row?.timedOut ?? 0,
      active: row?.active ?? 0,
      averageDurationMs: row?.averageDurationMs ?? null,
    };
  },
};
