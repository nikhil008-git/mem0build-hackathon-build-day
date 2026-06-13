# Event Schema — Rift Event Protocol (REP)

All SDK adapters emit events conforming to the **Rift Event Protocol (REP)**. The ingest API validates against these schemas before enqueueing.

Schemas will be implemented as Zod definitions in `packages/observability-types`.

## Envelope

Every event shares a common envelope:

```typescript
interface EventEnvelope {
  // Protocol
  version: '1.0';
  type: EventType;

  // Identity
  id: string;                // evt_unique_id (client-generated, UUID v7)
  runId: string;             // run_abc123
  spanId?: string;           // span_001 (if within a span)
  parentSpanId?: string;

  // Scoping
  projectId: string;         // proj_xyz789
  agentId?: string;

  // Timing
  timestamp: string;         // ISO 8601

  // Context
  environment: string;       // production | staging | development
  sdk: {
    name: string;            // @rift/sdk-vercel-ai
    version: string;         // 0.1.0
  };

  // Payload (type-specific)
  data: EventData;
}
```

## Batch Request

SDKs send events in batches:

```typescript
interface EventBatch {
  events: EventEnvelope[];
}
```

```
POST /v1/events
Authorization: Bearer rift_live_...
Content-Type: application/json

{ "events": [ ... ] }
```

Max batch size: 100 events or 1 MB, whichever is smaller.

## Event Types

### Run Lifecycle

#### `run.started`

```typescript
interface RunStartedData {
  input: unknown;
  metadata: {
    agent?: string;
    model?: string;
    framework?: string;
    userId?: string;
    sessionId?: string;
    version?: string;
    tags?: string[];
  };
}
```

#### `run.ended`

```typescript
interface RunEndedData {
  status: 'success' | 'error' | 'timeout' | 'cancelled';
  output?: unknown;
  error?: {
    type: string;
    message: string;
    stack?: string;
    spanId?: string;
  };
  durationMs: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costUsd?: number;
}
```

### Span Lifecycle

#### `span.started`

```typescript
interface SpanStartedData {
  spanId: string;
  parentSpanId?: string;
  name: string;
  type: 'llm_call' | 'tool_call' | 'memory_read' | 'memory_write' | 'agent_step' | 'custom';
  attributes?: Record<string, unknown>;
}
```

#### `span.ended`

```typescript
interface SpanEndedData {
  spanId: string;
  status: 'ok' | 'error';
  durationMs: number;
  costUsd?: number;
  error?: {
    message: string;
    stack?: string;
  };
}
```

### LLM Events

#### `llm.prompt`

```typescript
interface LlmPromptData {
  spanId: string;
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
  }>;
  parameters?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    tools?: unknown[];
  };
}
```

#### `llm.completion`

```typescript
interface LlmCompletionData {
  spanId: string;
  model: string;
  content: string;
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: unknown;
  }>;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
}
```

### Tool Events

#### `tool.input`

```typescript
interface ToolInputData {
  spanId: string;
  toolName: string;
  arguments: unknown;
}
```

#### `tool.output`

```typescript
interface ToolOutputData {
  spanId: string;
  toolName: string;
  result: unknown;
  latencyMs: number;
}
```

#### `tool.error`

```typescript
interface ToolErrorData {
  spanId: string;
  toolName: string;
  error: {
    message: string;
    stack?: string;
    code?: string;
  };
  latencyMs: number;
}
```

### Memory Events

#### `memory.query`

```typescript
interface MemoryQueryData {
  spanId: string;
  store: string;             // "pinecone", "mem0", "redis", etc.
  query: string;
  topK?: number;
  filters?: Record<string, unknown>;
}
```

#### `memory.results`

```typescript
interface MemoryResultsData {
  spanId: string;
  store: string;
  results: Array<{
    id: string;
    content: string;
    score: number;
    metadata?: Record<string, unknown>;
  }>;
  latencyMs: number;
}
```

#### `memory.write`

```typescript
interface MemoryWriteData {
  spanId: string;
  store: string;
  entries: Array<{
    id?: string;
    content: string;
    metadata?: Record<string, unknown>;
  }>;
  latencyMs: number;
}
```

