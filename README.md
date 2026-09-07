# Telegram Bot Core

A production-ready Telegram bot framework built with **grammY**, **TypeScript**, **PostgreSQL**, **Redis**, and **BullMQ**. Supports dual-mode startup: long-polling for development or webhook via Fastify for production.

## Features

- **Dual-mode startup** — Long-polling (development) or webhook via Fastify (production)
- **PostgreSQL + Drizzle ORM** — Type-safe database layer with auto-setup, migrations, and relational queries
- **Redis caching** — Session storage, cache-first lookups, and upsert debouncing via ioredis
- **BullMQ job queues** — Background broadcast and notification processing with rate limiting
- **Multi-language support** — i18n via Project Fluent (`.ftl` files), currently English and Farsi
- **Multi-step conversations** — Form wizards with back/cancel, inactivity timeouts, and lifecycle analytics
- **Advanced navigation** — Dynamic nested menus, structured callback routing, breadcrumbs, and pagination
- **Media handling** — Size- and MIME-validated Telegram downloads plus guarded local uploads
- **Scheduled notifications** — BullMQ delayed delivery, per-user preferences, and safe templates
- **Inline mode + Mini App** — Inline result scaffold and HMAC-validated Telegram Web App
- **Admin system** — Multi-admin support with guard middleware and admin-only commands
- **Structured logging** — Pino with daily log rotation and per-module child loggers
- **Error alerting** — Automatic Telegram alerts to admins on unhandled errors
- **Graceful shutdown** — Clean teardown of all components (bot, workers, Redis, PostgreSQL)
- **Webhook security** — Secret token validation and Telegram IP allowlist
- **CI-ready** — Biome linting/formatting enforced via Husky pre-commit hooks

## Prerequisites

