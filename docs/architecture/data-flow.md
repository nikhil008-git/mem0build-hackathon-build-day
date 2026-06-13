# Data Flow

## 1. Telemetry Ingestion Flow

The primary path: agent executes → SDK captures → platform stores → dashboard displays.

```mermaid
sequenceDiagram
    participant Agent as Developer Agent
    participant SDK as @rift/sdk-*
    participant Ingest as ingest-api
    participant Queue as Redis Streams
    participant Worker as worker
    participant PG as PostgreSQL
    participant CH as ClickHouse
    participant S3 as Object Storage
    participant API as query-api
    participant UI as Dashboard

    Agent->>SDK: execute (LLM call, tool, memory)
    SDK->>SDK: create span, record event
    SDK->>SDK: batch events (2s window)
    SDK->>Ingest: POST /v1/events (batch)
    Ingest->>Ingest: validate schema, auth
    Ingest->>Queue: enqueue raw events
    Ingest-->>SDK: 202 Accepted

    Queue->>Worker: consume batch
    Worker->>Worker: normalize to REP
    Worker->>Worker: enrich (cost, duration, links)
    Worker->>PG: upsert run metadata
    Worker->>CH: insert time-series metrics
    Worker->>S3: store large payloads (if > 64KB)

    UI->>API: GET /v1/runs?project_id=...
    API->>PG: query run metadata
    API->>CH: query aggregates
    API-->>UI: paginated runs + metrics

    UI->>API: GET /v1/runs/:id/reasoning
    API->>S3: fetch reasoning chain blob
    API-->>UI: reasoning chain JSON
```

## 2. Failure Detection Flow

Failures are detected in the worker, not the SDK. The SDK reports terminal status; the worker classifies.

```
Run ends with status=error
        │
        ▼
Worker: classify failure
  ├── tool_error      — tool returned error or threw
  ├── llm_error       — model refused, rate limited, malformed output
  ├── timeout         — run exceeded max duration
  ├── validation      — output failed schema validation
  ├── memory_error    — memory store unreachable or empty results
  └── unknown         — unclassified
        │
        ▼
Worker: create Failure record
  ├── Link to run
  ├── Store error fingerprint (for grouping)
  ├── Compute severity (based on frequency + impact)
        │
        ▼
Worker: check alert rules
  ├── If threshold exceeded → webhook / email / dashboard notification
        │
        ▼
Dashboard: Failure appears in inbox
```

## 3. Replay Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant UI as Dashboard
    participant API as query-api
    participant Replay as replay engine
    participant Sandbox as Sandbox Container
    participant Store as Storage

    Dev->>UI: Click "Replay" on run_123
    UI->>API: POST /v1/runs/run_123/replay
    API->>Store: load run snapshot
    Store-->>API: inputs, config, tool schemas, recorded tool responses
    API->>Replay: start replay job
    Replay->>Sandbox: spin up isolated environment
    Sandbox->>Sandbox: re-execute agent with same inputs
    Note over Sandbox: External tools mocked with recorded responses
    Sandbox-->>Replay: new output + step-by-step trace
    Replay->>Replay: diff original vs replay
    Replay->>Store: save ReplayResult
    Replay-->>API: replay complete
    API-->>UI: side-by-side comparison
```

**Replay modes:**

| Mode | Description | Use Case |
|------|-------------|----------|
| `full` | Re-execute everything including live LLM calls | Non-deterministic debugging |
| `mock_tools` | Live LLM, mocked tool responses | Isolate tool vs LLM issues |
| `mock_all` | Mock LLM + tools with recorded responses | Deterministic verification |
| `step` | Pause after each step for inspection | Interactive debugging |

## 4. Auto-Remediation Flow

```mermaid
sequenceDiagram
    participant UI as Dashboard
    participant API as query-api
    participant Rem as remediation service
    participant LLM as Remediation Agent
    participant GH as GitHub
    participant Worker as worker

    UI->>API: POST /v1/runs/run_123/remediate
    API->>Rem: start remediation job
    Rem->>Rem: gather context (failure, reasoning, tools, stack trace)
    Rem->>GH: fetch relevant source files
    GH-->>Rem: file contents
    Rem->>LLM: analyze + generate fix
    LLM-->>Rem: root cause + code patch
    Rem->>GH: create branch rift/fix/run_123
    Rem->>GH: commit patch
    Rem->>GH: open PR with context
    GH-->>Rem: PR URL
    Rem->>API: store Remediation record (status: pr_opened)
    API-->>UI: show PR link + analysis

    GH->>Worker: webhook (PR merged)
    Worker->>Worker: update remediation status → merged
    Worker->>API: trigger post-merge replay
    API-->>UI: remediation verified ✓
```

## 5. Feedback Loop (Closed Loop)

The full cycle from failure to verified fix:

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Agent   │────▶│  Failure │────▶│  Replay  │────▶│  Analyze │
│  Runs    │     │ Detected │     │ Failure  │     │ Root Cause│
└──────────┘     └──────────┘     └──────────┘     └────┬─────┘
                                                         │
┌──────────┐     ┌──────────┐     ┌──────────┐          │
│ Dashboard│◀────│  Verify  │◀────│  GitHub  │◀─────────┘
│ Updated  │     │  Fix     │     │  PR      │    Generate Fix
└──────────┘     └──────────┘     └──────────┘
```

**Dashboard remediation states:**

| State | Meaning |
|-------|---------|
| `pending` | Remediation requested, not started |
| `analyzing` | Remediation agent examining failure |
| `fix_generated` | Code patch ready, PR not yet created |
| `pr_opened` | PR created on GitHub |
| `ci_running` | CI checks in progress |
| `ci_passed` | CI green |
| `ci_failed` | CI red — needs human review |
| `merged` | PR merged |
| `verified` | Post-merge replay succeeded |
| `failed` | Remediation could not produce a fix |

## 6. SDK Event Lifecycle

Within a single agent run, the SDK manages context and spans:

```
rift.startRun({ agent: 'support-bot', input: userMessage })
  │
  ├── span: llm_call (gpt-4o)
  │     ├── event: prompt_sent
  │     ├── event: completion_received
  │     └── event: tool_call_requested (search_docs)
  │
  ├── span: tool_call (search_docs)
  │     ├── event: tool_input
  │     ├── event: tool_output
  │     └── duration: 340ms
  │
  ├── span: memory_read (vector_store)
  │     ├── event: query
  │     ├── event: results (3 chunks)
  │     └── duration: 120ms
  │
  ├── span: llm_call (gpt-4o)  ← second turn
  │     ├── event: prompt_sent (with tool results)
  │     └── event: completion_received
  │
  └── run.end({ status: 'success', output: agentResponse })
        │
        └── SDK flushes all events to ingest-api
```

## 7. Real-Time Dashboard Updates

For the overview dashboard (failure count, active runs, cost burn rate):

```
Worker writes aggregates to ClickHouse
        │
        ▼
Redis pub/sub: project:{id}:metrics
        │
        ▼
Query API SSE endpoint: GET /v1/projects/:id/stream
        │
        ▼
Dashboard subscribes via EventSource
        │
        ▼
UI updates sparklines and counters in real time
```

This is optional for Phase 1 — polling is acceptable initially.
