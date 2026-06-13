# Replay Engine

Replay is the ability to re-execute a failed (or any) agent run with the same inputs and compare the outcome. This is the "time travel" feature — the single most valuable debugging tool for agents.

## API

```typescript
// SDK
const result = await rift.replay('run_abc123', { mode: 'mock_tools' });

// REST
POST /v1/runs/run_abc123/replay
{ "mode": "mock_tools" }

// CLI (future)
npx @rift/cli replay run_abc123 --mode mock_tools

// Dashboard
Click "Replay" button on run detail page
```

## Replay Modes

| Mode | LLM Calls | Tool Calls | Deterministic | Use Case |
|------|-----------|------------|---------------|----------|
| `full` | Live | Live | No | Reproduce with real APIs |
| `mock_tools` | Live | Recorded responses | Partial | Isolate LLM vs tool issues |
| `mock_all` | Recorded | Recorded | Yes | Verify fix without API costs |
| `step` | Configurable | Configurable | No | Interactive step-by-step debug |

**Default:** `mock_tools` — live LLM with recorded tool responses. Best balance of fidelity and isolation.

## How Replay Works

### 1. Run Snapshot

When a run completes, the worker stores a **replay snapshot**:

```typescript
interface RunSnapshot {
  runId: string;
  projectId: string;
  agent: {
    name: string;
    framework: string;
    model: string;
    systemPrompt?: string;
    tools: ToolDefinition[];
  };
  input: unknown;
  originalOutput?: unknown;
  originalStatus: RunStatus;
  spans: SpanSnapshot[];
  config: {
    temperature?: number;
    maxTokens?: number;
    environment: string;
    version?: string;          // git sha at time of run
  };
  recordedResponses: {
    llm: Record<string, LlmCompletionData>;     // keyed by spanId
    tools: Record<string, ToolOutputData>;       // keyed by spanId
    memory: Record<string, MemoryResultsData>;   // keyed by spanId
  };
}
```

Stored in S3: `snapshots/{project_id}/{run_id}.json`

### 2. Sandbox Execution

The replay engine spins up an isolated environment:

```
Replay Orchestrator
  │
  ├── Load snapshot from S3
  ├── Select sandbox runtime:
  │     ├── Docker container (default)
  │     └── Serverless isolate (future)
  ├── Inject recorded responses as mocks (based on mode)
  ├── Install SDK + framework adapter
  ├── Execute agent with original input
  ├── Capture new trace via SDK
  └── Compare new trace vs original
```

**Sandbox requirements:**
- Network-isolated (no access to production services)
- Configurable timeout (default: 5 minutes)
- Resource limits (CPU, memory)
- Automatic cleanup after execution

### 3. Diff Comparison

After replay completes, the engine compares step-by-step:

```typescript
interface ReplayDiff {
  status: 'identical' | 'diverged' | 'error';
  steps: Array<{
    spanId: string;
    spanName: string;
    spanType: SpanType;
    match: boolean;
    original?: unknown;
    replayed?: unknown;
    divergence?: {
      field: string;
      original: unknown;
      replayed: unknown;
    };
  }>;
  summary: {
    totalSteps: number;
    matchedSteps: number;
    divergedSteps: number;
    divergencePoint?: string;   // spanId where paths diverged
  };
}
```

### 4. Dashboard Display

Side-by-side view:

```
┌──────────────────────────┬──────────────────────────┐
│  Original (run_abc123)   │  Replay (replay_xyz789)  │
├──────────────────────────┼──────────────────────────┤
│  ✓ llm_call: gpt-4o     │  ✓ llm_call: gpt-4o     │
│    → tool_call: search   │    → tool_call: search   │
│  ✗ tool: search_docs    │  ✓ tool: search_docs    │  ← divergence
│    "Index not found"     │    "3 results found"     │
│  ✗ run ended: error      │  ✓ run ended: success    │
└──────────────────────────┴──────────────────────────┘
```

## Mock Injection

In `mock_tools` and `mock_all` modes, the replay sandbox intercepts calls:

```typescript
// Tool mock interceptor (injected into sandbox)
function createToolMock(recordedResponses: Record<string, ToolOutputData>) {
  return function mockTool(toolName: string, args: unknown, spanId: string) {
    const recorded = recordedResponses[spanId];
    if (recorded) {
      return recorded.result;  // return recorded response
    }
    throw new Error(`No recorded response for tool ${toolName} (span ${spanId})`);
  };
}
```

For `mock_all`, LLM calls are similarly intercepted with recorded completions.

## Replay in the Remediation Loop

Replay is not just for debugging — it's part of the fix verification loop:

```
1. Failure detected
2. Developer triggers remediation → PR created
3. PR merged
4. Auto-replay with mode: mock_all
5. If replay succeeds → remediation status: verified
6. If replay fails → remediation status: failed, notify developer
```

## Constraints & Limitations

| Constraint | Mitigation |
|------------|------------|
| Non-deterministic LLM outputs | `mock_all` mode for deterministic comparison |
| External state changed since original run | `mock_tools` replays tools with recorded responses |
| Agent code changed since original run | Snapshot includes `version` (git sha) — warn if HEAD differs |
| Long-running agents (> 5 min) | Configurable timeout; step mode for manual progression |
| Memory state drift | Recorded memory results used in mock modes |

## Planned File Structure

```
packages/replay/
├── README.md
├── src/
│   ├── index.ts
│   ├── orchestrator.ts       # Main replay orchestration
│   ├── snapshot.ts           # Load/save run snapshots
│   ├── sandbox.ts            # Docker sandbox management
│   ├── mock/
│   │   ├── tool-mock.ts      # Tool response interceptor
│   │   ├── llm-mock.ts       # LLM response interceptor
│   │   └── memory-mock.ts    # Memory response interceptor
│   ├── diff.ts               # Step-by-step comparison
│   └── types.ts
├── package.json
└── tsconfig.json
```

## Security

- Sandbox containers have no network access to production
- Recorded responses may contain sensitive data — same retention policy as events
- Replay requires project-level permission (not just API key)
- Sandbox is destroyed after execution (no persistent state)
