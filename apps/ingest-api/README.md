# ingest-api

> **Status:** Planned (Phase 1) — no code yet.

High-throughput telemetry ingestion service. Receives batched events from Rift SDKs, validates against REP schemas, and enqueues to Redis Streams.

## Responsibilities

- Authenticate SDK requests (API key)
- Validate event schema (Zod)
- Rate limit per project
- Enqueue to Redis Streams
- Return `202 Accepted` immediately

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/events` | Ingest event batch |
| `POST` | `/v1/events/validate` | Validate without persisting |
| `GET` | `/health` | Health check |

## Documentation

- [Ingestion Pipeline](../../docs/platform/ingestion.md)
- [Event Schema](../../docs/architecture/event-schema.md)

## Dependencies

- `@rift/observability-types` — event validation schemas
- Redis — event queue

## Port

`8081` (local development)
