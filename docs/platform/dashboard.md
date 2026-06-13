# Dashboard

The dashboard is the primary interface for developers. It lives in `apps/frontend` and evolves from the existing auth shell into a full observability UI.

## Design Philosophy

- **Run-centric:** Everything links back to a run. Failures, cost, latency — all drillable to individual runs.
- **Timeline-first:** The default view for any run is a chronological timeline of spans (LLM → tool → memory → LLM).
- **Action-oriented:** Every failure has a "Replay" and "Fix" button, not just a stack trace.

## Page Map

### Overview (`/dashboard`)

The landing page after sign-in. At-a-glance health of all agent projects.

```
┌─────────────────────────────────────────────────────────────┐
│  Rift Dashboard                              [User] [Settings]│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Agent   │  │   Tool   │  │ Failures │  │   Cost   │   │
│  │  Runs    │  │  Calls   │  │          │  │          │   │
│  │  1,247   │  │  3,891   │  │    23    │  │  $12.40  │   │
│  │  ↑ 12%   │  │  ↑ 8%    │  │  ↓ 3     │  │  ↑ $2.10  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                               │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │  Latency (p50/p95/p99)  │  │  Recent Failures        │   │
│  │  ═══════════════════    │  │  ● tool_error  run_abc  │   │
│  │  1.2s / 3.4s / 8.1s    │  │  ● llm_error   run_def  │   │
│  │  [chart]                │  │  ● timeout     run_ghi  │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Agent Runs (latest)                                  │   │
│  │  run_abc  support-bot  ✓ success  1.2s  $0.003      │   │
│  │  run_def  support-bot  ✗ error    3.4s  $0.008      │   │
│  │  run_ghi  sales-agent  ✓ success  0.8s  $0.002      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Widgets:**
| Widget | Data Source |
|--------|------------|
| Agent Runs count | `GET /v1/projects/:id/stats?metric=runs` |
| Tool Calls count | `GET /v1/projects/:id/stats?metric=tool_calls` |
| Failures count | `GET /v1/projects/:id/stats?metric=failures` |
| Cost total | `GET /v1/projects/:id/stats?metric=cost` |
| Latency percentiles | `GET /v1/projects/:id/latency` |
| Recent Failures | `GET /v1/failures?limit=5&status=open` |
| Recent Runs | `GET /v1/runs?limit=10` |

### Agent Runs (`/dashboard/runs`)

Filterable, paginated list of all runs.

**Filters:**
- Status: success, error, timeout, running
- Agent name
- Date range
- Cost range
- Duration range
- Tags
- Free-text search (run ID, input content)

**Columns:**
| Column | Description |
|--------|-------------|
| Run ID | Clickable link to detail |
| Agent | Agent name |
| Status | Color-coded badge |
| Input | Truncated preview |
| Duration | ms |
| Cost | USD |
| Tool Calls | Count |
| Time | Relative timestamp |

### Run Detail (`/dashboard/runs/[id]`)

The most important page. Full visibility into a single run.

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Runs                                              │
│                                                               │
│  run_abc123def456                                            │
│  support-bot · gpt-4o · production · 2.1s · $0.0023        │
│  Status: ✗ error (tool_error)                                │
│                                                               │
│  [Replay]  [Remediate]  [Copy ID]  [Export JSON]            │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  [Timeline]  [Reasoning Chain]  [Tool Calls]  [Memory]  [Cost]│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Timeline                                                     │
│  ─────────────────────────────────────────────────────────   │
│  0ms    ● run.started                                        │
│  100ms  ├─ ● llm_call: gpt-4o (1.4s, $0.002)               │
│  1500ms │    prompt: "How do I reset my password?"          │
│  1500ms │    completion: tool_call → search_docs             │
│  1500ms ├─ ● tool_call: search_docs (340ms)                  │
│  1840ms │    input: { query: "password reset" }              │
│  1840ms │    ✗ output: "Index not found: docs_v2"           │
│  2100ms ● run.ended (error)                                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Tabs:**

| Tab | Content |
|-----|---------|
| Timeline | Chronological span tree with expand/collapse |
| Reasoning Chain | LLM turns visualized as conversation flow |
| Tool Calls | Table of all tool invocations with I/O |
| Memory | Memory queries and results |
| Cost | Token usage and cost breakdown per span |

### Failures (`/dashboard/failures`)

Grouped failure inbox — similar to Sentry's issue list.

**Grouping:** Failures with the same `fingerprint` are grouped. Shows occurrence count, first/last seen, affected agents.

**Actions per failure:**
- View latest run
- Replay latest occurrence
- Trigger remediation
- Mark as resolved / ignored
- Create alert rule

### Failure Detail (`/dashboard/failures/[id]`)

- Failure metadata (type, severity, fingerprint)
- Timeline of all occurrences
- Remediation history (past fix attempts)
- Related runs

### Cost Analytics (`/dashboard/cost`)

- Total cost over time (daily/weekly/monthly)
- Breakdown by model, agent, tool
- Budget tracking and alerts
- Cost per successful run vs failed run

### Latency Analytics (`/dashboard/latency`)

- P50/P95/P99 over time
- Breakdown by span type (LLM, tool, memory)
- Breakdown by model and agent
- Slowest runs list

### Memory Access (`/dashboard/memory`)

- Most queried memory stores
- Query patterns and hit rates
- Empty result rate (potential memory gaps)
- Memory write frequency

### Settings (`/dashboard/settings`)

| Section | Content |
|---------|---------|
| API Keys | Create/revoke project API keys |
| GitHub | Connect GitHub account for auto-PR |
| Agents | Register agent definitions |
| Alerts | Configure alert rules |
| Retention | Data retention settings |
| Team | Organization members |

## Component Architecture

```
apps/frontend/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx                    # Overview
│   │   ├── runs/
│   │   │   ├── page.tsx                # Run list
│   │   │   └── [id]/
│   │   │       └── page.tsx            # Run detail
│   │   ├── failures/
│   │   │   ├── page.tsx                # Failure inbox
│   │   │   └── [id]/
│   │   │       └── page.tsx            # Failure detail
│   │   ├── cost/
│   │   │   └── page.tsx
│   │   ├── latency/
│   │   │   └── page.tsx
│   │   ├── memory/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   └── ...
├── components/
│   ├── dashboard/
│   │   ├── overview-stats.tsx
│   │   ├── run-list.tsx
│   │   ├── run-timeline.tsx
│   │   ├── reasoning-chain.tsx
│   │   ├── tool-call-table.tsx
│   │   ├── memory-viewer.tsx
│   │   ├── cost-breakdown.tsx
│   │   ├── latency-chart.tsx
│   │   ├── failure-inbox.tsx
│   │   ├── replay-panel.tsx
│   │   └── remediation-status.tsx
│   └── ...
└── lib/
    ├── api.ts                          # Query API client
    └── ...
```

Shared UI components (charts, tables, badges) will live in `packages/ui`.

## Data Fetching Strategy

| Pattern | Use Case |
|---------|----------|
| Server Components + fetch | Run list, failure list (SSR, paginated) |
| Client-side SWR/React Query | Run detail tabs, real-time counters |
| Server-Sent Events | Overview real-time metrics (Phase 2) |

## Key Interactions

### Replay from Dashboard

1. User clicks "Replay" on run detail
2. Modal: select replay mode (full / mock_tools / mock_all)
3. POST `/v1/runs/:id/replay`
4. Show progress spinner (replay can take 30s–5min)
5. Display side-by-side comparison when complete

### Remediate from Dashboard

1. User clicks "Remediate" on failure detail
2. Confirm: "This will analyze the failure and create a GitHub PR"
3. POST `/v1/runs/:id/remediate`
4. Show remediation progress (analyzing → fix generated → PR opened)
5. Link to GitHub PR when ready
6. Track PR status via webhook updates
