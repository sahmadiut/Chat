# Comprehensive Production-Ready Telegram Bot Core

Build a highly scalable, enterprise-grade Telegram bot starter using grammY, TypeScript, PostgreSQL, Redis, and BullMQ — running directly on Node.js without Docker.

## User Review Required

> [!IMPORTANT]
> **PostgreSQL driver choice:** The plan uses the `postgres` (postgres.js) driver — a modern, zero-dependency, pure-JS client. An alternative is `pg` (node-postgres). Postgres.js is faster and has first-class Drizzle support. Confirm this is acceptable.

> [!IMPORTANT]
> **Biome vs ESLint+Prettier:** The plan uses **Biome** as specified (Rust-based, single tool for lint+format). Husky + lint-staged will still be wired for pre-commit hooks. Confirm Biome is your preference.

> [!WARNING]
> **Node.js version requirement:** The plan targets Node.js ≥ 20 (LTS) for native ESM support, `node:` protocol imports, and modern TypeScript features. Confirm your Node version.

## Open Questions

1. **Session data shape:** Should the initial session contain any custom fields beyond the i18n locale, or should it start empty (`{}`)?
2. **Admin notification:** For the global error handler, should admin alerts be sent via Telegram message to a specific chat ID (defined in `.env`), or is logging sufficient for now?
3. **Queue jobs scope:** Beyond broadcast messaging, are there any other background job types you want scaffolded (e.g., scheduled cleanup, analytics aggregation)?
4. **Database migrations strategy:** Should the project use `drizzle-kit push` (direct schema sync) for dev and `drizzle-kit generate` + `drizzle-kit migrate` for production, or a single approach?

---

## Proposed Changes

The project will be scaffolded from scratch at `d:\Projects\tel-bot` with the following structure and implementation details.

### Phase 1 — Project Scaffolding & Configuration

#### [NEW] [package.json](file:///d:/Projects/tel-bot/package.json)
- `type: "module"` for native ESM
- All runtime dependencies: `grammy`, `@grammyjs/runner`, `@grammyjs/conversations`, `@grammyjs/i18n`, `@grammyjs/auto-retry`, `@grammyjs/storage-redis`, `@grammyjs/ratelimiter`, `drizzle-orm`, `postgres`, `ioredis`, `bullmq`, `pino`, `pino-pretty`, `zod`, `dotenv`
- Dev dependencies: `typescript`, `tsx`, `drizzle-kit`, `@biomejs/biome`, `husky`, `lint-staged`, `@types/node`
- Scripts: `dev`, `build`, `start`, `lint`, `lint:fix`, `format`, `check`, `db:generate`, `db:push`, `db:studio`, `db:migrate`, `prepare` (husky)

#### [NEW] [tsconfig.json](file:///d:/Projects/tel-bot/tsconfig.json)
- `strict: true`, `target: "ESNext"`, `module: "NodeNext"`, `moduleResolution: "NodeNext"`
- Path aliases: `@/*` → `./src/*`
- `outDir: "./dist"`, `rootDir: "./src"`

#### [NEW] [biome.json](file:///d:/Projects/tel-bot/biome.json)
- Formatter: 2-space indent, single quotes, trailing commas, 100 line width
- Linter: recommended rules enabled
- Organize imports enabled
- Ignore: `dist/`, `node_modules/`, `drizzle/`

#### [NEW] [.env.example](file:///d:/Projects/tel-bot/.env.example)
- All required env vars with placeholder values and comments

#### [NEW] [.gitignore](file:///d:/Projects/tel-bot/.gitignore)
- Standard Node.js ignores + `dist/`, `.env`, `drizzle/`

#### [NEW] [.husky/pre-commit](file:///d:/Projects/tel-bot/.husky/pre-commit)
- Runs `npx lint-staged` on pre-commit

---

### Phase 2 — Config & Utilities

#### [NEW] [src/config/env.ts](file:///d:/Projects/tel-bot/src/config/env.ts)
- Zod schema validating all environment variables with strict types
- `BOT_TOKEN`, `DATABASE_URL`, `REDIS_URL`, `NODE_ENV`, `LOG_LEVEL`, `ADMIN_CHAT_ID`
- Fail-fast: process exits with descriptive error if validation fails
- Exports a frozen, typed `env` object

