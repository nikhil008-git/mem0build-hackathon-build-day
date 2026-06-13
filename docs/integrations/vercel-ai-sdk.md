# Vercel AI SDK Integration

Adapter package: `@rift/sdk-vercel-ai`

## Overview

The Vercel AI SDK (`ai` package) is the most common agent framework in the Next.js ecosystem. The Rift adapter wraps `generateText`, `streamText`, and tool execution to automatically emit REP events.

## Target APIs

| Vercel AI SDK API | Rift Coverage |
|-------------------|---------------|
| `generateText()` | Full — prompt, completion, tool calls |
| `streamText()` | Full — prompt, streamed completion, tool calls |
| `generateObject()` | Full — prompt, structured output |
| `streamObject()` | Full — prompt, streamed structured output |
| `tool()` definitions | Tool input/output capture |
| `maxSteps` / agent loop | Each step captured as spans |

## Integration (Planned)

### Option A: Wrapper Function

```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { Rift } from '@rift/sdk-core';
import { withRift } from '@rift/sdk-vercel-ai';

const rift = new Rift({ apiKey: '...', projectId: '...' });

const result = await withRift(rift, () =>
  streamText({
    model: openai('gpt-4o'),
    system: 'You are a support agent.',
    messages: [{ role: 'user', content: userMessage }],
    tools: {
      search_docs: tool({
        description: 'Search documentation',
        parameters: z.object({ query: z.string() }),
        execute: async ({ query }) => searchDocs(query),
      }),
    },
    maxSteps: 5,
  })
);
```

### Option B: Middleware (Preferred)

```typescript
import { streamText, wrapLanguageModel } from 'ai';
import { riftMiddleware } from '@rift/sdk-vercel-ai';

const model = wrapLanguageModel({
  model: openai('gpt-4o'),
  middleware: riftMiddleware(rift),
});

const result = await streamText({
  model,
  messages,
  tools,
  maxSteps: 5,
});
```

Middleware is preferred because it:
- Captures LLM calls at the model level (works with any tool setup)
- Doesn't require wrapping the entire `streamText` call
- Supports streaming token capture

## Event Mapping

| Vercel AI SDK Event | REP Event | Span |
|---------------------|-----------|------|
| `streamText()` called | `run.started` | — |
| Model prompt sent | `llm.prompt` | `llm_call` span |
| Model token streamed | (buffered) | — |
| Model completion finished | `llm.completion` | `llm_call` span end |
| Tool call requested by model | `llm.completion` (with toolCalls) | — |
| Tool `execute()` called | `tool.input` | `tool_call` span |
| Tool returns result | `tool.output` | `tool_call` span end |
| Tool throws error | `tool.error` | `tool_call` span end (error) |
| Agent loop step | `span.started` (agent_step) | `agent_step` span |
| `streamText()` returns | `run.ended` | — |

## Streaming Capture

For `streamText()`, tokens arrive incrementally. The adapter:

1. Opens an `llm_call` span when the model starts
2. Buffers streamed tokens in memory
3. Emits `llm.completion` when the stream finishes (with full content)
4. Does NOT emit per-token events (too noisy)

## Multi-Step Agent Loop

Vercel AI SDK's `maxSteps` creates an agent loop. The adapter captures each step:

```
run.started
  ├── span: agent_step (step 1)
  │     ├── span: llm_call (gpt-4o)
  │     │     ├── llm.prompt
  │     │     └── llm.completion (tool_call: search_docs)
  │     └── span: tool_call (search_docs)
  │           ├── tool.input
  │           └── tool.output
  ├── span: agent_step (step 2)
  │     └── span: llm_call (gpt-4o)
  │           ├── llm.prompt (with tool results)
  │           └── llm.completion (final answer)
  └── run.ended
```

## Configuration

```typescript
import { configureRiftVercelAI } from '@rift/sdk-vercel-ai';

configureRiftVercelAI({
  captureStreamedTokens: false,  // don't emit per-token events
  captureToolDefinitions: true,  // include tool schemas in metadata
  agentName: 'support-bot',      // default agent name for runs
});
```

## Planned File Structure

```
packages/sdk-vercel-ai/
├── README.md
├── src/
│   ├── index.ts
│   ├── with-rift.ts            # Wrapper function approach
│   ├── middleware.ts           # LanguageModelV1Middleware
│   ├── tools.ts                # Tool execution wrapper
│   ├── stream.ts               # Stream token buffering
│   └── types.ts
├── package.json
└── tsconfig.json
```

## Dependencies

```json
{
  "peerDependencies": {
    "@rift/sdk-core": "workspace:*",
    "ai": ">=3.0.0"
  }
}
```
