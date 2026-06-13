# Data Model

## Entity Relationship Diagram

```
Organization
  ├── members (User[])
  ├── projects (Project[])
  └── github_connections (GitHubConnection[])

Project
  ├── api_keys (ApiKey[])
  ├── runs (Run[])
  ├── alert_rules (AlertRule[])
  └── agents (Agent[])          ← registered agent definitions

Run
  ├── spans (Span[])             ← LLM calls, tool calls, memory ops
  ├── events (Event[])           ← granular events within spans
  ├── failure (Failure?)         ← 1:1 if run failed
  ├── replay_results (ReplayResult[])
  └── remediation (Remediation?) ← 1:1 if remediation triggered

Span
  ├── parent_span (Span?)        ← tree structure
  └── events (Event[])

Failure
  ├── run (Run)
  └── remediations (Remediation[])

Remediation
  ├── run (Run)
  ├── failure (Failure)
  └── github_pr (GitHubPR?)
```

## Core Entities

### Organization

```typescript
interface Organization {
  id: string;              // org_abc123
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Project

A project maps to one instrumented agent application.

```typescript
interface Project {
  id: string;              // proj_xyz789
  organizationId: string;
  name: string;
  slug: string;
  environment: 'production' | 'staging' | 'development';
  settings: ProjectSettings;
  createdAt: Date;
}

interface ProjectSettings {
  retentionDays: number;         // default: 30
  costBudgetUsd?: number;        // monthly budget alert
  alertOnFailure: boolean;       // default: true
  autoRemediate: boolean;        // default: false
  replaySandboxImage?: string;   // custom Docker image for replay
}
```

### Agent

Registered agent definition — helps group runs.

```typescript
interface Agent {
  id: string;              // agent_support_bot
  projectId: string;
  name: string;            // "Support Bot"
  framework: 'vercel-ai' | 'openai' | 'mastra' | 'custom';
  model: string;           // "gpt-4o"
  tools: string[];           // ["search_docs", "create_ticket"]
  metadata: Record<string, unknown>;
}
```

### Run

Top-level trace. The primary entity developers interact with.

```typescript
interface Run {
  id: string;              // run_abc123def456
  projectId: string;
  agentId?: string;
  status: RunStatus;
  input: unknown;            // stored in S3 if > 16KB
  output?: unknown;
  error?: RunError;
  startedAt: Date;
  endedAt?: Date;
  durationMs?: number;
  costUsd?: number;
  tokenUsage?: TokenUsage;
  metadata: RunMetadata;
  tags: string[];
}

type RunStatus = 'running' | 'success' | 'error' | 'timeout' | 'cancelled';

interface RunError {
  type: FailureType;
  message: string;
  stack?: string;
  spanId?: string;          // which span failed
}

