# Architecture Overview

## Problem

AI agents are opaque. When an agent fails in production, developers face:

- No visibility into **why** the agent chose a tool or path
- No structured record of **tool calls**, **LLM turns**, or **memory reads**
- No way to **replay** a failure with the same inputs
- No automated path from **failure → fix → deploy → verify**

Existing observability tools (Datadog, Sentry, PostHog) were built for request/response web apps, not multi-step agent loops with tool use, memory, and reasoning chains.

## Vision

Rift is the observability and remediation layer for AI agents — the place developers go when something goes wrong, and the system that can fix it.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Developer Agent App                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Vercel   │  │ OpenAI   │  │ Mastra   │  │ Custom Agent     │   │
│  │ AI SDK   │  │ Agents   │  │          │  │ Framework        │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
│       └─────────────┴─────────────┴────────────────┘              │
│                              │                                      │
│                    ┌─────────▼─────────┐                           │
│                    │   @rift/sdk-*     │  ← Instrumentation layer  │
│                    └─────────┬─────────┘                           │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ Rift Event Protocol (REP)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Rift Platform                                 │
│                                                                       │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐  │
│  │ Ingest API │──▶│  Worker    │──▶│  Storage   │◀──│ Query API  │  │
│  └────────────┘   └────────────┘   └────────────┘   └─────┬──────┘  │
│                                                           │          │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐        │          │
│  │  Replay    │   │Remediation │   │  GitHub    │        │          │
│  │  Engine    │   │  Service   │──▶│  Integration│       │          │
│  └────────────┘   └────────────┘   └────────────┘        │          │
│                                                           ▼          │
│                                              ┌────────────────────┐  │
│                                              │    Dashboard UI    │  │
│                                              │  (apps/frontend)   │  │
│                                              └────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Core Capabilities

### 1. Agent Runs
Every agent invocation is a **Run** — a top-level trace with status, duration, cost, and metadata. Runs are the unit of observability.

### 2. Tool Calls
Each tool invocation within a run is captured: name, input, output, latency, and errors. Displayed as a timeline in the dashboard.

### 3. Failures
Runs that end in error are classified, grouped, and surfaced. Developers can drill into stack traces, LLM responses, and the exact step that failed.

### 4. Reasoning Chain
The sequence of LLM turns (prompts, completions, tool-call decisions) is stored as a **Reasoning Chain** — the "thought process" of the agent.

### 5. Memory Access
Reads and writes to agent memory (vector DB, KV, conversation history) are logged with query, results, and relevance scores.

### 6. Cost
Token usage and model pricing are aggregated per run, per tool call, and per project. Supports cost alerts and budgets.

### 7. Latency
P50/P95/P99 latency for runs, LLM calls, tool calls, and memory operations. Breakdown by model and tool.

### 8. Replay
```typescript
rift.replay('run_123');
```
Re-executes a failed run in an isolated sandbox with the same inputs, optionally mocking external tools. Compares output to the original.

### 9. Auto-Remediation
On failure, Rift can:
1. Analyze the failure context (reasoning chain, tool output, stack trace)
2. Generate a code fix via a remediation agent
3. Open a GitHub PR with the fix
4. Track PR status (CI, review, merge) back in the dashboard
5. Re-run the original scenario to verify the fix

## Design Principles

| Principle | Rationale |
|-----------|-----------|
| **SDK-first** | Instrumentation must be one import + one wrapper. No manual event logging. |
| **Framework-agnostic core** | `@rift/sdk-core` owns the protocol; adapters are thin. |
| **Runs as traces** | One run = one distributed trace. Spans = LLM calls, tools, memory. |
| **Async ingestion** | SDK batches and sends events; never blocks the agent hot path. |
| **Replayable by default** | Inputs, tool schemas, and model config are stored for replay. |
| **Fix loop closed** | Failure → analysis → PR → merge → verify → dashboard update. |

## Non-Goals (Phase 0)

- Real-time agent steering / intervention mid-run
- Multi-tenant SaaS billing (deferred to Phase 3)
- On-prem air-gapped deployment (deferred to Phase 4)
- Browser / client-side agent instrumentation (Node-first)

## Success Metrics

| Metric | Target |
|--------|--------|
| SDK integration time | < 5 minutes |
| Event delivery latency (p99) | < 500ms |
| Dashboard time-to-root-cause | < 2 minutes |
| Replay fidelity | > 95% deterministic re-runs |
| Auto-PR acceptance rate | > 40% merged without edits |
