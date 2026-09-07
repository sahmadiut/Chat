/**
 * Admin Conversations
 *
 * 1. Search User Conversation
 * 2. Send Direct Message to User Conversation
 * 3. Broadcast 4-Step Wizard Conversation
 * 4. Edit Welcome Message Conversation
 */

import { InlineKeyboard, Keyboard } from 'grammy';
import type { BotConversation } from '#root/bot/conversations/example.conversation.js';
import {
  buildBroadcastAudienceKeyboard,
  buildBroadcastPreviewKeyboard,
  buildUserCardKeyboard,
} from '#root/bot/features/admin/admin.keyboards.js';
import { broadcastQueue } from '#root/queue/index.js';
import { AdminLogService } from '#root/services/admin-log.service.js';
import { SettingService } from '#root/services/setting.service.js';
import { UserService } from '#root/services/user.service.js';
import type { BotConversationContext } from '../../context.js';
import { escapeHtml, formatAdminUserCard, formatBroadcastReport } from './admin.formatters.js';

/**
 * 1. Search User Conversation
 */
export async function searchUserConversation(
  conversation: BotConversation,
  ctx: BotConversationContext,
): Promise<void> {
  const searchKeyboard = new Keyboard()
    .requestUsers(ctx.t('admin-users-search-btn-contacts'), 1, {
      user_is_bot: false,
      max_quantity: 1,
    })
    .row()
    .text(ctx.t('common-cancel'))
    .resized()
    .oneTime();

  await ctx.reply(ctx.t('admin-users-search-prompt'), {
    parse_mode: 'HTML',
    reply_markup: searchKeyboard,
  });

  const inputCtx = await conversation.waitFor([
    'message:text',
    'message:contact',
    'message:forward_origin',
    'message:users_shared',
    'callback_query:data',
  ]);

  const message = inputCtx.message;
  const query = message?.text?.trim();
  const contactId = message?.contact?.user_id;
  const forwardedOrigin = message?.forward_origin;
  const forwardedUserId = forwardedOrigin?.type === 'user' ? forwardedOrigin.sender_user.id : null;
  const sharedUserId = message?.users_shared?.users[0]?.user_id;

  if (
    query === ctx.t('common-cancel') ||
    query === '/cancel' ||
    inputCtx.callbackQuery?.data === 'admin:cancel:search'
  ) {
    if (inputCtx.callbackQuery) {
      await inputCtx.answerCallbackQuery();
    }
    await inputCtx.reply(ctx.t('example-cancelled'), {
      reply_markup: { remove_keyboard: true },
    });
    await inputCtx.reply(ctx.t('admin-users-title'), {
      parse_mode: 'HTML',
      reply_markup: new InlineKeyboard().text(ctx.t('common-back'), 'admin:users'),
    });
    return;
  }

  const selectedUserId = contactId ?? forwardedUserId ?? sharedUserId;

  if (!query && !selectedUserId) {
    await inputCtx.reply(ctx.t('error-generic'), {
      reply_markup: { remove_keyboard: true },
    });
    await inputCtx.reply(ctx.t('admin-users-title'), {
      parse_mode: 'HTML',
      reply_markup: new InlineKeyboard().text(ctx.t('common-back'), 'admin:users'),
    });
    return;
  }

  const results = await conversation.external(async () => {
    if (selectedUserId) {
      const user = await UserService.findByTelegramId(selectedUserId);
      return user ? [user] : [];
    }
    return UserService.search(query ?? '', 10);
  });

  const displayQuery = selectedUserId ? String(selectedUserId) : (query ?? '');

  if (results.length === 0) {
    await inputCtx.reply(
      ctx.t('admin-users-search-no-results', { query: escapeHtml(displayQuery) }),
      {
        parse_mode: 'HTML',
        reply_markup: { remove_keyboard: true },
      },
    );
    await inputCtx.reply(ctx.t('admin-users-title'), {
      parse_mode: 'HTML',
      reply_markup: new InlineKeyboard().text(ctx.t('common-back'), 'admin:users'),
    });
    return;
  }

  if (results.length === 1 && results[0]) {
    const singleUser = results[0];
    const text = formatAdminUserCard({ user: singleUser, t: (k, a) => ctx.t(k, a) });
    const keyboard = buildUserCardKeyboard({
      userId: singleUser.telegramId,
      isBanned: singleUser.isBanned,
      messageLabel: ctx.t('admin-users-btn-message'),
      banLabel: ctx.t('admin-users-btn-ban'),
      unbanLabel: ctx.t('admin-users-btn-unban'),
      backLabel: ctx.t('admin-users-btn-back-list'),
    });

    await inputCtx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
    return;
  }

  const keyboard = new InlineKeyboard();
  for (const user of results) {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
    keyboard.text(`${name} (${user.telegramId})`, `admin:users:card:${user.telegramId}`).row();
  }
  keyboard.text(ctx.t('common-back'), 'admin:users');

  await inputCtx.reply(
    ctx.t('admin-users-search-results', {
      count: String(results.length),
      query: escapeHtml(displayQuery),
    }),
    {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    },
  );
}

