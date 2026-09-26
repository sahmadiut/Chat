# Project Knowledge — Verified Repository Baseline

## Repository Summary

- Root: `D:/Projects/Chat`. The code is a reusable Telegram bot core, not yet the anonymous messaging product (`package.json`, `src/bot/features/index.ts`, `src/database/schema/`).
- TypeScript ESM, Node >=20, npm; grammY, Fastify, Drizzle ORM/PostgreSQL, ioredis and BullMQ (`package.json`).
- `src/main.ts` is the entrypoint: polling via `@grammyjs/runner` or webhook via `src/server/webhook.ts`.

## Repository Map

| Path | Purpose |
|---|---|
| `src/bot/bot.ts`, `context.ts`, `commands.ts` | Bot middleware/conversations, context, Telegram command menu |
| `src/bot/features/` | Start/profile/support, settings, admin, notifications, Mini App, inline and media composers |
| `src/bot/navigation/`, `conversations/`, `middlewares/`, `i18n/`, `media/` | Menus/callbacks, wizards, update pipeline, localization, file handling |
| `src/services/` | User/chat CRUD, settings, generic message logs, notifications, chat events, admin logs |
| `src/database/`, `src/cache/`, `src/queue/` | PostgreSQL/Drizzle, Redis, BullMQ workers and queues |
| `src/server/`, `src/scripts/` | Fastify webhook/Mini App and webhook registration |
| `locales/`, `.agentic/` | English/Farsi Fluent translations; project task framework and PRD |
| `.github/workflows/ci.yml`, `.husky/`, `biome.json`, `vitest.config.ts` | CI, pre-commit, lint/format, tests |

## Runtime and Quality Gates

- `npm ci`, copy `.env.example` to `.env`, then `npm run dev` (tsx watch). `npm run build && npm start` runs compiled `dist/main.js` (`package.json`).
- `src/config/env.ts` validates configuration with Zod. Required: `BOT_TOKEN`, `BOT_USERNAME`, `ADMIN_CHAT_ID`, `DATABASE_URL`; Redis defaults to localhost. Webhook mode needs URL/secret.
- `npm test` uses Vitest with co-located `src/**/*.test.ts`; `npm run typecheck`, `npm run lint`, `npm run build` are available. CI runs Biome, typecheck and build on Node 20/22, but does not run Vitest (`.github/workflows/ci.yml`). No dedicated test database setup found (`vitest.config.ts`).
- Database scripts offer generate/migrate/push/studio. `db:seed` references absent `src/scripts/seed.ts` (`package.json`).

## Data and Infrastructure

- PostgreSQL uses postgres.js and Drizzle (`src/database/index.ts`). Tables: `users`, `chats`, `user_chat`, chat member/join/boost events, `messages`, `conversation`, `bot_settings`, notification preferences/templates and `admin_logs` (`src/database/schema/`). `users.telegram_id` is primary identity. `conversation` tracks grammY wizard lifecycle, not peer chat sessions.
- Every startup may create the database and runs `drizzle-kit push --force`, then verifies `users`/`chats` (`src/database/index.ts`). `drizzle.config.ts` points to `drizzle/`, but no checked-in migrations were found.
- Redis stores grammY session/conversation state (seven-day/one-day TTL), debounce and cache (`src/bot/middlewares/session.middleware.ts`, `src/cache/`). Rate limiting uses `@grammyjs/ratelimiter`; no matching locks found.
- BullMQ has broadcast and notification queues, retries/backoff and workers imported into the bot process (`src/queue/`). Media is stored in local directories. No object storage or backup implementation found.
- Fastify serves the bot webhook, `/health`, `/livez`, `/webapp` and `/webapp/validate`; webhook secret/IP and Mini App HMAC checks are in `src/server/webhook.ts`. Pino logs to application and per-user files (`src/utils/logger.ts`). No Dockerfile, compose, systemd or deployment manifest found.

## Existing Product Modules

| Module | State from code | Evidence |
|---|---|---|
| Telegram registration/identity | Implemented generic core | `users.ts`, `upsert.middleware.ts`, `user.service.ts` |
| Custom matchmaking profile | Missing | `users.ts` only stores Telegram fields; no custom profile table/feature |
| Anonymous links/inbox | Missing | No link/inbox schema or feature composer |
| Matchmaking and live peer chat | Missing | No match/session tables or composer; `conversation` is wizard analytics |
| Two-sided Telegram deletion | Missing | `messages.ts` has one Telegram message ID; no relay mapping/deletion service |
| Coins/rewards/referrals | Missing | No ledger/referral schema or service |
| Moderation | Partial generic controls | Ban guard, admin ban/unban, rate limit; no anonymous report flow |
| Admin/archive/export | Partial generic controls | Admin composer/logs, message history/stats; no session archive/export |
| Monitoring/operations | Partial | Pino, health/liveness, alerts and CI; backup/recovery absent |
| Localization/settings | Implemented generic core | Fluent locale files, bot settings, notification preferences |

## Conventions, Risks and Open Questions

- Feature composers register in `src/bot/features/index.ts`; middleware and conversations in `src/bot/bot.ts`. Services use Drizzle directly, often with Redis cache. Imports use `#root` and `.js` extensions (`tsconfig.json`).
- `/profile` displays Telegram name, username and ID (`src/bot/features/start/start.command.ts`); it cannot serve as an anonymous public profile. Logger middleware duplicates incoming text/payload into Pino, per-user files and PostgreSQL, expanding exposure of future private content (`src/bot/middlewares/logger.middleware.ts`). Startup `push --force` is an operational risk.
- A broad text fallback in the first composer (`start.command.ts`) may consume later composers' text handlers; verify with integration tests when modifying routing.
- Live PostgreSQL/Redis/Telegram startup and production topology are unverified. Hosting, backup, retention and secret distribution are not represented by checked-in artifacts. README claims need rechecking where paths are absent. `TASK-0002` owns detailed PRD gap analysis.