- **Node.js** >= 20
- **PostgreSQL** >= 14
- **Redis** >= 6
- A Telegram bot token from [@BotFather](https://t.me/BotFather)

## Quick Start

### Installation

```bash
git clone <your-repo-url>
cd tel-bot
npm install
```

### Configuration

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
BOT_TOKEN=your-bot-token-from-botfather
BOT_USERNAME=your_bot_username
ADMIN_CHAT_ID=your-telegram-user-id
DATABASE_URL=postgresql://user:password@localhost:5432/telegram_bot
REDIS_URL=redis://localhost:6379
```

See [Environment Variables](#-environment-variables) for the full reference.

### Database & Redis Setup

**PostgreSQL** — Create the database before first run:

```sql
CREATE USER bot_user WITH PASSWORD 'your_password';
CREATE DATABASE telegram_bot OWNER bot_user;
```

> The app automatically creates the database and syncs the schema on startup using `drizzle-kit push` — no manual migrations needed in development.

**Redis** — Make sure Redis is running:

```bash
# Docker (quickest)
docker run -d -p 6379:6379 redis:7-alpine

# macOS (Homebrew)
brew services start redis

# Linux (systemd)
sudo systemctl start redis
```

Verify: `redis-cli ping` should return `PONG`.

**Seed data** (optional):

```bash
npm run db:seed
```

### Development

```bash
npm run dev
```

Starts the bot in **polling mode** with hot-reload via `tsx watch`.

### Production

```bash
npm run build
npm start
```

See [Deployment](#-deployment) for webhook setup.

## Architecture

### Startup Flow

`src/main.ts` bootstraps the application in sequence:

```
Validate env (Zod) → Ensure database exists → Sync schema (drizzle-kit push)
  → Initialize bot → Start polling or webhook server
```

Graceful shutdown tears down in reverse order: bot → BullMQ workers → Redis → PostgreSQL.

### Middleware Pipeline

Defined in `src/bot/bot.ts`. Order matters — each layer depends on the ones before it:

```
Request
  │
  ├─ 1. Rate Limiter        Drops spammy users early
  ├─ 2. Sanitizer            Strips dangerous HTML/scripts from input
  ├─ 3. Logger               Records user interaction details
  ├─ 4. Session              Loads Redis-backed multi-key session data
  ├─ 5. i18n                 Sets up translation context (ctx.t())
  ├─ 6. Conversations        Enables multi-step conversation state machine
  ├─ 7. Auto-Upsert          Captures user/chat data to PostgreSQL
  │                           (Redis-debounced, 5 min TTL; /start bypasses cache)
  └─ 8. Features             Command handlers & business logic
```

### Key Layers

| Layer | Location | Description |
|-------|----------|-------------|
| **Config** | `src/config/env.ts` | Zod-validated environment variables. All env vars must be declared in the schema. |
| **Database** | `src/database/` | Drizzle ORM over `postgres.js`. Auto-creates the DB and syncs schema on startup. |
| **Cache** | `src/cache/` | ioredis client for session storage, debounce flags, and cache-first lookups. |
| **Services** | `src/services/` | Business logic with a cache-first pattern: check Redis → query PostgreSQL → populate cache. |
| **Queue** | `src/queue/` | BullMQ queues and workers for broadcast and notification background jobs. Uses a separate Redis connection (`maxRetriesPerRequest: null`). |
| **Server** | `src/server/webhook.ts` | Fastify webhook server with Telegram IP allowlist, health (`/health`) and liveness (`/livez`) endpoints. |

### Context Types

Defined in `src/bot/context.ts`:

- **`BotContext`** — Outer middleware tree context (includes `ConversationFlavor`)
- **`BotConversationContext`** — Inner context used inside conversation builders (no nesting)

Session uses a multi-key strategy:
- `ctx.session.custom` — Application data
- `ctx.session.conversation` — Plugin-managed conversation state

### i18n

Uses [Project Fluent](https://projectfluent.org/) (`.ftl` files) in the `locales/` directory. Currently supports `en` and `fa`. Locale negotiation reads from the session first, then falls back to Telegram's `language_code`.

### Advanced Telegram Features

- Callback payloads use `module:action:param` and are constructed with `buildCallbackData()` so Telegram's 64-byte limit is enforced.
- `MenuBuilder` renders context-aware nested menus with breadcrumb, back, and home navigation; `paginate()` and `createPaginationKeyboard()` support reusable list screens.
- Incoming photos, documents, and videos are streamed into `DOWNLOAD_DIR`. Size, allowlisted MIME metadata, and magic bytes are checked before a file is retained. `uploadLocalFile()` only reads from `UPLOAD_DIR` by default.
- Conversations default to a 10-minute inactivity timeout. Reusable confirm/form helpers and PostgreSQL lifecycle analytics live under `src/bot/conversations/` and `src/services/conversation-analytics.service.ts`.
- Delayed notification jobs re-check the recipient's category preference at delivery time. Templates use escaped `{{ variable }}` interpolation.
- `/webapp` opens the configured Mini App. The webhook server serves the scaffold at `GET /webapp` and validates Telegram init data at `POST /webapp/validate` before the app sends data back to the bot.

### Error Handling

Custom error hierarchy in `src/utils/errors.ts`:

```
AppError
  ├── DatabaseError
  ├── CacheError
  └── BotError
```

The global error handler (`bot.catch()`) logs with Pino and sends Telegram alerts to `ADMIN_CHAT_ID`.

## Project Structure

```
src/
├── bot/
│   ├── bot.ts                # Bot instance & plugin wiring
│   ├── context.ts            # Custom context types
│   ├── conversations/        # Multi-step conversation builders
│   ├── features/             # Command handlers & business logic
│   │   ├── start/            # /start, /help, about
│   │   ├── settings/         # /settings, language selection
│   │   ├── notifications/    # Per-category opt-in/opt-out menu
│   │   ├── media/            # Automatic incoming media storage
│   │   ├── inline/           # Inline query result scaffold
│   │   ├── web-app/          # Mini App launcher and validation
│   │   └── index.ts          # Feature registry
│   ├── filters/              # Guard middleware (admin filter)
│   ├── i18n/                 # i18n setup
│   ├── media/                # Secure download/upload helpers
│   ├── navigation/           # Callback router, menus, pagination
│   └── middlewares/          # Middleware pipeline
├── cache/                    # Redis client & utilities
├── config/                   # Zod-validated environment
├── database/                 # Drizzle ORM, schema, relations
│   └── schema/               # Table definitions
├── queue/                    # BullMQ queues & workers
│   └── workers/              # Job processors
├── scripts/                  # CLI utilities (set-webhook, seed)
├── server/                   # Fastify webhook server
├── services/                 # Business logic layer
├── utils/                    # Logger, error classes
└── main.ts                   # Application entry point
locales/                      # i18n translation files (en.ftl, fa.ftl)
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BOT_TOKEN` | Yes | — | Telegram Bot API token from @BotFather |
| `BOT_USERNAME` | Yes | — | Bot username (without `@`) |
| `ADMIN_CHAT_ID` | Yes | — | Primary admin Telegram user ID for error alerts |
| `ADMIN_IDS` | No | `""` | Comma-separated list of additional admin user IDs |
| `BOT_MODE` | No | `polling` | `polling` or `webhook` |
| `WEBHOOK_URL` | When webhook | — | Public URL (required when `BOT_MODE=webhook`) |
| `WEB_APP_URL` | No | `WEBHOOK_URL/webapp` | Public HTTPS URL for the Telegram Mini App |
| `WEBHOOK_SECRET` | When webhook | — | Secret token for webhook validation (required when `BOT_MODE=webhook`) |
| `PORT` | No | `3000` | Fastify server port (webhook mode) |
| `DATABASE_URL` | Yes | — | PostgreSQL connection URL |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection URL |
| `NODE_ENV` | No | `development` | `development`, `production`, or `test` |
| `LOG_LEVEL` | No | `info` | Pino log level (`fatal`, `error`, `warn`, `info`, `debug`, `trace`) |
| `LOG_DIR` | No | `logs` | Directory for log files |
| `UPLOAD_DIR` | No | `uploads` | Directory for uploaded files |
| `DOWNLOAD_DIR` | No | `downloads` | Directory for downloaded files |

## Development Guide

### Adding a New Feature

1. Create a directory under `src/bot/features/your-feature/`
2. Export a `Composer<BotContext>` from your command file
3. Register it in `src/bot/features/index.ts`
4. Add translations to `locales/en.ftl` and `locales/fa.ftl`

### Adding New Middleware

1. Create a file in `src/bot/middlewares/`
2. Export it from `src/bot/middlewares/index.ts`
3. Wire it in `src/bot/bot.ts` — **order matters** in the pipeline

### Database Changes

1. Modify or add schema files in `src/database/schema/`
2. Update relations in `src/database/schema/relations.ts`
3. Update the barrel export in `src/database/schema/index.ts`
4. Sync the changes:
   - **Development:** `npm run db:push` (auto-syncs to DB)
   - **Production:** `npm run db:generate` then `npm run db:migrate`

### Useful Commands

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with hot-reload (polling mode) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run lint` | Run Biome linter |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run check` | Lint + format in one pass |
| `npm run typecheck` | TypeScript type checking (`tsc --noEmit`) |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run db:push` | Sync Drizzle schema to DB (dev) |
| `npm run db:generate` | Generate Drizzle migration files (prod) |
| `npm run db:migrate` | Apply pending migrations (prod) |
| `npm run db:studio` | Open Drizzle Studio GUI |
| `npm run db:seed` | Seed development data |
| `npm run webhook:set` | Register webhook URL with Telegram |

## Testing

Tests use [Vitest](https://vitest.dev/) with `globals: true`. Test files live alongside source files (`*.test.ts`) or in the `tests/` directory.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run a single test file
npx vitest run src/path/to/file.test.ts

# Run tests with coverage
npm run test:coverage
```

The path alias `#root` is configured in `vitest.config.ts`. Test timeout is 10 seconds for integration tests.

## Deployment

### Polling Mode (Development)

Best for local development. The bot actively polls Telegram for updates — no public URL needed.

```bash
npm run dev
```

### Webhook Mode (Production)

For production servers with a public URL. Telegram pushes updates to your server.

1. **Set environment variables:**

   ```env
   BOT_MODE=webhook
   WEBHOOK_URL=https://your-domain.com
   WEBHOOK_SECRET=a-strong-random-secret
   PORT=3000
   NODE_ENV=production
   ```

2. **Build and start:**

   ```bash
   npm run build
   npm start
   ```

3. **Register the webhook with Telegram:**

   ```bash
   npm run webhook:set
   ```

The Fastify server provides:
- `GET /health` — Health check endpoint
- `GET /livez` — Liveness probe
- Telegram IP allowlist validation for incoming webhooks

### Docker

```bash
docker run -d \
  --name telegram-bot \
  -e BOT_TOKEN=your-token \
  -e BOT_USERNAME=your_bot \
  -e ADMIN_CHAT_ID=123456 \
  -e DATABASE_URL=postgresql://user:pass@db:5432/telegram_bot \
  -e REDIS_URL=redis://redis:6379 \
  -e BOT_MODE=polling \
  your-image-name
```

## Code Style

This project uses [Biome](https://biomejs.dev/) for linting and formatting, enforced via a Husky pre-commit hook.

- **Indent:** 2 spaces
- **Quotes:** Single quotes
- **Semicolons:** Always
- **Trailing commas:** Always
- **Line width:** 100 characters
- **Module system:** ESM-only (`"type": "module"`) — always include `.js` extension in imports
- **Path alias:** `#root/*` maps to `src/*` (e.g., `import { env } from '#root/config/env.js'`)
- **TypeScript:** Strict mode (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`)
- **Commits:** Conventional format — `feat:`, `fix:`, `refactor:`, `docs:`, etc.
- **Logging:** Use `createLogger('ModuleName')` for per-module child loggers

```bash
# Check and auto-fix
npm run check

# Lint only
npm run lint

# Type check
npm run typecheck
```

## License

[MIT](LICENSE)
