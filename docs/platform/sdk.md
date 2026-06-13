# SDK Design

The Rift SDK is a thin instrumentation layer that wraps agent frameworks and emits events to the ingest API. Developers should be able to integrate in under 5 minutes.

## Package Structure

```
@rift/sdk-core          ← Required. Client, spans, batching, replay.
@rift/sdk-vercel-ai     ← Optional adapter for Vercel AI SDK
@rift/sdk-openai        ← Optional adapter for OpenAI Agents SDK
@rift/sdk-mastra        ← Optional adapter for Mastra
```

## Core Concepts

### Rift Client

The entry point. One instance per process (singleton recommended).

```typescript
import { Rift } from '@rift/sdk-core';

const rift = new Rift({
  apiKey: process.env.RIFT_API_KEY!,
  projectId: 'proj_xyz789',
  environment: process.env.NODE_ENV,
});
```

### Run

A run wraps a single agent invocation. Created via `rift.startRun()` or automatically by framework adapters.

```typescript
const run = rift.startRun({
  agent: 'support-bot',
  input: { message: userMessage },
  metadata: { userId: 'user_123', sessionId: 'sess_456' },
});

try {
  const output = await executeAgent(userMessage);
  run.end({ status: 'success', output });
} catch (error) {
  run.end({ status: 'error', error });
}
```

### Span

A span represents a unit of work within a run. Framework adapters create spans automatically; custom agents can create them manually.

```typescript
const span = run.span('search_docs', 'tool_call');
span.setAttribute('tool.version', '2.1');
// ... tool executes ...
span.end({ status: 'ok', result });
```

### Auto-Instrumentation (Framework Adapters)

Adapters wrap framework functions so developers don't manage spans manually:

```typescript
// Vercel AI SDK
import { withRift } from '@rift/sdk-vercel-ai';

const result = await withRift(rift, () =>
  streamText({
    model: openai('gpt-4o'),
    tools: { search_docs: searchTool },
    messages,
  })
);
```

```typescript
// OpenAI Agents
import { withRiftAgent } from '@rift/sdk-openai';

const agent = withRiftAgent(rift, new Agent({ name: 'Support', tools: [...] }));
const result = await agent.run(userMessage);
```

```typescript
// Mastra
import { riftMiddleware } from '@rift/sdk-mastra';

const mastra = new Mastra({
  middleware: [riftMiddleware(rift)],
});
```

## Event Batching

The SDK does not send events synchronously. It batches them to avoid blocking the agent.

```
Agent executes step
  → SDK records event in memory buffer
  → Buffer flushes every 2s (configurable) OR when buffer reaches 50 events
  → POST /v1/events with batch
  → On failure: retry with exponential backoff (3 attempts)
  → On shutdown: rift.shutdown() flushes remaining events
```

**Hot path guarantee:** Event recording is < 1ms (in-memory append). Network I/O is async and never awaited by the agent unless `rift.flush()` is called explicitly.

## Context Propagation

Runs and spans are tracked via async context (Node.js `AsyncLocalStorage`):

```typescript
// Parent run context is automatically available in nested async calls
const run = rift.startRun({ ... });
await step1();  // can access current run via rift.currentRun()
await step2();  // spans created here are children of the run
run.end({ status: 'success' });
```

This means framework adapters don't need to thread `run` through every function — context is implicit.

## Replay API

```typescript
// Programmatic replay
const result = await rift.replay('run_abc123', {
  mode: 'mock_tools',  // default: 'mock_tools'
});

console.log(result.status);       // 'success' | 'error' | 'diff_detected'
console.log(result.diff);         // step-by-step comparison
```

Replay is also available via:
- Dashboard UI ("Replay" button on run detail)
- CLI: `npx @rift/cli replay run_abc123`
- REST API: `POST /v1/runs/run_abc123/replay`

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `apiKey` | required | Project API key |
| `projectId` | required | Project identifier |
| `endpoint` | `https://ingest.rift.dev` | Ingest API URL |
| `environment` | `process.env.NODE_ENV` | Environment tag |
| `flushIntervalMs` | `2000` | Batch flush interval |
| `maxBatchSize` | `50` | Max events per batch |
| `maxRetries` | `3` | Retry attempts on ingest failure |
| `captureLlmPrompts` | `true` | Include full prompts in events |
| `captureLlmCompletions` | `true` | Include full completions |
| `captureToolIo` | `true` | Include tool inputs/outputs |
| `redactPatterns` | `[]` | Regex patterns to redact from payloads |
| `enabled` | `true` | Kill switch — set `false` to disable all instrumentation |

## Privacy & Redaction

```typescript
const rift = new Rift({
  apiKey: '...',
  projectId: '...',
  redactPatterns: [
    /\b\d{3}-\d{2}-\d{4}\b/,    // SSN
    /Bearer\s+\S+/,              // auth tokens
    /password["\s:=]+\S+/i,      // passwords
  ],
});
```

Redaction runs on event payloads before batching. Redacted fields are replaced with `[REDACTED]`.

## Error Handling

The SDK never throws errors that would break the agent. All internal errors are:

1. Logged to stderr (if `debug: true`)
2. Dropped silently (events lost for that batch)
3. Retried on next flush

```typescript
// The agent's error handling is never affected
try {
  await agent.run(input);
} catch (agentError) {
  // This is the agent's error, not the SDK's
  run.end({ status: 'error', error: agentError });
}
```

## Adapter Implementation Guide

To build a new framework adapter:

1. Create `packages/sdk-{framework}/`
2. Depend on `@rift/sdk-core` and `@rift/observability-types`
3. Wrap the framework's execution loop
4. Map framework events to REP event types (see [Event Schema](../architecture/event-schema.md))
5. Use `AsyncLocalStorage` context from sdk-core
6. Export a single `withRift()` or middleware function

**Required events per adapter:**

| Framework Event | REP Event |
|----------------|-----------|
| Agent invocation starts | `run.started` |
| Agent invocation ends | `run.ended` |
| LLM call starts | `span.started` (type: `llm_call`) |
| LLM prompt sent | `llm.prompt` |
| LLM response received | `llm.completion` |
| Tool call starts | `span.started` (type: `tool_call`) |
| Tool input | `tool.input` |
| Tool output | `tool.output` |
| Tool error | `tool.error` |
| Memory read | `memory.query` + `memory.results` |
| Any error | `error` |

## Planned File Structure

```
packages/sdk-core/
├── README.md
├── src/
│   ├── index.ts              # Public exports
│   ├── client.ts             # Rift class
│   ├── run.ts                # RunContext
│   ├── span.ts               # Span
│   ├── buffer.ts             # Event batching
│   ├── transport.ts          # HTTP transport to ingest-api
│   ├── context.ts            # AsyncLocalStorage context
│   ├── replay.ts             # Replay client
│   ├── redact.ts             # Payload redaction
│   └── types.ts              # Config types
├── package.json
└── tsconfig.json
```
