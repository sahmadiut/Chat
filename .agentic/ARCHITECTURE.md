# Architecture

> `TASK-0001` must document the **as-is** architecture from repository evidence. `TASK-0002` may then document the target/gap architecture. Do not silently replace the current implementation with the PRD design.

## As-Is Architecture

**Status:** UNKNOWN — repository inspection pending.

### Entrypoints

- TBD

### Update Routing

- TBD

### Application / Domain Services

- TBD

### Persistence

- PostgreSQL: TBD
- Redis: TBD
- Queue/workers: TBD
- Object storage: TBD

### External Integrations

- Telegram Bot API: TBD
- Other services: TBD

### Deployment Topology

- TBD

## Target Architecture from PRD

```text
Telegram Bot API
        |
Bot Update Layer
        |
Command / Callback Router
        |
Application Services
        |
PostgreSQL + Redis + Queue + Optional Object Storage
```

Expected application services include User, Profile, Anonymous Inbox, Matchmaking, Chat Relay, Deletion, Coin, Referral, Moderation, Admin, Export, and Notification services.

## Architectural Invariants

See `PROJECT_CHARTER.md`. Any discovered implementation that violates those invariants must be recorded in `GAP_ANALYSIS.md` and `RISKS.md`.
