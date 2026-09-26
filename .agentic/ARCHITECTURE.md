# Architecture

## As-Is Architecture

### Entrypoints and Update Flow

`src/main.ts` loads validated environment, calls `ensureDatabase()`, initializes grammY, registers commands and starts polling (`@grammyjs/runner`) or Fastify webhook (`src/server/webhook.ts`). Shutdown closes runner/server, BullMQ workers/queues, Redis and PostgreSQL.

```text
Telegram Bot API -> runner polling or Fastify webhook -> grammY bot
  -> rate limit -> sanitizer -> logger -> Redis session -> i18n
  -> ban/maintenance guards -> conversations -> user upsert -> feature composers
  -> services -> PostgreSQL / Redis / BullMQ / Telegram API
```

The pipeline is wired in `src/bot/bot.ts`. `src/bot/features/index.ts` registers start, settings, admin, notifications, web-app, inline and media composers in that order. Commands, hears, callbacks and update filters dispatch actions. `src/bot/navigation/callback-router.ts` offers structured callbacks; features also register callbacks directly. grammY conversations manage support, name editing and admin workflows. `src/bot/middlewares/session.middleware.ts` stores custom and conversation partitions in Redis by chat/user key.

### Data and Services

`src/services/` contains Drizzle-backed Telegram user/chat, settings, generic message logging, notification, conversation analytics, chat-event and admin-log services. The PostgreSQL schema is Telegram-oriented (`src/database/schema/`). `users.telegram_id` is the identity key. `messages` logs generic incoming/outgoing bot interactions and one Telegram message ID. `conversation` records wizard lifecycle, not peer chat sessions. There are no anonymous inbox, custom matchmaking profile, match, chat-session, two-sided relay mapping or coin ledger models.

`src/database/index.ts` uses postgres.js/Drizzle and invokes `drizzle-kit push --force` at startup; migration commands exist but migration files do not. Redis (`src/cache/`) holds sessions, cache and debounce keys. BullMQ (`src/queue/`) runs notification and broadcast workers in the bot process with retries/backoff. Media uses local filesystem directories; object storage is not present.

### External Integrations and Deployment

Telegram Bot API is the primary integration. Fastify serves a Mini App scaffold and validates Telegram init data, plus `/health` and `/livez` (`src/server/webhook.ts`). Pino and Telegram admin alerts provide basic visibility. README describes a Node process in polling or webhook mode; no checked-in container, orchestration, reverse-proxy or backup configuration was found.

### Lifecycles

- Incoming update: middleware rate limits, sanitizes, logs, loads session/locale, guards, then conversations/upsert and feature dispatch. `logger.middleware.ts` makes a non-blocking PostgreSQL log attempt and writes application/per-user logs.
- User update: `upsert.middleware.ts` stores Telegram user/chat data with Redis debounce; `/start` bypasses debounce.
- Admin broadcast/notification: admin composer or notification service enqueues BullMQ jobs; in-process workers send Telegram messages. Notification delivery checks recipient preferences.
- `/profile` reads Telegram user data via `UserService` and displays Telegram ID/name/username. It is not a separate anonymous matchmaking identity.

## Target Boundary and Invariants

The charter/PRD describe anonymous links and session-based matchmaking. Those are targets, not present in this baseline. `TASK-0002` owns detailed target mapping. Do not treat generic `messages` or `conversation` tables as satisfying anonymous session/archive requirements. See `PROJECT_CHARTER.md` for required separation of Telegram identity, exact session mapping and deletion behavior.
