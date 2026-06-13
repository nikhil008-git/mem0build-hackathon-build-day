# System Design

## Service Map

```
apps/
├── frontend/          Dashboard UI (Next.js) — evolves from auth shell
├── api/               Query API — read path for dashboard
├── ingest-api/        Write path — receives SDK telemetry
├── worker/            Async processing — normalize, aggregate, alert
└── remediation/       Auto-fix agent — analyze, generate, PR

packages/
├── sdk-core/              Core client, span model, batching, replay client
├── sdk-vercel-ai/         Vercel AI SDK middleware/wrapper
├── sdk-openai/            OpenAI Agents / Assistants adapter
├── sdk-mastra/            Mastra instrumentation hooks
├── observability-types/   Shared TypeScript types + Zod schemas
├── replay/                Replay engine logic (sandbox orchestration)
├── remediation-core/      Fix analysis, diff generation, PR templates
├── cost-calculator/       Model pricing tables + token cost math
├── database/              Prisma schema (existing @repo/db)
└── ui/                    Shared dashboard components (existing)
```

## Component Responsibilities

### SDK Layer (`packages/sdk-*`)

| Package | Role |
|---------|------|
| `sdk-core` | `Rift` client, context propagation, span lifecycle, event batching, `replay()` API |
| `sdk-vercel-ai` | Wraps `streamText`, `generateText`, tool execution in Vercel AI SDK |
| `sdk-openai` | Hooks into OpenAI Agents SDK run loop and tool handlers |
| `sdk-mastra` | Mastra workflow/step instrumentation via middleware |

**Key interfaces (planned):**

```typescript
// sdk-core
interface RiftConfig {
  apiKey: string;
  projectId: string;
  endpoint?: string;       // default: https://ingest.rift.dev
  flushIntervalMs?: number; // default: 2000
  environment?: string;     // production | staging | development
}

interface Rift {
  startRun(opts: StartRunOptions): RunContext;
  replay(runId: string, opts?: ReplayOptions): Promise<ReplayResult>;
  flush(): Promise<void>;
  shutdown(): Promise<void>;
}

interface RunContext {
  span(name: string, type: SpanType): Span;
  end(status: RunStatus, error?: Error): void;
}
```

### Ingest API (`apps/ingest-api`)

High-throughput write endpoint. Accepts batched events from SDKs.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/events` | POST | Batch event ingestion (primary) |
| `/v1/events/validate` | POST | Schema validation (dev mode) |
| `/health` | GET | Health check |

**Characteristics:**
- Stateless, horizontally scalable
- Validates events against `@rift/observability-types` Zod schemas
- Writes raw events to a message queue (Redis Streams or SQS)
- Returns `202 Accepted` immediately — no blocking writes to analytics DB
- Auth: API key in `Authorization: Bearer rift_...`

### Worker (`apps/worker`)

Consumes events from the queue and materializes them into queryable storage.

**Processing stages:**

```
Raw Events → Normalize → Enrich → Store → Aggregate → Alert
```

| Stage | Actions |
|-------|---------|
| Normalize | Map framework-specific events to canonical REP format |
| Enrich | Attach cost (via `cost-calculator`), compute durations, link parent spans |
| Store | Write to PostgreSQL (metadata) + ClickHouse (time-series) + S3 (large payloads) |
| Aggregate | Roll up run-level metrics, failure counts, cost totals |
| Alert | Trigger webhooks / dashboard notifications on failure thresholds |

### Query API (`apps/api`)

Read path for the dashboard. Extends the existing Express API.

| Endpoint Group | Examples |
|----------------|----------|
| Runs | `GET /v1/runs`, `GET /v1/runs/:id`, `GET /v1/runs/:id/timeline` |
| Tool Calls | `GET /v1/runs/:id/tools` |
| Failures | `GET /v1/failures`, `GET /v1/failures/:id` |
| Reasoning | `GET /v1/runs/:id/reasoning` |
| Memory | `GET /v1/runs/:id/memory` |
| Cost | `GET /v1/projects/:id/cost`, `GET /v1/runs/:id/cost` |
| Latency | `GET /v1/projects/:id/latency` |
| Replay | `POST /v1/runs/:id/replay` |
| Remediation | `GET /v1/runs/:id/remediation`, `POST /v1/runs/:id/remediate` |

Auth: session-based (Better Auth, existing) + API key for programmatic access.

### Dashboard (`apps/frontend`)

Next.js app. The existing `/dashboard` route becomes the observability home.

**Planned views:**

| Route | View |
|-------|------|
| `/dashboard` | Overview — run count, failure rate, cost, latency sparklines |
| `/dashboard/runs` | Run list with filters (status, agent, date, cost) |
| `/dashboard/runs/[id]` | Run detail — timeline, reasoning chain, tool calls |
| `/dashboard/failures` | Failure inbox — grouped by error type |
| `/dashboard/failures/[id]` | Failure detail + replay button + remediation status |
| `/dashboard/cost` | Cost analytics — by model, agent, time period |
| `/dashboard/latency` | Latency percentiles — breakdown charts |
| `/dashboard/memory` | Memory access patterns |
| `/dashboard/settings` | API keys, GitHub connection, alert rules |

### Replay Engine (`packages/replay` + Query API endpoint)

Isolated re-execution of a stored run.

```
Dashboard "Replay" click
        │
        ▼