#### [NEW] [src/utils/logger.ts](file:///d:/Projects/tel-bot/src/utils/logger.ts)
- Pino logger with `pino-pretty` transport in development
- JSON output in production
- Log level driven by `env.LOG_LEVEL`
- Child logger factory for named modules

#### [NEW] [src/utils/errors.ts](file:///d:/Projects/tel-bot/src/utils/errors.ts)
- `AppError` base class with `statusCode`, `isOperational` flag
- `DatabaseError`, `CacheError`, `BotError` subclasses
- `handleGlobalError(err, ctx?)` function for centralized error processing

---

### Phase 3 — Database Layer (Drizzle + PostgreSQL)

#### [NEW] [drizzle.config.ts](file:///d:/Projects/tel-bot/drizzle.config.ts)
- `defineConfig` pointing to `src/database/schema/` directory
- Dialect: `postgresql`, credentials from `DATABASE_URL`
- Output: `./drizzle` for migration files

#### [NEW] [src/database/schema/users.ts](file:///d:/Projects/tel-bot/src/database/schema/users.ts)
- `users` table: `telegramId` (bigint, PK), `firstName`, `lastName`, `username`, `languageCode`, `isBot`, `isPremium`, `isBlocked`
- Timestamps: `createdAt`, `updatedAt`
- Indexes on `username`, `createdAt`
- Exported inferred types: `User`, `NewUser`

#### [NEW] [src/database/schema/chats.ts](file:///d:/Projects/tel-bot/src/database/schema/chats.ts)
- `chats` table: `telegramId` (bigint, PK), `type` (enum: private/group/supergroup/channel), `title`, `username`
- Timestamps: `createdAt`, `updatedAt`
- Index on `type`
- Exported inferred types: `Chat`, `NewChat`

#### [NEW] [src/database/schema/index.ts](file:///d:/Projects/tel-bot/src/database/schema/index.ts)
- Barrel export of all schemas

#### [NEW] [src/database/index.ts](file:///d:/Projects/tel-bot/src/database/index.ts)
- Creates `postgres` client from `DATABASE_URL`
- Initializes Drizzle instance with all schemas
- Exports `db` instance and `closeDatabase()` for graceful shutdown

---

### Phase 4 — Cache Layer (Redis)

#### [NEW] [src/cache/index.ts](file:///d:/Projects/tel-bot/src/cache/index.ts)
- Creates `ioredis` client from `REDIS_URL`
- Connection event handlers (connect, error, reconnecting)
- Exports `redis` instance and `closeRedis()` for graceful shutdown

#### [NEW] [src/cache/utils.ts](file:///d:/Projects/tel-bot/src/cache/utils.ts)
- Generic `cacheGet<T>(key)`, `cacheSet(key, value, ttl)`, `cacheDel(key)` helpers
- JSON serialization/deserialization
- Key prefixing strategy: `bot:users:{id}`, `bot:chats:{id}`

---

### Phase 5 — Services Layer

#### [NEW] [src/services/user.service.ts](file:///d:/Projects/tel-bot/src/services/user.service.ts)
- `UserService.upsert(telegramUser)` — upserts user to DB, invalidates cache
- `UserService.findByTelegramId(id)` — cache-first lookup
- `UserService.blockUser(id)` / `unblockUser(id)`

#### [NEW] [src/services/chat.service.ts](file:///d:/Projects/tel-bot/src/services/chat.service.ts)
- `ChatService.upsert(telegramChat)` — upserts chat to DB, invalidates cache
- `ChatService.findByTelegramId(id)` — cache-first lookup

---

### Phase 6 — BullMQ Queue System

#### [NEW] [src/queue/connection.ts](file:///d:/Projects/tel-bot/src/queue/connection.ts)
- Shared IORedis connection config for BullMQ (`maxRetriesPerRequest: null`)

#### [NEW] [src/queue/queues.ts](file:///d:/Projects/tel-bot/src/queue/queues.ts)
- `broadcastQueue` — for mass messaging jobs
- `notificationQueue` — for admin alerts

#### [NEW] [src/queue/workers/broadcast.worker.ts](file:///d:/Projects/tel-bot/src/queue/workers/broadcast.worker.ts)
- Processes broadcast jobs with rate limiting
- Handles Telegram API 429 errors with exponential backoff
- Reports progress back to the queue

#### [NEW] [src/queue/workers/notification.worker.ts](file:///d:/Projects/tel-bot/src/queue/workers/notification.worker.ts)
- Sends admin notification messages via Telegram API

