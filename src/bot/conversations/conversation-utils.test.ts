import { describe, expect, it, vi } from 'vitest';
import type { BotConversationContext } from '../context.js';
import type { BotConversation } from './example.conversation.js';

vi.mock('#root/services/conversation-analytics.service.js', () => ({
  ConversationAnalyticsService: {
    start: vi.fn(),
    complete: vi.fn(),
    cancel: vi.fn(),
  },
}));

import { runFormWizard } from './conversation-utils.js';

function messageContext(text: string) {
  return {
    message: { text },
    reply: vi.fn().mockResolvedValue(undefined),
  } as unknown as BotConversationContext;
}

describe('runFormWizard', () => {
  it('supports validation and moving back between steps', async () => {
    const initialCtx = {
      reply: vi.fn().mockResolvedValue(undefined),
    } as unknown as BotConversationContext;
    const updates = [
      messageContext('Ada'),
      messageContext('/back'),
      messageContext('Grace'),
      messageContext('grace@example.com'),
    ];
    const conversation = {
      wait: vi.fn().mockImplementation(async () => updates.shift()),
    } as unknown as BotConversation;

    const result = await runFormWizard(
      conversation,
      initialCtx,
      [
        { key: 'name', prompt: 'Name?' },
        {
          key: 'email',
          prompt: 'Email?',
          validate: (value) => (value.includes('@') ? true : 'Invalid email'),
        },
      ],
      { timeoutMs: 1_000 },
    );

    expect(result).toEqual({
      status: 'completed',
      values: { name: 'Grace', email: 'grace@example.com' },
    });
    expect(conversation.wait).toHaveBeenCalledTimes(4);
  });

  it('returns partial values when cancelled', async () => {
    const initialCtx = {
      reply: vi.fn().mockResolvedValue(undefined),
    } as unknown as BotConversationContext;
    const conversation = {
      wait: vi.fn().mockResolvedValue(messageContext('/cancel')),
    } as unknown as BotConversation;

    await expect(
      runFormWizard(conversation, initialCtx, [{ key: 'name', prompt: 'Name?' }]),
    ).resolves.toEqual({ status: 'cancelled', values: {} });
  });
});
