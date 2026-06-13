# Folder Structure

Complete repository layout for the Rift Agent Observability Platform. Items marked `(existing)` are already in the repo. Items marked `(planned)` are placeholders — docs only, no code yet.

```
mem0build/
├── README.md                              # Root readme (existing, to be updated)
├── package.json                           # Turborepo root (existing)
├── turbo.json                             # Turborepo config (existing)
├── .env.example                           # Root env template (existing)
│
├── docs/                                  # (planned) Architecture & design docs
│   ├── README.md                          # Documentation index
│   ├── roadmap.md                         # Phased delivery plan
│   ├── glossary.md                        # Terms and definitions
│   ├── folder-structure.md                # This file
│   │
│   ├── architecture/
│   │   ├── overview.md                    # Vision, goals, system map
│   │   ├── system-design.md              # Services, components, deployment
│   │   ├── data-flow.md                  # Telemetry, replay, remediation flows
│   │   ├── data-model.md                 # Entities, relationships, storage
│   │   └── event-schema.md               # Rift Event Protocol (REP)
│   │
│   ├── platform/
│   │   ├── sdk.md                         # SDK design and instrumentation
│   │   ├── ingestion.md                   # Ingest API and worker pipeline
│   │   ├── dashboard.md                   # UI views and interactions
│   │   ├── replay.md                      # Replay engine design
│   │   └── auto-remediation.md           # Auto-fix and PR pipeline
│   │
│   ├── integrations/
│   │   ├── vercel-ai-sdk.md              # Vercel AI SDK adapter
│   │   ├── openai.md                      # OpenAI adapter
│   │   ├── mastra.md                      # Mastra adapter
│   │   └── github.md                      # GitHub PR integration
│   │
│   └── adr/
│       ├── 001-monorepo-structure.md
│       ├── 002-event-ingestion-protocol.md
│       ├── 003-storage-strategy.md
│       ├── 004-replay-sandbox.md
│       └── 005-auto-pr-pipeline.md
│
├── apps/
│   ├── frontend/                          # (existing) Dashboard UI — Next.js
│   │   ├── app/
│   │   │   ├── dashboard/                 # (existing) → evolves into observability home
│   │   │   │   ├── page.tsx               # Overview
│   │   │   │   ├── runs/                  # (planned) Run list + detail
│   │   │   │   ├── failures/              # (planned) Failure inbox
│   │   │   │   ├── cost/                  # (planned) Cost analytics
│   │   │   │   ├── latency/               # (planned) Latency analytics
│   │   │   │   ├── memory/                # (planned) Memory access
│   │   │   │   └── settings/              # (planned) API keys, GitHub, alerts
│   │   │   ├── sign-in/                   # (existing)
│   │   │   └── sign-up/                   # (existing)
│   │   ├── components/
│   │   │   └── dashboard/                 # (planned) Observability components
│   │   └── lib/
│   │       └── api.ts                     # (planned) Query API client
│   │
│   ├── api/                               # (existing) Query API — Express
│   │   └── src/
│   │       ├── index.ts                   # (existing)
│   │       └── routes/                    # (planned) Observability endpoints
│   │           ├── runs.ts
│   │           ├── failures.ts
│   │           ├── replay.ts
│   │           ├── remediation.ts
│   │           └── webhooks/
│   │               └── github.ts
│   │
│   ├── ingest-api/                        # (planned) Event ingestion service
│   │   ├── README.md
│   │   └── src/
│   │       ├── index.ts
│   │       ├── routes/
│   │       │   ├── events.ts
│   │       │   └── health.ts
│   │       ├── middleware/
│   │       │   ├── auth.ts
│   │       │   ├── rate-limit.ts
│   │       │   └── validate.ts
│   │       └── services/
│   │           ├── queue.ts
│   │           └── payload.ts
│   │
│   ├── worker/                            # (planned) Event processing pipeline
│   │   ├── README.md
│   │   └── src/
│   │       ├── index.ts
│   │       ├── consumer.ts
│   │       ├── pipeline/
│   │       │   ├── normalize.ts
│   │       │   ├── enrich.ts
│   │       │   ├── store.ts
│   │       │   ├── aggregate.ts
│   │       │   └── alert.ts
│   │       └── services/
│   │           ├── postgres.ts
│   │           ├── clickhouse.ts
│   │           └── s3.ts
│   │
│   └── remediation/                       # (planned) Auto-fix and PR service
│       ├── README.md
│       └── src/
│           ├── index.ts
│           ├── routes/
│           │   ├── remediate.ts
│           │   └── webhooks.ts
│           ├── pipeline/
│           │   ├── gather.ts
│           │   ├── analyze.ts
│           │   ├── generate.ts
│           │   ├── pr.ts
│           │   └── verify.ts
│           └── services/
│               ├── github.ts
│               └── llm.ts
│
├── packages/
│   ├── database/                          # (existing) Prisma schema + client
│   │   └── prisma/
│   │       └── schema.prisma              # → extend with observability models
│   │
│   ├── ui/                                # (existing) Shared React components
│   │   └── src/
│   │       └── dashboard/                 # (planned) Observability UI components
│   │
│   ├── eslint-config/                     # (existing)
│   ├── typescript-config/                 # (existing)
│   │
│   ├── observability-types/               # (planned) Shared types + Zod schemas
│   │   ├── README.md
│   │   └── src/
│   │       ├── index.ts
│   │       ├── events/                    # REP event schemas
│   │       ├── entities/                  # Data model types
│   │       └── api/                       # API request/response types
│   │
│   ├── sdk-core/                          # (planned) Core SDK
│   │   ├── README.md
│   │   └── src/
│   │       ├── index.ts
│   │       ├── client.ts
│   │       ├── run.ts
│   │       ├── span.ts
│   │       ├── buffer.ts
│   │       ├── transport.ts
│   │       ├── context.ts
│   │       ├── replay.ts
│   │       ├── redact.ts
│   │       └── types.ts
│   │
│   ├── sdk-vercel-ai/                     # (planned) Vercel AI SDK adapter
│   │   ├── README.md
│   │   └── src/
│   │       ├── index.ts
│   │       ├── with-rift.ts
│   │       ├── middleware.ts
│   │       ├── tools.ts
│   │       └── stream.ts
│   │
│   ├── sdk-openai/                        # (planned) OpenAI adapter
│   │   ├── README.md
│   │   └── src/
│   │       ├── index.ts
│   │       ├── agent.ts
│   │       ├── chat.ts
│   │       └── assistant.ts
│   │
│   ├── sdk-mastra/                        # (planned) Mastra adapter
│   │   ├── README.md
│   │   └── src/
│   │       ├── index.ts
│   │       ├── middleware.ts
│   │       ├── agent.ts
│   │       └── workflow.ts
│   │
│   ├── replay/                            # (planned) Replay engine
│   │   ├── README.md
│   │   └── src/
│   │       ├── index.ts
│   │       ├── orchestrator.ts
│   │       ├── snapshot.ts
│   │       ├── sandbox.ts
│   │       ├── mock/
│   │       ├── diff.ts
│   │       └── types.ts
│   │
│   ├── remediation-core/                  # (planned) Remediation agent logic
│   │   ├── README.md
│   │   └── src/
│   │       ├── index.ts
│   │       ├── agent.ts
│   │       ├── context.ts
│   │       ├── patch.ts
│   │       └── pr-template.ts
│   │
│   └── cost-calculator/                   # (planned) Token cost calculation
│       ├── README.md
│       └── src/
│           ├── index.ts
│           ├── pricing.ts                 # Model pricing tables
│           └── calculate.ts
│
└── docker/                                # (planned) Local development infra
    ├── docker-compose.yml                 # Postgres, Redis, ClickHouse, MinIO
    └── clickhouse/
        └── init.sql                       # ClickHouse schema
```