#### [NEW] [src/queue/index.ts](file:///d:/Projects/tel-bot/src/queue/index.ts)
- Barrel exports + `closeQueues()` for graceful shutdown (closes all workers and queues)

---

### Phase 7 — Bot Core (grammY)

#### [NEW] [src/bot/context.ts](file:///d:/Projects/tel-bot/src/bot/context.ts)
- Custom `BotContext` type composing:
  - `Context`
  - `ConversationFlavor`
  - `I18nFlavor`
  - `SessionFlavor<SessionData>`
- `SessionData` interface definition

#### [NEW] [src/bot/i18n/i18n.ts](file:///d:/Projects/tel-bot/src/bot/i18n/i18n.ts)
- `I18n` instance configured with `defaultLocale: "en"` and `directory: "locales"`

#### [NEW] [src/bot/middlewares/session.middleware.ts](file:///d:/Projects/tel-bot/src/bot/middlewares/session.middleware.ts)
- Session middleware using `RedisAdapter` from `@grammyjs/storage-redis`
- Multi-key session strategy (conversation data stored separately)

#### [NEW] [src/bot/middlewares/upsert.middleware.ts](file:///d:/Projects/tel-bot/src/bot/middlewares/upsert.middleware.ts)
**The Smart Auto-Upsert Middleware — core innovation:**
1. On every update, extract `from` (User) and `chat` (Chat) from context
2. Check Redis for a recently-cached version (key: `bot:upsert:user:{id}`, TTL: 5 min)
3. If cache HIT → skip DB write, call `next()`
4. If cache MISS → upsert user/chat into PostgreSQL, set Redis cache, call `next()`
5. Uses `onConflictDoUpdate` (Drizzle) for atomic upserts
6. Non-blocking: errors in upsert don't crash the update pipeline

#### [NEW] [src/bot/middlewares/ratelimit.middleware.ts](file:///d:/Projects/tel-bot/src/bot/middlewares/ratelimit.middleware.ts)
- Configures `@grammyjs/ratelimiter` with sensible defaults (3 msgs / 2s)

#### [NEW] [src/bot/middlewares/index.ts](file:///d:/Projects/tel-bot/src/bot/middlewares/index.ts)
- Barrel export

#### [NEW] [src/bot/filters/admin.filter.ts](file:///d:/Projects/tel-bot/src/bot/filters/admin.filter.ts)
- Guard middleware checking if user is in admin list

#### [NEW] [src/bot/conversations/example.conversation.ts](file:///d:/Projects/tel-bot/src/bot/conversations/example.conversation.ts)
- Skeleton conversation demonstrating multi-step form pattern

#### [NEW] [src/bot/features/start/start.command.ts](file:///d:/Projects/tel-bot/src/bot/features/start/start.command.ts)
- `/start` command handler using i18n for welcome message
- Sets bot commands menu

#### [NEW] [src/bot/features/start/start.keyboard.ts](file:///d:/Projects/tel-bot/src/bot/features/start/start.keyboard.ts)
- Inline keyboard for the start feature

#### [NEW] [src/bot/features/settings/settings.command.ts](file:///d:/Projects/tel-bot/src/bot/features/settings/settings.command.ts)
- `/settings` command with language selection keyboard

#### [NEW] [src/bot/features/settings/settings.keyboard.ts](file:///d:/Projects/tel-bot/src/bot/features/settings/settings.keyboard.ts)
- Language picker inline keyboard + callback handler

#### [NEW] [src/bot/features/index.ts](file:///d:/Projects/tel-bot/src/bot/features/index.ts)
- Registers all features onto the bot via `Composer`

#### [NEW] [src/bot/bot.ts](file:///d:/Projects/tel-bot/src/bot/bot.ts)
**Bot instance initialization & full plugin wiring:**
1. Create `Bot<BotContext>` with token from env
2. Install API-level plugins: `autoRetry()`
3. Install middleware in correct order:
   - Rate limiter
   - Session (Redis-backed)
   - i18n
   - Conversations plugin
   - Auto-upsert middleware
   - Feature composers
4. Set `bot.catch()` for global error handling
5. Export `bot` instance and `createBotRunner()` function

---

### Phase 8 — i18n Locale Files

#### [NEW] [locales/en.ftl](file:///d:/Projects/tel-bot/locales/en.ftl)
- English translations: `welcome`, `settings-title`, `settings-language`, `error-generic`

