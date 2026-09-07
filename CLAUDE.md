# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Production-ready Telegram bot framework built with grammY, TypeScript, PostgreSQL, Redis, and BullMQ. Supports dual-mode startup: long-polling (development) or webhook via Fastify (production).

## Commands

```bash
npm run dev              # Start bot in polling mode with hot-reload (tsx watch)
npm run build            # Compile TypeScript to dist/
npm start                # Run compiled production build
npm run lint             # Run Biome linter
npm run lint:fix         # Auto-fix lint issues
npm run check            # Lint + format in one pass (also runs on pre-commit via lint-staged)
npm run typecheck        # TypeScript type checking (tsc --noEmit)
npm test                 # Run all tests (vitest run)
npm run test:watch       # Run tests in watch mode
npx vitest run src/path/to/file.test.ts  # Run a single test file
npm run db:push          # Sync Drizzle schema directly to DB (dev)
npm run db:generate      # Generate Drizzle migration files (prod)
npm run db:migrate       # Apply pending migrations (prod)
npm run db:studio        # Open Drizzle Studio GUI
npm run db:seed          # Seed development data
npm run webhook:set      # Register webhook URL with Telegram
```

## Architecture

### Startup Flow

`src/main.ts` bootstraps: validate env (Zod) → ensure database exists & sync schema (drizzle-kit push) → init bot → start in polling or webhook mode. Graceful shutdown tears down: bot → BullMQ workers → Redis → PostgreSQL.

### Middleware Pipeline (order matters!)

Defined in `src/bot/bot.ts`. The pipeline runs in this exact order:
1. **Rate Limiter** — drops spammy users early
2. **Logger** — records user interaction details
3. **Session** — loads Redis-backed multi-key session data
4. **i18n** — sets up translation context (`ctx.t()`)
5. **Conversations** — enables multi-step conversation state machine
6. **Auto-Upsert** — captures user/chat data to PostgreSQL (Redis-debounced, 5 min TTL; `/start` bypasses cache)
7. **Features** — command handlers & business logic

### Key Layers

- **Config** (`src/config/env.ts`): Zod-validated env vars. All env vars must be declared in the schema. Import `env` from `#root/config/env.js`.
- **Database** (`src/database/`): Drizzle ORM over postgres.js. Schema files in `src/database/schema/`. Auto-creates DB and syncs schema on startup.
- **Cache** (`src/cache/`): ioredis client for session storage, debounce flags, and cache-first lookups. BullMQ uses its own separate connection (`src/queue/connection.ts`) because it requires `maxRetriesPerRequest: null`.
- **Services** (`src/services/`): Business logic with cache-first pattern (check Redis → query PostgreSQL → populate cache).
- **Queue** (`src/queue/`): BullMQ queues and workers for broadcast and notification background jobs.
- **Server** (`src/server/webhook.ts`): Fastify webhook server with Telegram IP allowlist validation, health (`/health`) and liveness (`/livez`) endpoints.

### Context Types

Two context types in `src/bot/context.ts`:
- `BotContext` — outer middleware tree context (includes `ConversationFlavor`)
- `BotConversationContext` — inner context used inside conversation builders (no nesting)

Session uses multi-key strategy: `ctx.session.custom` (app data) and `ctx.session.conversation` (plugin-managed).

### i18n

Uses Project Fluent (`.ftl` files) in `locales/` directory. Currently supports `en` and `fa`. Locale negotiation reads from session first, then falls back to Telegram's `language_code`.

### Error Handling

Custom error hierarchy in `src/utils/errors.ts`: `AppError` → `DatabaseError`, `CacheError`, `BotError`. Global error handler (`bot.catch()`) logs with Pino and sends Telegram alerts to `ADMIN_CHAT_ID`.

## Adding New Features

1. Create directory under `src/bot/features/your-feature/`
2. Export a `Composer<BotContext>` from the command file
3. Register it in `src/bot/features/index.ts`
4. Add translations to `locales/en.ftl` and `locales/fa.ftl`

## Adding New Middleware

1. Create file in `src/bot/middlewares/`
2. Export from `src/bot/middlewares/index.ts`
3. Wire it in `src/bot/bot.ts` — **order matters**

## Database Changes

1. Modify/add schema files in `src/database/schema/`
2. Update relations in `src/database/schema/relations.ts`
3. Update barrel export in `src/database/schema/index.ts`
4. Dev: `npm run db:push` | Prod: `npm run db:generate` then `npm run db:migrate`

## Code Style

- **Biome** for linting and formatting (enforced via Husky pre-commit hook)
- 2-space indent, single quotes, trailing commas, semicolons always, 100-char line width
- Strict TypeScript (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`)
- Path alias: `#root/*` maps to `src/*` — use for all imports (e.g., `import { env } from '#root/config/env.js'`)
- ESM-only (`"type": "module"`) — always include `.js` extension in relative imports
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, etc.
- Use `createLogger('ModuleName')` for per-module child loggers

## Prerequisites

- Node.js >= 20
- PostgreSQL >= 14
- Redis >= 6
- Bot token from @BotFather

## Testing

Tests use Vitest with `globals: true`. Test files live alongside source (`*.test.ts`) or in `tests/`. Path alias `#root` is configured in `vitest.config.ts`. Test timeout is 10 seconds for integration tests.