interface RunMetadata {
  environment: string;
  sdkVersion: string;
  framework: string;
  model: string;
  userId?: string;           // end-user identifier (hashed)
  sessionId?: string;
  version?: string;          // agent code version / git sha
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
```

### Span

A unit of work within a run (LLM call, tool invocation, memory operation).

```typescript
interface Span {
  id: string;              // span_001
  runId: string;
  parentSpanId?: string;
  name: string;
  type: SpanType;
  status: 'ok' | 'error';
  startedAt: Date;
  endedAt?: Date;
  durationMs?: number;
  costUsd?: number;
  attributes: Record<string, unknown>;
}

type SpanType =
  | 'llm_call'
  | 'tool_call'
  | 'memory_read'
  | 'memory_write'
  | 'agent_step'
  | 'custom';
```

### Event

Granular event within a span.

```typescript
interface Event {
  id: string;
  spanId: string;
  runId: string;
  type: EventType;
  timestamp: Date;
  payload: unknown;          // stored in S3 if > 64KB
  payloadRef?: string;       // S3 key for large payloads
}

type EventType =
  | 'run.started'
  | 'run.ended'
  | 'span.started'
  | 'span.ended'
  | 'llm.prompt'
  | 'llm.completion'
  | 'llm.tool_call_request'
  | 'tool.input'
  | 'tool.output'
  | 'tool.error'
  | 'memory.query'
  | 'memory.results'
  | 'memory.write'
  | 'error'
  | 'custom';
```

### Failure

Classified failure record for grouping and alerting.

```typescript
interface Failure {
  id: string;              // fail_abc123
  runId: string;
  projectId: string;
  type: FailureType;
  fingerprint: string;     // hash for grouping similar failures
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  occurrenceCount: number;   // how many runs share this fingerprint
  firstSeenAt: Date;
  lastSeenAt: Date;
  status: 'open' | 'investigating' | 'resolved' | 'ignored';
}

type FailureType =
  | 'tool_error'
  | 'llm_error'
  | 'timeout'
  | 'validation'
  | 'memory_error'
  | 'rate_limit'
  | 'unknown';
```

### ReplayResult

```typescript
interface ReplayResult {
  id: string;              // replay_abc123
  runId: string;
  mode: 'full' | 'mock_tools' | 'mock_all' | 'step';
  status: 'running' | 'success' | 'error' | 'diff_detected';
  originalOutput: unknown;
  replayOutput: unknown;
  diff?: ReplayDiff;
  startedAt: Date;
  endedAt?: Date;
  durationMs?: number;
}

interface ReplayDiff {
  stepsMatched: number;
  stepsDiverged: number;
  divergencePoint?: {
    spanId: string;
    original: unknown;
    replayed: unknown;
  };
}
```

### Remediation

```typescript
interface Remediation {
  id: string;              // rem_abc123
  runId: string;
  failureId: string;
  status: RemediationStatus;
  analysis?: string;         // root cause explanation (markdown)
  suggestedFix?: string;     // code patch description
  githubPrUrl?: string;
  githubPrNumber?: number;
  createdAt: Date;
  updatedAt: Date;
}

type RemediationStatus =
  | 'pending'
  | 'analyzing'
  | 'fix_generated'
  | 'pr_opened'
  | 'ci_running'
  | 'ci_passed'
  | 'ci_failed'
  | 'merged'
  | 'verified'
  | 'failed';
```

## Storage Mapping

| Entity | Primary Store | Indexing |
|--------|--------------|----------|
| Organization, User, Project, ApiKey | PostgreSQL | B-tree on id, slug |
| Run (metadata) | PostgreSQL | B-tree on project_id, status, started_at |
| Run (input/output) | S3 | Key: `runs/{project_id}/{run_id}/` |
| Span | PostgreSQL | B-tree on run_id |
| Event (metadata) | PostgreSQL | B-tree on span_id, run_id |
| Event (payload) | S3 | Key: `events/{project_id}/{event_id}` |
| Failure | PostgreSQL | B-tree on fingerprint, project_id |
| Remediation | PostgreSQL | B-tree on run_id, status |
| Latency metrics | ClickHouse | Partitioned by project_id, date |
| Cost metrics | ClickHouse | Partitioned by project_id, date |
| Event counts | ClickHouse | Materialized views |

## Prisma Schema Extensions (Planned)

The existing `@repo/db` schema will be extended with observability tables. See `packages/database/prisma/schema.prisma` — extensions documented here, not implemented yet.

**New models to add:**

- `Organization`, `OrganizationMember`
- `Project`, `ApiKey`
- `Agent`
- `Run`, `Span`, `Event`
- `Failure`
- `ReplayResult`
- `Remediation`
- `GitHubConnection`
- `AlertRule`

Full Prisma schema will be written in Phase 1.

## Indexing Strategy

| Query Pattern | Index |
|---------------|-------|
| List runs for project, sorted by date | `(project_id, started_at DESC)` |
| Find failures by fingerprint | `(project_id, fingerprint)` |
| Get spans for a run | `(run_id)` |
| Cost rollup by day | ClickHouse: `(project_id, toDate(started_at))` |
| Latency percentiles | ClickHouse: `(project_id, span_type, toDate(started_at))` |

## Data Retention

| Data Type | Default Retention | Configurable |
|-----------|-------------------|--------------|
| Run metadata | 30 days | Yes (7–90 days) |
| Event payloads (S3) | 30 days | Yes |
| ClickHouse aggregates | 90 days | Yes |
| Failures | Until resolved + 30 days | No |
| Remediations | Indefinite | No |
| Replay results | 30 days | Yes |
