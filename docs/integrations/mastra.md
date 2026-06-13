# Mastra Integration

Adapter package: `@rift/sdk-mastra`

## Overview

[Mastra](https://mastra.ai) is a TypeScript agent framework with workflows, tools, and memory. The Rift adapter hooks into Mastra's middleware and step execution system.

## Target APIs

| Mastra API | Rift Coverage |
|-----------|---------------|
| `Mastra` instance | Middleware registration |
| Workflows / Steps | Step-level span capture |
| Tools | Tool input/output |
| Memory (LibSQL, etc.) | Memory read/write events |
| Agents | Agent run lifecycle |
| `createStep()` | Individual step spans |

## Integration (Planned)

### Middleware Approach

```typescript
import { Mastra } from '@mastra/core';
import { Rift } from '@rift/sdk-core';
import { riftMiddleware } from '@rift/sdk-mastra';

const rift = new Rift({ apiKey: '...', projectId: '...' });

const mastra = new Mastra({
  middleware: [riftMiddleware(rift)],
  agents: { supportAgent },
  workflows: { supportWorkflow },
});
```

### Per-Agent Wrapping

```typescript
import { withRiftMastraAgent } from '@rift/sdk-mastra';

const supportAgent = withRiftMastraAgent(rift, {
  name: 'support-agent',
  instructions: '...',
  model: openai('gpt-4o'),
  tools: { searchDocs, createTicket },
});
```

### Workflow Instrumentation

```typescript
import { withRiftWorkflow } from '@rift/sdk-mastra';

const supportWorkflow = withRiftWorkflow(rift, createWorkflow({
  name: 'support-flow',
  steps: [
    classifyStep,
    searchStep,
    respondStep,
  ],
}));
```

## Event Mapping

| Mastra Event | REP Event | Span |
|-------------|-----------|------|
| Agent invoked | `run.started` | — |
| Workflow started | `span.started` (agent_step) | workflow span |
| Step executed | `span.started` + `span.ended` | step span |
| LLM call within step | `llm.prompt` + `llm.completion` | `llm_call` span |
| Tool executed | `tool.input` + `tool.output` | `tool_call` span |
| Memory read | `memory.query` + `memory.results` | `memory_read` span |
| Memory write | `memory.write` | `memory_write` span |
| Workflow completed | `run.ended` | — |
| Error thrown | `error` + `run.ended` (error) | — |

## Workflow Span Tree

```
run.started (workflow: support-flow)
  ├── span: step (classify)
  │     └── span: llm_call (gpt-4o)
  ├── span: step (search)
  │     ├── span: llm_call (gpt-4o)
  │     └── span: tool_call (search_docs)
  ├── span: step (respond)
  │     ├── span: memory_read (conversation)
  │     └── span: llm_call (gpt-4o)
  └── run.ended (success)
```

## Memory Integration

Mastra supports multiple memory backends. The adapter captures:

```typescript
// When Mastra reads from memory
rift.emit('memory.query', {
  store: 'libsql',
  query: 'recent conversation context',
  topK: 10,
});

// When results are returned
rift.emit('memory.results', {
  store: 'libsql',
  results: [{ id: '1', content: '...', score: 0.95 }],
  latencyMs: 45,
});
```

## Planned File Structure

```
packages/sdk-mastra/
├── README.md
├── src/
│   ├── index.ts
│   ├── middleware.ts           # Mastra middleware hook
│   ├── agent.ts                # withRiftMastraAgent
│   ├── workflow.ts             # withRiftWorkflow
│   ├── memory.ts               # Memory operation hooks
│   └── types.ts
├── package.json
└── tsconfig.json
```

## Dependencies

```json
{
  "peerDependencies": {
    "@rift/sdk-core": "workspace:*",
    "@mastra/core": ">=0.1.0"
  }
}
```