#### [NEW] [locales/fa.ftl](file:///d:/Projects/tel-bot/locales/fa.ftl)
- Persian/Farsi translations (same keys)

---

### Phase 9 — Application Bootstrap

#### [NEW] [src/main.ts](file:///d:/Projects/tel-bot/src/main.ts)
**The orchestration entry point:**
1. Load and validate environment (fail-fast)
2. Initialize database connection
3. Initialize Redis connection
4. Initialize BullMQ workers
5. Create and start the bot runner (`@grammyjs/runner`)
6. Register graceful shutdown handlers for `SIGINT` and `SIGTERM`:
   - Stop the bot runner
   - Close BullMQ workers (wait for active jobs)
   - Close Redis connection
   - Close database connection
   - Exit process
7. Log startup confirmation

---

### Phase 10 — CI/CD & Developer Experience

#### [NEW] [.github/workflows/ci.yml](file:///d:/Projects/tel-bot/.github/workflows/ci.yml)
- Trigger: push to `main`, pull requests
- Jobs: lint (biome check), type-check (tsc --noEmit), build

#### [NEW] [.vscode/settings.json](file:///d:/Projects/tel-bot/.vscode/settings.json)
- Biome as default formatter, format on save

---

## Complete File List (32 files)

| # | File | Phase |
|---|------|-------|
| 1 | `package.json` | 1 |
| 2 | `tsconfig.json` | 1 |
| 3 | `biome.json` | 1 |
| 4 | `.env.example` | 1 |
| 5 | `.gitignore` | 1 |
| 6 | `.husky/pre-commit` | 1 |
| 7 | `src/config/env.ts` | 2 |
| 8 | `src/utils/logger.ts` | 2 |
| 9 | `src/utils/errors.ts` | 2 |
| 10 | `drizzle.config.ts` | 3 |
| 11 | `src/database/schema/users.ts` | 3 |
| 12 | `src/database/schema/chats.ts` | 3 |
| 13 | `src/database/schema/index.ts` | 3 |
| 14 | `src/database/index.ts` | 3 |
| 15 | `src/cache/index.ts` | 4 |
| 16 | `src/cache/utils.ts` | 4 |
| 17 | `src/services/user.service.ts` | 5 |
| 18 | `src/services/chat.service.ts` | 5 |
| 19 | `src/queue/connection.ts` | 6 |
| 20 | `src/queue/queues.ts` | 6 |
| 21 | `src/queue/workers/broadcast.worker.ts` | 6 |
| 22 | `src/queue/workers/notification.worker.ts` | 6 |
| 23 | `src/queue/index.ts` | 6 |
| 24 | `src/bot/context.ts` | 7 |
| 25 | `src/bot/i18n/i18n.ts` | 7 |
| 26 | `src/bot/middlewares/session.middleware.ts` | 7 |
| 27 | `src/bot/middlewares/upsert.middleware.ts` | 7 |
| 28 | `src/bot/middlewares/ratelimit.middleware.ts` | 7 |
| 29 | `src/bot/middlewares/index.ts` | 7 |
| 30 | `src/bot/filters/admin.filter.ts` | 7 |
| 31 | `src/bot/conversations/example.conversation.ts` | 7 |
| 32 | `src/bot/features/start/start.command.ts` | 7 |
| 33 | `src/bot/features/start/start.keyboard.ts` | 7 |
| 34 | `src/bot/features/settings/settings.command.ts` | 7 |
| 35 | `src/bot/features/settings/settings.keyboard.ts` | 7 |
| 36 | `src/bot/features/index.ts` | 7 |
| 37 | `src/bot/bot.ts` | 7 |
| 38 | `locales/en.ftl` | 8 |
| 39 | `locales/fa.ftl` | 8 |
| 40 | `src/main.ts` | 9 |
| 41 | `.github/workflows/ci.yml` | 10 |
| 42 | `.vscode/settings.json` | 10 |

---

## Verification Plan

### Automated Checks
```bash
# Type-check the entire project (no emit)
npx tsc --noEmit

# Lint & format check
npx @biomejs/biome check .

# Build the project
npm run build
```

### Manual Verification
1. Confirm `npm install` completes without errors
2. Confirm `npx tsc --noEmit` passes with zero type errors
3. Confirm `npx @biomejs/biome check .` passes
4. Confirm `npm run build` produces correct output in `dist/`
5. Visually inspect the folder structure matches the blueprint
