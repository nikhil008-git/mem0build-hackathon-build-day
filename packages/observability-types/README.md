# @rift/observability-types

> **Status:** Planned (Phase 1) — no code yet.

Shared TypeScript types and Zod validation schemas for the Rift Event Protocol (REP). Single source of truth used by SDKs, ingest-api, worker, and query-api.

## Contents

| Module | Description |
|--------|-------------|
| `events/` | REP event envelope and payload schemas |
| `entities/` | Data model types (Run, Span, Failure, etc.) |
| `api/` | API request/response types |

## Documentation

- [Event Schema](../../docs/architecture/event-schema.md)
- [Data Model](../../docs/architecture/data-model.md)

## Used By

- `@rift/sdk-core` — event creation
- `apps/ingest-api` — event validation
- `apps/worker` — event processing
- `apps/api` — API response types
