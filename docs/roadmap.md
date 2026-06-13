# Roadmap

## Phase 0: Architecture & Documentation (Current)

**Goal:** Define the system before writing code.

- [x] System architecture and component design
- [x] Data model and event schema (REP)
- [x] SDK integration design for Vercel AI, OpenAI, Mastra
- [x] Dashboard wireframes and page map
- [x] Replay engine design
- [x] Auto-remediation pipeline design
- [x] ADRs for key decisions
- [x] Folder structure and package layout
- [ ] Docker Compose for local infra (Postgres, Redis, ClickHouse, MinIO)

**Exit criteria:** Any developer can read the docs and understand what to build.

---

## Phase 1: Core Platform (MVP)

**Goal:** SDK → ingest → store → dashboard. See your agent runs.

### 1.1 Foundation
- [ ] `packages/observability-types` — Zod schemas for all REP events
- [ ] `packages/cost-calculator` — model pricing tables
- [ ] Extend `packages/database` Prisma schema (orgs, projects, runs, spans, events)
- [ ] Docker Compose for local development

### 1.2 SDK
- [ ] `packages/sdk-core` — Rift client, spans, batching, transport
- [ ] `packages/sdk-vercel-ai` — Vercel AI SDK middleware adapter
- [ ] Integration test: instrument a sample agent, verify events arrive

### 1.3 Ingestion
- [ ] `apps/ingest-api` — event validation, auth, queue
- [ ] `apps/worker` — normalize, enrich, store pipeline
- [ ] Redis Streams queue setup

### 1.4 Query API
- [ ] Extend `apps/api` with run/span/event endpoints
- [ ] Pagination, filtering, project scoping

### 1.5 Dashboard (MVP views)
- [ ] Overview page (run count, failure count, cost, latency)
- [ ] Run list with filters
- [ ] Run detail with timeline view
- [ ] API key management in settings

**Exit criteria:** Developer installs SDK, sees agent runs in dashboard within 5 minutes.

---

## Phase 2: Deep Observability

**Goal:** Full visibility — reasoning chains, memory, cost analytics, failures.

### 2.1 Dashboard (full views)
- [ ] Reasoning chain viewer
- [ ] Tool call table with I/O
- [ ] Memory access viewer
- [ ] Cost analytics page
- [ ] Latency analytics page
- [ ] Failure inbox with grouping

### 2.2 SDK Adapters
- [ ] `packages/sdk-openai` — OpenAI Agents SDK adapter
- [ ] `packages/sdk-mastra` — Mastra adapter
- [ ] Memory event capture in all adapters

### 2.3 Analytics
- [ ] ClickHouse setup and materialized views
- [ ] Cost rollups and budget alerts
- [ ] Latency percentile computation
- [ ] Real-time dashboard counters (SSE)

### 2.4 Alerting
- [ ] Alert rules (failure rate, cost budget, latency)
- [ ] Webhook and email notifications

**Exit criteria:** Developer can diagnose any failure in < 2 minutes using dashboard.

---

## Phase 3: Replay & Remediation

**Goal:** Close the loop — replay failures, auto-generate fixes, ship PRs.

### 3.1 Replay Engine
- [ ] `packages/replay` — snapshot storage, sandbox orchestration
- [ ] Replay modes: full, mock_tools, mock_all
- [ ] Dashboard replay UI (side-by-side diff)
- [ ] SDK `rift.replay()` API

### 3.2 Auto-Remediation
- [ ] `packages/remediation-core` — remediation agent
- [ ] `apps/remediation` — pipeline service
- [ ] GitHub integration (OAuth, PR creation, webhooks)
- [ ] Dashboard remediation status tracking

### 3.3 Verification Loop
- [ ] Post-merge auto-replay
- [ ] Remediation feedback (merged/rejected → prompt improvement)
- [ ] Failure resolution tracking

**Exit criteria:** Failure → PR → merge → verified replay, all tracked in dashboard.

---

## Phase 4: Production & Scale

**Goal:** Production-ready platform for external users.

- [ ] Multi-tenant org/project management
- [ ] API key rotation and scoping
- [ ] Data retention policies
- [ ] Rate limiting and abuse prevention
- [ ] CLI tool (`@rift/cli`)
- [ ] npm publish for SDK packages
- [ ] Hosted platform deployment
- [ ] Documentation site
- [ ] On-prem deployment guide

---

## Phase 5: Advanced Features

**Goal:** Differentiated capabilities.

- [ ] Agent comparison (A/B testing agent versions)
- [ ] Custom dashboards and saved views
- [ ] Slack / Discord integration
- [ ] OTel export (REP → OTLP converter)
- [ ] Browser agent instrumentation
- [ ] Multi-region deployment
- [ ] SOC 2 compliance
- [ ] Remediation agent fine-tuning from feedback data

---

## Timeline Estimate

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 0 | 1 week | 1 week |
| Phase 1 | 4–6 weeks | 5–7 weeks |
| Phase 2 | 3–4 weeks | 8–11 weeks |
| Phase 3 | 4–6 weeks | 12–17 weeks |
| Phase 4 | 3–4 weeks | 15–21 weeks |
| Phase 5 | Ongoing | — |

*Estimates assume 1–2 developers working full-time.*

## Priority Matrix

```
                    High Impact
                        │
         Replay ●       │       ● Auto-PR
                        │
    ────────────────────┼────────────────────
                        │
         Mastra ●       │       ● Cost Analytics
         adapter        │
                        │
                    Low Impact

         Low Effort ────────────── High Effort
```

**Build order:** SDK Core → Ingest → Dashboard (runs) → Failures → Replay → Auto-PR → Analytics → More adapters
