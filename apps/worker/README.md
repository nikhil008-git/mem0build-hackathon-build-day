# worker

> **Status:** Planned (Phase 1) — no code yet.

Background event processing pipeline. Consumes events from Redis Streams, normalizes, enriches, and stores them in PostgreSQL, ClickHouse, and S3.

## Pipeline Stages

1. **Dequeue** — read batch from Redis Streams
2. **Normalize** — ensure REP compliance
3. **Enrich** — calculate cost, duration, link spans
4. **Store** — write to PostgreSQL + ClickHouse + S3
5. **Aggregate** — update run-level rollups
6. **Alert** — check failure thresholds

## Documentation

- [Ingestion Pipeline](../../docs/platform/ingestion.md)
- [Data Model](../../docs/architecture/data-model.md)
- [ADR-003: Storage Strategy](../../docs/adr/003-storage-strategy.md)

## Dependencies

- `@rift/observability-types` — event types
- `@rift/cost-calculator` — token cost calculation
- `@repo/db` — PostgreSQL via Prisma
- Redis — event queue consumer
- ClickHouse — time-series metrics
- S3/MinIO — large payload storage