## Package Dependency Graph

```
                    ┌─────────────────────┐
                    │ observability-types  │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌────────────┐  ┌────────────┐  ┌────────────────┐
       │  sdk-core  │  │   ingest   │  │     worker     │
       └─────┬──────┘  │    -api    │  └───────┬────────┘
             │         └────────────┘          │
    ┌────────┼────────┐                       │
    ▼        ▼        ▼                       ▼
┌────────┐ ┌──────┐ ┌───────┐         ┌──────────────┐
│vercel  │ │openai│ │mastra │         │cost-calculator│
│  -ai   │ │      │ │       │         └──────────────┘
└────────┘ └──────┘ └───────┘
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
              ┌────────┐ ┌────────┐ ┌───────────────┐
              │ replay │ │remedia-│ │   database    │
              │        │ │tion    │ │   (@repo/db)  │
              └────────┘ │-core   │ └───────────────┘
                         └────────┘
```

## Conventions

| Convention | Rule |
|-----------|------|
| Package naming | `@rift/{name}` for published SDKs; `@repo/{name}` for internal packages |
| App naming | Descriptive: `ingest-api`, `worker`, `remediation` |
| Source layout | `src/index.ts` entry point; feature folders under `src/` |
| Shared types | Always in `packages/observability-types`, never duplicated |
| README per package | Every package/app has a README explaining purpose and status |
| Config | `package.json` + `tsconfig.json` per package; extend `@repo/typescript-config` |
