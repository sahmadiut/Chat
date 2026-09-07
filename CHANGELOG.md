# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-14

### Added

- **Bot Core**: grammY bot with dual-mode startup (polling/webhook)
- **Database**: PostgreSQL with Drizzle ORM, auto-setup, relational queries
- **Cache**: Redis-backed sessions, cache-first lookups, upsert debouncing
- **Queue**: BullMQ broadcast and notification workers with rate limiting
- **i18n**: English and Persian translations via Project Fluent
- **Conversations**: Multi-step form wizard support
- **Services**: UserService, ChatService, MessageService with pagination & stats
- **Admin**: Multi-admin support, guard middleware
- **Logging**: Pino with daily log rotation, database-backed message logging
- **Error Handling**: Custom error hierarchy with Telegram admin alerts
- **Security**: Input sanitization, rate limiting, webhook IP validation
- **Monitoring**: Health/metrics endpoints, startup self-check, BullMQ dashboard
- **Admin Commands**: /broadcast, /stats, /user, /block, /export, /status, /announce
- **Menu System**: Dynamic inline keyboard builder with pagination
- **Media**: File download/upload helpers with MIME type validation
- **Notification System**: Scheduled notifications with templates
- **Documentation**: README, CONTRIBUTING guide, architecture overview
- **CI/CD**: GitHub Actions (lint, typecheck, build) on Node 20/22
- **Deployment**: Dockerfile, docker-compose, PM2 ecosystem config
