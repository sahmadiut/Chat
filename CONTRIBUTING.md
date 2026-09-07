# Contributing

Thank you for your interest in contributing to this project!

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure
4. Start the dev server: `npm run dev`

## Code Style

This project uses [Biome](https://biomejs.dev/) for linting and formatting:

```bash
npm run check       # Lint + format
npm run lint:fix     # Auto-fix lint issues
npm run format       # Format all files
```

Biome is enforced via a pre-commit hook (Husky + lint-staged).

## TypeScript

- Strict mode is enabled
- Always run `npm run typecheck` before committing
- Use the `#root/*` path alias for imports (maps to `src/*`)

## Commit Messages

Use conventional commit format:

```
feat: add user search by username
fix: handle null last_name in upsert
refactor: extract session key generator
docs: update environment variables table
```

## Project Structure

- **`src/bot/features/`** — Each feature gets its own directory with command handler + keyboard
- **`src/bot/middlewares/`** — Global middleware pipeline (order matters!)
- **`src/services/`** — Business logic layer (cache-first pattern)
- **`src/database/schema/`** — Drizzle table definitions + relations
- **`src/queue/workers/`** — Background job processors

## Adding a New Feature

1. Create a directory under `src/bot/features/your-feature/`
2. Export a `Composer<BotContext>` from the command file
3. Register it in `src/bot/features/index.ts`
4. Add translations to `locales/en.ftl` and `locales/fa.ftl`

## Adding a New Middleware

1. Create the file in `src/bot/middlewares/`
2. Export it from `src/bot/middlewares/index.ts`
3. Wire it in `src/bot/bot.ts` (order matters!)

## Database Changes

1. Modify schema files in `src/database/schema/`
2. Update relations in `src/database/schema/relations.ts`
3. Update the barrel export in `src/database/schema/index.ts`
4. Run `npm run db:push` (dev) or `npm run db:generate` + `npm run db:migrate` (prod)