POST /v1/runs/:id/replay
        │
        ▼
Replay Orchestrator
  ├── Load run snapshot (inputs, tool schemas, model config, memory state)
  ├── Spin up sandbox (Docker container or serverless isolate)
  ├── Re-execute agent with same inputs
  ├── Optionally mock external tools (recorded responses)
  └── Compare output vs original → store ReplayResult
        │
        ▼
Dashboard shows side-by-side diff
```

### Remediation Service (`apps/remediation` + `packages/remediation-core`)

Closed-loop fix pipeline.

```
Failure detected
        │
        ▼
Remediation Agent (LLM)
  ├── Input: failure context, reasoning chain, tool outputs, source code (via GitHub)
  ├── Output: root cause analysis + code patch
        │
        ▼
PR Generator
  ├── Create branch: rift/fix/run_{id}
  ├── Apply patch
  ├── Open PR with context (failure link, replay link, suggested test)
        │
        ▼
GitHub Webhook → Worker
  ├── PR opened / CI passed / merged
  └── Update dashboard remediation status
        │
        ▼
Post-merge: trigger replay to verify fix
```

## Storage Architecture

| Store | Data | Why |
|-------|------|-----|
| **PostgreSQL** (`@repo/db`) | Users, orgs, projects, API keys, run metadata, remediation records, GitHub connections | Relational, ACID, existing infra |
| **ClickHouse** | Time-series: latency histograms, cost rollups, event counts | Fast aggregations over billions of events |
| **S3 / MinIO** | Large payloads: full LLM prompts/completions, tool I/O, reasoning chains | Cheap blob storage for replay |
| **Redis** | Event queue, real-time dashboard counters, rate limiting | Low-latency buffer |

See [ADR-003](../adr/003-storage-strategy.md) for the storage decision rationale.

## Authentication & Multi-Tenancy

```
Organization
  └── Project (maps to one agent app / API key)
        └── Runs, Failures, Remediations
```

- **SDK auth**: API key per project (`rift_live_...` / `rift_test_...`)
- **Dashboard auth**: Better Auth (existing) — user belongs to org(s)
- **GitHub auth**: OAuth app — scoped to repo access for PR creation
- **Data isolation**: All queries scoped by `project_id`; row-level security in PostgreSQL

## Deployment Topology (Target)

```
                    ┌─────────────┐
                    │   CDN / LB  │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │  frontend   │ │  ingest-api │ │     api     │
    │  (Vercel)   │ │  (Fly.io)   │ │  (Fly.io)   │
    └─────────────┘ └──────┬──────┘ └──────┬──────┘
                           │               │
                    ┌──────▼──────┐        │
                    │    Redis    │        │
                    │   (queue)   │        │
                    └──────┬──────┘        │
                           ▼               │
                    ┌─────────────┐        │
                    │   worker    │        │
                    │  (Fly.io)   │        │
                    └──────┬──────┘        │
                           │               │
              ┌────────────┼────────────┐   │
              ▼            ▼            ▼   ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Postgres │ │ClickHouse│ │   S3     │
        └──────────┘ └──────────┘ └──────────┘
```

## Inter-Service Communication

| From → To | Protocol | Pattern |
|-----------|----------|---------|
| SDK → Ingest API | HTTPS (REST) | Sync, batched, fire-and-forget |
| Ingest API → Worker | Redis Streams | Async, at-least-once delivery |
| Worker → Storage | Native drivers | Sync writes |
| Dashboard → Query API | HTTPS (REST) | Sync, paginated |
| Query API → Replay Engine | Internal call | Sync, long-running (up to 5 min) |
| Remediation → GitHub | GitHub REST API | Sync + webhook callbacks |
| GitHub → Worker | Webhook (HTTPS) | Async event-driven |
