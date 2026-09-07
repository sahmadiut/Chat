/** Notification template persistence and safe variable interpolation. */

import { eq } from 'drizzle-orm';
import { db } from '#root/database/index.js';
import { type NotificationTemplate, notificationTemplates } from '#root/database/schema/index.js';

export type NotificationParseMode = 'HTML' | 'Markdown' | 'MarkdownV2';
export type NotificationTemplateVariables = Readonly<
  Record<string, boolean | number | string | null | undefined>
>;

const TEMPLATE_KEY_PATTERN = /^[a-z][a-z0-9_.-]{0,99}$/;
const VARIABLE_PATTERN = /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g;

function assertTemplateKey(key: string): void {
  if (!TEMPLATE_KEY_PATTERN.test(key)) throw new Error('Invalid notification template key');
}

function normalizeParseMode(value: string): NotificationParseMode {
  if (value === 'HTML' || value === 'Markdown' || value === 'MarkdownV2') return value;
  throw new Error(`Unsupported notification parse mode: ${value}`);
}

function escapeValue(value: string, parseMode: NotificationParseMode): string {
  switch (parseMode) {
    case 'HTML':
      return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    case 'MarkdownV2':
      return value.replace(/[_*\[\]()~`>#+\-=|{}.!]/g, '\\$&');
    case 'Markdown':
      return value.replace(/[_*\[`]/g, '\\$&');
  }
}

/** Interpolate `{{ variable }}` placeholders and reject missing values. */
export function interpolateNotificationTemplate(
  template: string,
  variables: NotificationTemplateVariables,
  parseMode: NotificationParseMode = 'HTML',
): string {
  return template.replace(VARIABLE_PATTERN, (_match, key: string) => {
    const value = variables[key];
    if (value === undefined || value === null) {
      throw new Error(`Missing notification template variable: ${key}`);
    }
    return escapeValue(String(value), parseMode);
  });
}

export const NotificationTemplateService = {
  async get(key: string): Promise<NotificationTemplate | null> {
    assertTemplateKey(key);
    return (
      (await db.query.notificationTemplates.findFirst({
        where: eq(notificationTemplates.key, key),
      })) ?? null
    );
  },

  async upsert(
    key: string,
    content: string,
    parseMode: NotificationParseMode = 'HTML',
    description?: string,
  ): Promise<NotificationTemplate> {
    assertTemplateKey(key);
    if (!content.trim()) throw new Error('Notification template content cannot be empty');

    const [template] = await db
      .insert(notificationTemplates)
      .values({ key, content, parseMode, description })
      .onConflictDoUpdate({
        target: notificationTemplates.key,
        set: {
          content,
          parseMode,
          ...(description !== undefined ? { description } : {}),
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!template) throw new Error(`Failed to save notification template: ${key}`);
    return template;
  },

  async render(
    key: string,
    variables: NotificationTemplateVariables,
  ): Promise<{ message: string; parseMode: NotificationParseMode }> {
    const template = await this.get(key);
    if (!template) throw new Error(`Notification template not found: ${key}`);

    const parseMode = normalizeParseMode(template.parseMode);
    return {
      message: interpolateNotificationTemplate(template.content, variables, parseMode),
      parseMode,
    };
  },
};
