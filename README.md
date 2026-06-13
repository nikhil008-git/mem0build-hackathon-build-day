# Rift — Agent Observability Platform

> **Datadog × Sentry × PostHog — but for AI agents.**

Rift is an observability and remediation platform for AI agents. Integrate a lightweight SDK, and get full visibility into agent runs, tool calls, failures, reasoning chains, memory access, cost, and latency — with replay and auto-fix via GitHub PRs.

**Current status:** Phase 0 — Architecture & Documentation. No implementation code yet.

## What Rift Does

| Capability | Description |
|-----------|-------------|
| **Agent Runs** | Every agent invocation captured as a trace |
| **Tool Calls** | Input, output, latency, and errors per tool |
| **Failures** | Classified, grouped, and alertable |
| **Reasoning Chain** | Full LLM turn-by-turn thought process |
| **Memory Access** | Reads and writes to agent memory stores |
| **Cost** | Token usage and USD cost per run, model, and project |
| **Latency** | P50/P95/P99 breakdowns by span type |
| **Replay** | `rift.replay('run_123')` — re-execute failures in a sandbox |
| **Auto-Remediation** | AI-generated code fixes delivered as GitHub PRs |

## Architecture

```
SDK (@rift/sdk-*)  →  Ingest API  →  Worker  →  Storage  →  Dashboard
                                                              ↕
                                              Replay ← → Remediation → GitHub PR
```

Full documentation: **[docs/](./docs/README.md)**

## Project Layout

```
apps/
  frontend/           Dashboard UI (Next.js) — evolves into observability home
  api/                Query API (Express) — read path for dashboard
  ingest-api/         Event ingestion (write path)          [planned]
  worker/             Event processing pipeline              [planned]
  remediation/        Auto-fix and PR service                [planned]

packages/
  sdk-core/           Core SDK client                        [planned]
  sdk-vercel-ai/      Vercel AI SDK adapter                  [planned]
  sdk-openai/         OpenAI adapter                         [planned]
  sdk-mastra/         Mastra adapter                         [planned]
  observability-types/ Shared types and Zod schemas           [planned]
  replay/             Replay engine                          [planned]
  remediation-core/   Remediation agent logic                  [planned]
  cost-calculator/    Token cost calculation                 [planned]
  database/           Prisma schema and client (@repo/db)
  ui/                 Shared React components
```

See [docs/folder-structure.md](./docs/folder-structure.md) for the complete layout.

## Quick Start (Future)

```typescript
import { Rift } from '@rift/sdk-core';
import { riftMiddleware } from '@rift/sdk-vercel-ai';

const rift = new Rift({ apiKey: process.env.RIFT_API_KEY!, projectId: 'proj_...' });

// Instrument your agent — one middleware call
const model = wrapLanguageModel({
  model: openai('gpt-4o'),
  middleware: riftMiddleware(rift),
});

// Replay a failure
await rift.replay('run_123');
```

## Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL

### Setup

1. Install dependencies:

```sh
npm install
```

2. Create `.env` files (see `.env.example` at the root):

- `packages/database/.env`
- `apps/frontend/.env`

Both need:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/riftnew
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:3000
```

3. Generate the Prisma client and run migrations:

```sh
npm run db:generate
npm run db:migrate
```

4. Start development:

```sh
npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:8080

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all apps in dev mode |
| `npm run build` | Build all apps and packages |
| `npm run lint` | Lint the monorepo |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:deploy` | Deploy migrations (production) |

Run a single app:

```sh
npx turbo dev --filter=frontend
npx turbo dev --filter=api
```

## Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| 0 | Architecture & docs | **Current** |
| 1 | SDK + ingest + dashboard MVP | Planned |
| 2 | Full observability (reasoning, memory, cost, latency) | Planned |
| 3 | Replay + auto-remediation | Planned |
| 4 | Production & scale | Planned |

See [docs/roadmap.md](./docs/roadmap.md) for details.

## Documentation

- [Architecture Overview](./docs/architecture/overview.md)
- [System Design](./docs/architecture/system-design.md)
- [SDK Design](./docs/platform/sdk.md)
- [Dashboard](./docs/platform/dashboard.md)
- [Replay Engine](./docs/platform/replay.md)
- [Auto-Remediation](./docs/platform/auto-remediation.md)
- [Roadmap](./docs/roadmap.md)
