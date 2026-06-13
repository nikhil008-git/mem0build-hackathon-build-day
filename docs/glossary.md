# Glossary

| Term | Definition |
|------|-----------|
| **Agent** | An AI system that uses an LLM to reason, call tools, and access memory to accomplish tasks. Registered in Rift as a named entity for grouping runs. |
| **Agent Run** | A single invocation of an agent, from input to final output. The top-level unit of observability in Rift. Identified by `run_id`. |
| **Alert Rule** | A configurable threshold (failure rate, cost budget, latency) that triggers notifications when exceeded. |
| **AsyncLocalStorage** | Node.js API used by the SDK to propagate run/span context across async function calls without explicit parameter threading. |
| **Auto-Remediation** | The pipeline that analyzes a failure, generates a code fix, and creates a GitHub PR. |
| **ClickHouse** | Column-oriented database used for time-series metrics (latency percentiles, cost rollups). |
| **Cost Calculator** | Package (`@rift/cost-calculator`) that maps model + token count to USD cost. |
| **Dashboard** | The Next.js web UI in `apps/frontend` where developers view runs, failures, and remediation status. |
| **Event** | A granular telemetry record within a span (e.g., `llm.prompt`, `tool.output`). |
| **Event Envelope** | The common wrapper around every REP event containing version, IDs, timestamps, and typed payload. |
| **Failure** | A classified error record grouped by fingerprint. Represents a category of errors, not just a single run error. |
| **Failure Fingerprint** | A hash of the error type + message pattern used to group similar failures together. |
| **Framework Adapter** | An SDK package that maps a specific agent framework's events to REP (e.g., `@rift/sdk-vercel-ai`). |
| **Ingest API** | The write-path HTTP service (`apps/ingest-api`) that receives event batches from SDKs. |
| **Memory Access** | A logged read or write to an agent's memory store (vector DB, conversation history, KV store). |
| **Mock Injection** | During replay, replacing live API calls with recorded responses to enable deterministic re-execution. |
| **Organization** | Top-level tenant entity. Users belong to organizations. Projects belong to organizations. |
| **Project** | A Rift project maps to one instrumented agent application. Has its own API key, settings, and data. |
| **PR (Pull Request)** | A GitHub pull request created by the remediation service containing an AI-generated code fix. |
| **Query API** | The read-path HTTP service (`apps/api`) that serves data to the dashboard. |
| **Reasoning Chain** | The sequence of LLM turns (prompts, completions, tool-call decisions) that constitute an agent's "thought process." |
| **Recorded Responses** | Tool outputs, LLM completions, and memory results captured during the original run, used during replay. |
| **Remediation** | A single attempt to fix a failure. Tracks status from analysis through PR merge and verification. |
| **Remediation Agent** | An LLM-powered engine that analyzes failure context and generates code patches. |
| **Replay** | Re-executing a stored agent run in an isolated sandbox with the same inputs. |
| **Replay Mode** | How replay handles LLM and tool calls: `full` (live), `mock_tools` (live LLM, recorded tools), `mock_all` (all recorded). |
| **Replay Snapshot** | A stored copy of everything needed to replay a run: inputs, config, tool schemas, recorded responses. |
| **REP** | Rift Event Protocol — the custom JSON event format used between SDKs and the ingest API. |
| **Run Snapshot** | See Replay Snapshot. |
| **Sandbox** | An isolated Docker container where replay executes agent code without access to production systems. |
| **Span** | A unit of work within a run: an LLM call, tool invocation, memory operation, or agent step. Forms a tree structure. |
| **Tool Call** | An invocation of an agent tool (function) with captured input, output, latency, and errors. |
| **Worker** | The background service (`apps/worker`) that processes queued events into queryable storage. |
