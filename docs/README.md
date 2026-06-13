# Rift Agent Observability Platform — Documentation

> **Datadog × Sentry × PostHog — but for AI agents.**

Rift is an observability and remediation platform for AI agents. Developers integrate a lightweight SDK into their agent stack (Vercel AI SDK, OpenAI, Mastra, etc.), and Rift captures every run, tool call, failure, reasoning step, memory access, cost, and latency — then surfaces it in a dashboard with replay and auto-fix capabilities.

## Documentation Index

### Architecture

| Document | Description |
|----------|-------------|
| [Overview](./architecture/overview.md) | Vision, goals, and high-level system map |
| [System Design](./architecture/system-design.md) | Services, components, and responsibilities |
| [Data Flow](./architecture/data-flow.md) | End-to-end telemetry and remediation flows |
| [Data Model](./architecture/data-model.md) | Entities, relationships, and storage layout |
| [Event Schema](./architecture/event-schema.md) | Canonical event types and payloads |

### Platform Features

| Document | Description |
|----------|-------------|
| [SDK](./platform/sdk.md) | Client SDK design and instrumentation model |
| [Ingestion](./platform/ingestion.md) | Telemetry collection and processing pipeline |
| [Dashboard](./platform/dashboard.md) | UI views, queries, and developer workflows |
| [Replay Engine](./platform/replay.md) | `replay(run_id)` — failure reproduction |
| [Auto-Remediation](./platform/auto-remediation.md) | AI-generated fixes and GitHub PR pipeline |

### Integrations

| Document | Description |
|----------|-------------|
| [Vercel AI SDK](./integrations/vercel-ai-sdk.md) | Adapter for `ai` package |
| [OpenAI](./integrations/openai.md) | Adapter for OpenAI Agents / Assistants |
| [Mastra](./integrations/mastra.md) | Adapter for Mastra framework |
| [GitHub](./integrations/github.md) | PR creation, webhooks, and status sync |

### Architecture Decision Records

| ADR | Decision |
|-----|----------|
| [001](./adr/001-monorepo-structure.md) | Turborepo monorepo layout |
| [002](./adr/002-event-ingestion-protocol.md) | Custom Rift Event Protocol (REP) |
| [003](./adr/003-storage-strategy.md) | PostgreSQL + ClickHouse + object storage |
| [004](./adr/004-replay-sandbox.md) | Isolated replay execution model |
| [005](./adr/005-auto-pr-pipeline.md) | Remediation agent and PR workflow |

### Reference

| Document | Description |
|----------|-------------|
| [Roadmap](./roadmap.md) | Phased delivery plan |
| [Glossary](./glossary.md) | Terms and definitions |
| [Folder Structure](./folder-structure.md) | Complete repo layout |

## Quick Start (Future)

```bash
# Install SDK
npm install @rift/sdk-core @rift/sdk-vercel-ai

# Instrument your agent
import { Rift } from '@rift/sdk-core';
import { withVercelAI } from '@rift/sdk-vercel-ai';

const rift = new Rift({ apiKey: process.env.RIFT_API_KEY });
const agent = withVercelAI(yourAgent, rift);

# Replay a failed run from the dashboard or CLI
rift.replay('run_123');
```

## Status

**Phase 0 — Architecture & Documentation** (current)

No implementation code yet. See [Roadmap](./roadmap.md) for build phases.
