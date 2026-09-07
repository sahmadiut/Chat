# Telegram Bot Core — Task Tracker

## Phase 1 — Project Scaffolding & Configuration
- [/] `package.json`
- [ ] `tsconfig.json`
- [ ] `biome.json`
- [ ] `.env.example`
- [ ] `.gitignore`
- [ ] `.husky/pre-commit`

## Phase 2 — Config & Utilities
- [ ] `src/config/env.ts`
- [ ] `src/utils/logger.ts`
- [ ] `src/utils/errors.ts`

## Phase 3 — Database Layer
- [ ] `drizzle.config.ts`
- [ ] `src/database/schema/users.ts`
- [ ] `src/database/schema/chats.ts`
- [ ] `src/database/schema/index.ts`
- [ ] `src/database/index.ts`

## Phase 4 — Cache Layer
- [ ] `src/cache/index.ts`
- [ ] `src/cache/utils.ts`

## Phase 5 — Services Layer
- [ ] `src/services/user.service.ts`
- [ ] `src/services/chat.service.ts`

## Phase 6 — BullMQ Queue System
- [ ] `src/queue/connection.ts`
- [ ] `src/queue/queues.ts`
- [ ] `src/queue/workers/broadcast.worker.ts`
- [ ] `src/queue/workers/notification.worker.ts`
- [ ] `src/queue/index.ts`

## Phase 7 — Bot Core (grammY)
- [ ] `src/bot/context.ts`
- [ ] `src/bot/i18n/i18n.ts`
- [ ] `src/bot/middlewares/session.middleware.ts`
- [ ] `src/bot/middlewares/upsert.middleware.ts` ⚠️ /start cache bypass
- [ ] `src/bot/middlewares/ratelimit.middleware.ts`
- [ ] `src/bot/middlewares/index.ts`
- [ ] `src/bot/filters/admin.filter.ts`
- [ ] `src/bot/conversations/example.conversation.ts`
- [ ] `src/bot/features/start/start.command.ts`
- [ ] `src/bot/features/start/start.keyboard.ts`
- [ ] `src/bot/features/settings/settings.command.ts`
- [ ] `src/bot/features/settings/settings.keyboard.ts`
- [ ] `src/bot/features/index.ts`
- [ ] `src/bot/bot.ts`

## Phase 8 — i18n Locale Files
- [ ] `locales/en.ftl`
- [ ] `locales/fa.ftl`

## Phase 9 — Application Bootstrap
- [ ] `src/main.ts`

## Phase 10 — CI/CD & DX
- [ ] `.github/workflows/ci.yml`
- [ ] `.vscode/settings.json`

## Verification
- [ ] `npm install` succeeds
- [ ] `npx tsc --noEmit` passes
- [ ] `npx @biomejs/biome check .` passes
- [ ] `npm run build` produces `dist/`