/**
 * 2. Direct Message to User Conversation
 */
export async function directMessageConversation(
  conversation: BotConversation,
  ctx: BotConversationContext,
): Promise<void> {
  const match = ctx.callbackQuery?.data?.match(/^admin:users:dm:(\d+)(?::(\d+))?$/);
  const targetId = match?.[1] ? Number(match[1]) : null;
  const replyToMsgId = match?.[2] ? Number(match[2]) : null;

  if (!targetId) {
    await ctx.reply(ctx.t('error-generic'));
    return;
  }

  const targetUser = await conversation.external(() => UserService.findByTelegramId(targetId));
  if (!targetUser) {
    await ctx.reply(ctx.t('error-generic'));
    return;
  }

  const fullName = [targetUser.firstName, targetUser.lastName].filter(Boolean).join(' ');

  await ctx.reply(
    ctx.t('admin-dm-prompt', {
      name: escapeHtml(fullName),
      id: String(targetId),
    }),
    {
      parse_mode: 'HTML',
      reply_markup: new InlineKeyboard().text(ctx.t('common-cancel'), 'admin:cancel:dm'),
    },
  );

  const inputCtx = await conversation.waitFor([
    'message:text',
    'message:photo',
    'message:document',
    'message:video',
    'message:voice',
    'message:audio',
    'message:sticker',
    'callback_query:data',
  ]);

  if (inputCtx.callbackQuery?.data === 'admin:cancel:dm') {
    await inputCtx.answerCallbackQuery();
    await inputCtx.reply(ctx.t('example-cancelled'), {
      reply_markup: new InlineKeyboard().text(ctx.t('common-back'), `admin:users:card:${targetId}`),
    });
    return;
  }

  const adminMsg = inputCtx.message;
  if (!adminMsg) {
    await inputCtx.reply(ctx.t('error-generic'));
    return;
  }

  const adminSenderId = ctx.from?.id ?? inputCtx.from?.id;
  if (!adminSenderId) {
    await inputCtx.reply(ctx.t('error-generic'));
    return;
  }

  try {
    await conversation.external(async () => {
      // 1. Send the announcement message (replying to original user message if from support flow)
      const replyParameters = replyToMsgId ? { message_id: replyToMsgId } : undefined;

      await ctx.api.sendMessage(targetId, ctx.t('admin-dm-incoming-header'), {
        parse_mode: 'HTML',
        reply_parameters: replyParameters,
      });

      // 2. Copy the admin message content directly to the user (preserves photos, files, captions, formatting)
      await ctx.api.copyMessage(targetId, adminSenderId, adminMsg.message_id);

      const previewText = adminMsg.text ?? adminMsg.caption ?? '[Media message]';
      await AdminLogService.logAction({
        adminTelegramId: adminSenderId,
        action: 'direct_message',
        targetUserId: targetId,
        details: `Sent DM: "${previewText.slice(0, 80)}"`,
      });
    });

    await inputCtx.reply(ctx.t('admin-dm-success', { name: escapeHtml(fullName) }), {
      parse_mode: 'HTML',
      reply_markup: new InlineKeyboard().text(ctx.t('common-back'), `admin:users:card:${targetId}`),
    });
  } catch (err: unknown) {
    const error = err as { description?: string };
    await inputCtx.reply(ctx.t('admin-dm-failed', { error: error.description ?? 'Error' }), {
      reply_markup: new InlineKeyboard().text(ctx.t('common-back'), `admin:users:card:${targetId}`),
    });
  }
}

/**
 * 3. Broadcast 4-Step Wizard Conversation
 * Step 1: Choose audience — [All users] [Active only]
 * Step 2: Bot waits for admin to send message content
 * Step 3: Preview shown exactly as it will be sent: [✅ Send] [✏️ Edit] [❌ Cancel]
 * Step 4: Report result: ✅ Sent: X, ❌ Failed: X, [🔙 Back]
 */