### Error Events

#### `error`

```typescript
interface ErrorData {
  spanId?: string;
  type: string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
}
```

## Payload Size Limits

| Field | Inline Limit | Overflow |
|-------|-------------|----------|
| `input` / `output` | 16 KB | Stored in S3, referenced by key |
| `messages` (LLM prompt) | 64 KB | Stored in S3 |
| `content` (LLM completion) | 64 KB | Stored in S3 |
| `result` (tool output) | 32 KB | Stored in S3 |
| `arguments` (tool input) | 16 KB | Stored in S3 |

The SDK should truncate or offload large payloads before sending. The ingest API rejects events with inline payloads exceeding limits.

## Example: Full Run Event Sequence

```json
[
  {
    "version": "1.0",
    "type": "run.started",
    "id": "evt_001",
    "runId": "run_abc123",
    "projectId": "proj_xyz",
    "timestamp": "2026-06-13T10:00:00.000Z",
    "environment": "production",
    "sdk": { "name": "@rift/sdk-vercel-ai", "version": "0.1.0" },
    "data": {
      "input": { "message": "How do I reset my password?" },
      "metadata": { "agent": "support-bot", "model": "gpt-4o", "framework": "vercel-ai" }
    }
  },
  {
    "version": "1.0",
    "type": "span.started",
    "id": "evt_002",
    "runId": "run_abc123",
    "spanId": "span_001",
    "projectId": "proj_xyz",
    "timestamp": "2026-06-13T10:00:00.100Z",
    "environment": "production",
    "sdk": { "name": "@rift/sdk-vercel-ai", "version": "0.1.0" },
    "data": {
      "spanId": "span_001",
      "name": "gpt-4o",
      "type": "llm_call"
    }
  },
  {
    "version": "1.0",
    "type": "llm.completion",
    "id": "evt_003",
    "runId": "run_abc123",
    "spanId": "span_001",
    "projectId": "proj_xyz",
    "timestamp": "2026-06-13T10:00:01.500Z",
    "environment": "production",
    "sdk": { "name": "@rift/sdk-vercel-ai", "version": "0.1.0" },
    "data": {
      "spanId": "span_001",
      "model": "gpt-4o",
      "content": "",
      "finishReason": "tool_calls",
      "toolCalls": [{ "id": "tc_1", "name": "search_docs", "arguments": { "query": "password reset" } }],
      "tokenUsage": { "promptTokens": 450, "completionTokens": 30, "totalTokens": 480 },
      "latencyMs": 1400
    }
  },
  {
    "version": "1.0",
    "type": "tool.output",
    "id": "evt_004",
    "runId": "run_abc123",
    "spanId": "span_002",
    "projectId": "proj_xyz",
    "timestamp": "2026-06-13T10:00:02.000Z",
    "environment": "production",
    "sdk": { "name": "@rift/sdk-vercel-ai", "version": "0.1.0" },
    "data": {
      "spanId": "span_002",
      "toolName": "search_docs",
      "result": { "error": "Index not found: docs_v2" },
      "latencyMs": 340
    }
  },
  {
    "version": "1.0",
    "type": "run.ended",
    "id": "evt_005",
    "runId": "run_abc123",
    "projectId": "proj_xyz",
    "timestamp": "2026-06-13T10:00:02.100Z",
    "environment": "production",
    "sdk": { "name": "@rift/sdk-vercel-ai", "version": "0.1.0" },
    "data": {
      "status": "error",
      "error": {
        "type": "tool_error",
        "message": "Index not found: docs_v2",
        "spanId": "span_002"
      },
      "durationMs": 2100,
      "tokenUsage": { "promptTokens": 450, "completionTokens": 30, "totalTokens": 480 },
      "costUsd": 0.0023
    }
  }
]
```

## Versioning

- Protocol version is in every event envelope (`version: "1.0"`)
- Breaking changes increment the major version
- Ingest API accepts multiple versions simultaneously during migration
- SDK sends the version it was built against; ingest normalizes to latest
