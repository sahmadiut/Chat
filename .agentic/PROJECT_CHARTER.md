# Project Charter

## Product

A Telegram-only product that combines two separate anonymous communication systems:

1. Personal anonymous messaging through user-specific deep links.
2. Anonymous matchmaking chat through a separate custom chat profile.

The backend internally knows Telegram identities where Telegram provides them, but other users must not receive those identities through anonymous product surfaces.

## Non-Negotiable Architecture Rules

1. **Telegram identity and custom matchmaking identity are separate models and separate projections.**
2. **Anonymous Link Mode must not show the destination user's matchmaking profile.**
3. **Every successful match creates a brand-new Chat Session.** An ended session is never reopened.
4. **Every live-chat message belongs to exactly one Chat Session.**
5. **Telegram sender-side and recipient-side message IDs must be mapped to the internal message/session.**
6. **Deleting Telegram-visible content does not delete the internal administrative archive.**
7. **Full chat deletion is scoped to one exact Chat Session, not to a user pair.**
8. **Protected Chat means Telegram content protection, not end-to-end encryption.**
9. **Exact location is private by default and is collected only through voluntary user action.**
10. **Last activity means activity inside this bot, not Telegram account last-seen.**
11. **Match creation, coin operations, referrals, critical update processing, and deletion requests must be concurrency-safe/idempotent.**
12. **All sensitive administrative actions must be authorized server-side and auditable.**

## Core Systems

- Internal Identity System
- Anonymous Inbox System
- Anonymous Matchmaking System
- Session-Based Chat System
- Coins / Rewards / Referrals
- Moderation / Anti-Abuse
- Administration / Archive / Export
- Operations / Security / Reliability

## Definition of Done

A task may be marked `DONE` only when its acceptance criteria are verified against code, tests, runtime behavior, migrations, or another concrete artifact. "Looks implemented" is not sufficient evidence.