export async function broadcastConversation(
  conversation: BotConversation,
  ctx: BotConversationContext,
): Promise<void> {
  const [totalCount, activeIds] = await conversation.external(async () => {
    const [stats, active] = await Promise.all([
      UserService.getStats(),
      UserService.getAllActiveUserIds(),
    ]);
    return [stats.total, active];
  });

  // Step 1: Audience selection
  const step1Keyboard = buildBroadcastAudienceKeyboard({
    all: ctx.t('admin-broadcast-aud-all', { count: String(totalCount) }),
    active: ctx.t('admin-broadcast-aud-active', { count: String(activeIds.length) }),
    cancel: ctx.t('common-cancel'),
  });

  await ctx.reply(ctx.t('admin-broadcast-step1-title'), {
    parse_mode: 'HTML',
    reply_markup: step1Keyboard,
  });

  const step1Ctx = await conversation.waitFor('callback_query:data');
  const audienceChoice = step1Ctx.callbackQuery?.data;

  if (audienceChoice === 'admin:dashboard') {
    await step1Ctx.answerCallbackQuery();
    await step1Ctx.reply(ctx.t('example-cancelled'));
    return;
  }

  await step1Ctx.answerCallbackQuery();

  // Step 2 & 3 Loop (allows [✏️ Edit])
  let broadcastText = '';
  let previewApproved = false;

  while (!previewApproved) {
    // Step 2: Prompt for content
    await step1Ctx.reply(ctx.t('admin-broadcast-step2-prompt'), {
      parse_mode: 'HTML',
      reply_markup: new InlineKeyboard().text(ctx.t('common-cancel'), 'admin:broadcast:cancel'),
    });

    const step2Ctx = await conversation.waitFor(['message:text', 'callback_query:data']);

    if (step2Ctx.callbackQuery?.data === 'admin:broadcast:cancel') {
      await step2Ctx.answerCallbackQuery();
      await step2Ctx.reply(ctx.t('example-cancelled'), {
        reply_markup: new InlineKeyboard().text(ctx.t('common-back'), 'admin:dashboard'),
      });
      return;
    }

    broadcastText = step2Ctx.message?.text ?? '';
    if (!broadcastText) {
      await step2Ctx.reply(ctx.t('error-generic'));
      continue;
    }

    // Step 3: Preview
    const previewKeyboard = buildBroadcastPreviewKeyboard({
      send: ctx.t('admin-broadcast-btn-send'),
      edit: ctx.t('admin-broadcast-btn-edit'),
      cancel: ctx.t('common-cancel'),
    });

    await step2Ctx.reply(
      `${ctx.t('admin-broadcast-step3-title')}\n━━━━━━━━━━━━━━━━━━━━\n${broadcastText}\n━━━━━━━━━━━━━━━━━━━━`,
      {
        parse_mode: 'HTML',
        reply_markup: previewKeyboard,
      },
    );

    const step3Ctx = await conversation.waitFor('callback_query:data');
    const step3Action = step3Ctx.callbackQuery?.data;
    await step3Ctx.answerCallbackQuery();

    if (step3Action === 'admin:broadcast:cancel') {
      await step3Ctx.reply(ctx.t('example-cancelled'), {
        reply_markup: new InlineKeyboard().text(ctx.t('common-back'), 'admin:dashboard'),
      });
      return;
    }

    if (step3Action === 'admin:broadcast:edit') {
      continue;
    }

    if (step3Action === 'admin:broadcast:send') {
      previewApproved = true;
    }
  }

  // Step 4: Execution & Report
  const recipients =
    audienceChoice === 'admin:broadcast:aud:active'
      ? activeIds
      : await conversation.external(() => UserService.getAllActiveUserIds());

  await conversation.external(async () => {
    await broadcastQueue.add('admin-broadcast', {
      message: broadcastText,
      userIds: recipients,
      parseMode: 'HTML',
    });

    if (ctx.from) {
      await AdminLogService.logAction({
        adminTelegramId: ctx.from.id,
        action: 'broadcast',
        details: `Queued broadcast to ${recipients.length} users: "${broadcastText.slice(0, 80)}"`,
      });
    }
  });

  const reportText = formatBroadcastReport({
    sent: recipients.length,
    failed: 0,
    t: (k, a) => ctx.t(k, a),
  });

  await ctx.reply(reportText, {
    parse_mode: 'HTML',
    reply_markup: new InlineKeyboard().text(ctx.t('common-back'), 'admin:dashboard'),
  });
}

/**
 * 4. Edit Welcome Message Conversation
 */
export async function editWelcomeMessageConversation(
  conversation: BotConversation,
  ctx: BotConversationContext,
): Promise<void> {
  const currentMessage = (await SettingService.getCustomStartMessage()) ?? '(Default)';

  await ctx.reply(
    ctx.t('admin-settings-welcome-prompt', {
      current: escapeHtml(currentMessage),
    }),
    {
      parse_mode: 'HTML',
      reply_markup: new InlineKeyboard().text(ctx.t('common-cancel'), 'admin:settings:cancel'),
    },
  );

  const inputCtx = await conversation.waitFor(['message:text', 'callback_query:data']);

  if (inputCtx.callbackQuery?.data === 'admin:settings:cancel') {
    await inputCtx.answerCallbackQuery();
    await inputCtx.reply(ctx.t('example-cancelled'), {
      reply_markup: new InlineKeyboard().text(ctx.t('common-back'), 'admin:settings'),
    });
    return;
  }

  const text = inputCtx.message?.text?.trim();
  if (!text) {
    await inputCtx.reply(ctx.t('error-generic'), {
      reply_markup: new InlineKeyboard().text(ctx.t('common-back'), 'admin:settings'),
    });
    return;
  }

  if (text === '/reset') {
    await conversation.external(() => SettingService.setCustomStartMessage(null));
    await inputCtx.reply(ctx.t('admin-settings-welcome-reset'), {
      parse_mode: 'HTML',
      reply_markup: new InlineKeyboard().text(ctx.t('common-back'), 'admin:settings'),
    });
    return;
  }

  await conversation.external(() => SettingService.setCustomStartMessage(text));
  await inputCtx.reply(ctx.t('admin-settings-welcome-updated'), {
    parse_mode: 'HTML',
    reply_markup: new InlineKeyboard().text(ctx.t('common-back'), 'admin:settings'),
  });
}
