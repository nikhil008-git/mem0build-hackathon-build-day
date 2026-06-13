# Ingestion Pipeline

The ingestion pipeline is the write path of the platform. It receives telemetry from SDKs, validates it, queues it, and processes it into queryable storage.

## Pipeline Overview

```
SDK Batch ──▶ Ingest API ──▶ Queue ──▶ Worker ──▶ Storage
                (validate)    (buffer)   (process)   (persist)
```

## Ingest API (`apps/ingest-api`)

### Responsibilities

- Authenticate SDK requests (API key)
- Validate event schema (Zod)
- Rate limit per project
- Enqueue to Redis Streams
- Return `202 Accepted` immediately

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/events` | Ingest event batch |
| `POST` | `/v1/events/validate` | Validate without persisting (dev) |
| `GET` | `/health` | Health check |
| `GET` | `/v1/projects/:id/usage` | Ingestion stats for project |

### Rate Limits

| Tier | Events/min | Batch size |
|------|-----------|------------|
| Free | 1,000 | 50 |
| Pro | 100,000 | 100 |
| Enterprise | Custom | 100 |

Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

### Validation Rules

1. `version` must be a supported REP version
2. `projectId` must match the API key's project
3. `runId` must be present on all events
4. `timestamp` must be within ±5 minutes of server time
5. Inline payloads must not exceed size limits (see [Event Schema](../architecture/event-schema.md))
6. `type` must be a known event type
7. Duplicate `id` within a batch is rejected

### Error Responses

| Status | Meaning |
|--------|---------|
| `202` | Batch accepted |
| `400` | Validation error (details in body) |
| `401` | Invalid or missing API key |
| `413` | Batch too large |
| `429` | Rate limited |
| `503` | Queue full (SDK should retry) |

## Event Queue

**Technology:** Redis Streams (Phase 1). Migrate to SQS/Kafka if volume requires.

```
Stream: rift:events:{project_id}
Consumer Group: rift-worker
```

**Why Redis Streams:**
- Already needed for rate limiting and real-time counters
- Sufficient for Phase 1 volume (< 10M events/day)
- Simple ops — no additional infrastructure
- Consumer groups provide at-least-once delivery

### Message Format

```typescript
interface QueuedEvent {
  receivedAt: string;        // server timestamp
  raw: EventEnvelope;        // original event from SDK
}
```

## Worker (`apps/worker`)

### Processing Pipeline

```
┌─────────────┐
│   Dequeue   │  Read batch of 100 from Redis Stream
└──────┬──────┘
       ▼
┌─────────────┐
│  Normalize  │  Ensure REP compliance, fill defaults
└──────┬──────┘
       ▼
┌─────────────┐
│   Enrich    │  Calculate cost, duration, link spans
└──────┬──────┘
       ▼
┌─────────────┐
│   Store     │  Write to PostgreSQL + ClickHouse + S3
└──────┬──────┘
       ▼
┌─────────────┐
│  Aggregate  │  Update rollups (run status, cost totals)
└──────┬──────┘
       ▼
┌─────────────┐
│   Alert     │  Check failure thresholds, fire webhooks
└─────────────┘
```

### Normalize Stage

- Fill missing `spanId` on span events
- Convert timestamps to UTC
- Deduplicate by event `id` (idempotent processing)
- Reject events for unknown `projectId`

### Enrich Stage

| Enrichment | Source |
|------------|--------|
| Cost calculation | `@rift/cost-calculator` (model + token count → USD) |
| Span duration | `span.ended.timestamp - span.started.timestamp` |
| Run duration | `run.ended.timestamp - run.started.timestamp` |
| Parent span linking | `parentSpanId` → resolve span tree |
| Model metadata | Lookup model name, provider, pricing tier |

### Store Stage

| Data | Destination | Trigger |
|------|-------------|---------|
| Run metadata (on `run.started` / `run.ended`) | PostgreSQL | Upsert |
| Span metadata (on `span.started` / `span.ended`) | PostgreSQL | Insert |
| Event metadata | PostgreSQL | Insert |
| Large payloads (> size limit) | S3 | Upload, store ref |
| Latency data points | ClickHouse | Insert |
| Cost data points | ClickHouse | Insert |
| Event counts | ClickHouse | Insert |

### Aggregate Stage

Materialized on `run.ended`:

- Update run record with final status, duration, cost, token usage
- Increment project-level counters (total runs, failures today)
- Update failure fingerprint counts (if error)

### Alert Stage

Check project alert rules:

```typescript
interface AlertRule {
  id: string;
  projectId: string;
  type: 'failure_rate' | 'cost_budget' | 'latency_p99' | 'error_spike';
  threshold: number;
  windowMinutes: number;
  channels: ('email' | 'webhook' | 'slack')[];
  enabled: boolean;
}
```

## Large Payload Handling

```
SDK sends event with 200KB prompt
  → Ingest API: payload exceeds 64KB inline limit
  → Ingest API: uploads to S3, replaces inline with payloadRef
  → Worker: stores payloadRef in PostgreSQL event record
  → Query API: fetches from S3 on demand when dashboard requests it
```

S3 key pattern: `events/{project_id}/{year}/{month}/{event_id}.json`

## Monitoring the Pipeline

| Metric | Alert Threshold |
|--------|----------------|
| Ingest API p99 latency | > 200ms |
| Queue depth | > 10,000 messages |
| Worker lag | > 30 seconds |
| Event drop rate | > 0.1% |
| S3 upload failures | > 1% |

## Planned File Structure

```
apps/ingest-api/
├── README.md
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── events.ts         # POST /v1/events
│   │   └── health.ts
│   ├── middleware/
│   │   ├── auth.ts             # API key validation
│   │   ├── rate-limit.ts
│   │   └── validate.ts         # Zod schema validation
│   └── services/
│       ├── queue.ts            # Redis Streams producer
│       └── payload.ts          # S3 overflow handler
├── package.json
└── tsconfig.json

apps/worker/
├── README.md
├── src/
│   ├── index.ts
│   ├── consumer.ts             # Redis Streams consumer
│   ├── pipeline/
│   │   ├── normalize.ts
│   │   ├── enrich.ts
│   │   ├── store.ts
│   │   ├── aggregate.ts
│   │   └── alert.ts
│   └── services/
│       ├── postgres.ts
│       ├── clickhouse.ts
│       └── s3.ts
├── package.json
└── tsconfig.json
```
