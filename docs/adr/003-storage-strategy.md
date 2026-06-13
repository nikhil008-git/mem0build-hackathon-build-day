# ADR-003: Storage Strategy

**Status:** Accepted
**Date:** 2026-06-13

## Context

Rift stores diverse data types: relational metadata, time-series metrics, large text payloads (LLM prompts/completions), and infrequent blob access (replay snapshots). No single database handles all of this well.

## Decision

Use a **polyglot persistence** strategy with four storage systems:

| Store | Technology | Data |
|-------|-----------|------|
| Relational | PostgreSQL (existing) | Users, orgs, projects, runs, spans, failures, remediations |
| Time-series | ClickHouse | Latency histograms, cost rollups, event counts |
| Object storage | S3 / MinIO | Large event payloads, replay snapshots |
| Cache/Queue | Redis | Event queue, rate limiting, real-time counters |

## Data Placement Rules

| Data | Store | Reason |
|------|-------|--------|
| Run status, duration, cost | PostgreSQL | Relational queries, joins with failures |
| Span tree | PostgreSQL | Parent-child relationships |
| Event metadata (id, type, timestamp) | PostgreSQL | Indexed lookups by run/span |
| Event payloads > 64KB | S3 | Cost-effective for large text blobs |
| P50/P95/P99 latency | ClickHouse | Fast percentile aggregation |
| Daily cost rollups | ClickHouse | Time-series aggregation |
| Event count per minute | ClickHouse | Dashboard sparklines |
| Replay snapshots | S3 | Infrequent access, large JSON |
| API key validation cache | Redis | Sub-ms lookups |
| Event queue | Redis Streams | At-least-once delivery |

## ClickHouse Schema (Planned)

```sql
CREATE TABLE latency_metrics (
  project_id String,
  run_id String,
  span_type String,
  duration_ms Float64,
  timestamp DateTime64(3)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (project_id, timestamp);

CREATE TABLE cost_metrics (
  project_id String,
  run_id String,
  model String,
  cost_usd Float64,
  prompt_tokens UInt32,
  completion_tokens UInt32,
  timestamp DateTime64(3)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (project_id, timestamp);
```

## Local Development

For local dev, use Docker Compose:

```yaml
services:
  postgres:    # existing
  clickhouse:  # analytics
  minio:       # S3-compatible object storage
  redis:       # queue + cache
```

## Rationale

- PostgreSQL is already set up (Prisma + Better Auth) — extend, don't replace
- ClickHouse excels at time-series aggregation (10–100x faster than PostgreSQL for percentile queries)
- S3 is cheapest for large, infrequently accessed blobs
- Redis serves dual purpose (queue + cache) reducing infrastructure count

## Consequences

- Worker must write to multiple stores (complexity in store stage)
- Local dev requires 4 services (Docker Compose mitigates)
- ClickHouse adds operational overhead (managed service recommended for production)
- Query API may need to fan out to multiple stores for run detail view

## Alternatives Considered

| Alternative | Why Rejected |
|------------|--------------|
| PostgreSQL only | Poor percentile query performance at scale; expensive for large payloads |
| TimescaleDB | Good but less proven for our aggregation patterns; ClickHouse is faster |
| Elasticsearch | Over-engineered; designed for log search, not structured agent telemetry |
| DynamoDB | Poor fit for relational data and time-series aggregation |
