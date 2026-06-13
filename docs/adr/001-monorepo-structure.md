# ADR-001: Monorepo Structure

**Status:** Accepted
**Date:** 2026-06-13

## Context

Rift is a multi-component platform: SDKs, ingestion API, worker, query API, dashboard, replay engine, and remediation service. We need a repository structure that supports shared types, independent deployment, and fast local development.

## Decision

Use a **Turborepo monorepo** with npm workspaces, extending the existing Riftnew structure.

```
apps/          → Deployable services
packages/      → Shared libraries and SDKs
docs/          → Architecture and design documentation
```

### Apps (deployable)

| App | Purpose | Deploy Target |
|-----|---------|---------------|
| `frontend` | Dashboard UI | Vercel |
| `api` | Query API (read path) | Fly.io / Railway |
| `ingest-api` | Event ingestion (write path) | Fly.io / Railway |
| `worker` | Event processing pipeline | Fly.io / Railway |
| `remediation` | Auto-fix and PR service | Fly.io / Railway |

### Packages (libraries)

| Package | Purpose | Published |
|---------|---------|-----------|
| `sdk-core` | Core SDK | npm (@rift/sdk-core) |
| `sdk-vercel-ai` | Vercel AI adapter | npm (@rift/sdk-vercel-ai) |
| `sdk-openai` | OpenAI adapter | npm (@rift/sdk-openai) |
| `sdk-mastra` | Mastra adapter | npm (@rift/sdk-mastra) |
| `observability-types` | Shared types and Zod schemas | npm (@rift/observability-types) |
| `replay` | Replay engine logic | Internal |
| `remediation-core` | Remediation agent logic | Internal |
| `cost-calculator` | Token cost calculation | Internal |
| `database` | Prisma schema and client | Internal (@repo/db) |
| `ui` | Shared React components | Internal |
| `eslint-config` | Shared ESLint config | Internal |
| `typescript-config` | Shared TS config | Internal |

## Rationale

- **Turborepo** is already set up and provides caching, parallel builds, and dependency graph management
- **Separate ingest-api from query-api** allows independent scaling (write-heavy vs read-heavy)
- **SDKs as packages** enables independent versioning and npm publishing
- **Shared types package** ensures SDK, ingest, and worker agree on event schemas
- **Docs in-repo** keeps architecture close to code

## Consequences

- All services share TypeScript config and linting conventions
- SDK packages can be published to npm independently of platform services
- Local dev runs via `turbo dev` with selective filtering
- CI builds only affected packages (Turborepo cache)

## Alternatives Considered

| Alternative | Why Rejected |
|------------|--------------|
| Separate repos per service | Harder to share types; more coordination overhead |
| Single app (no monorepo) | Can't publish SDKs separately; coupling too high |
| Nx monorepo | Turborepo already set up; no benefit to switching |
