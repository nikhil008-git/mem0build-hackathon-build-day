# OpenAI Integration

Adapter package: `@rift/sdk-openai`

## Overview

Covers the OpenAI Agents SDK, Assistants API, and direct OpenAI API usage patterns.

## Target APIs

| OpenAI API | Rift Coverage |
|-----------|---------------|
| Agents SDK (`Agent`, `Runner`) | Full — agent loop, tool calls, handoffs |
| Chat Completions (`openai.chat.completions.create`) | Full — prompt, completion, tool calls |
| Assistants API (`openai.beta.assistants`) | Runs, thread messages, tool outputs |
| Function calling | Tool input/output capture |
| Agent handoffs | Captured as span transitions |

## Integration (Planned)

### OpenAI Agents SDK

```typescript
import { Agent, run } from '@openai/agents';
import { Rift } from '@rift/sdk-core';
import { withRiftAgent, wrapRunner } from '@rift/sdk-openai';

const rift = new Rift({ apiKey: '...', projectId: '...' });

const agent = withRiftAgent(rift, new Agent({
  name: 'Support Agent',
  instructions: 'You help customers.',
  tools: [searchDocs, createTicket],
}));

const result = await wrapRunner(rift, () =>
  run(agent, userMessage)
);
```

### Direct Chat Completions

```typescript
import OpenAI from 'openai';
import { wrapOpenAI } from '@rift/sdk-openai';

const openai = wrapOpenAI(new OpenAI(), rift);

const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages,
  tools,
});
```

### Assistants API

```typescript
import { wrapAssistantRunner } from '@rift/sdk-openai';

const run = await wrapAssistantRunner(rift, () =>
  openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
  })
);
```

## Event Mapping

| OpenAI Event | REP Event | Span |
|-------------|-----------|------|
| Agent run started | `run.started` | — |
| Model call | `llm.prompt` + `llm.completion` | `llm_call` |
| Function call requested | `llm.completion` (toolCalls) | — |
| Function executed | `tool.input` + `tool.output` | `tool_call` |
| Function error | `tool.error` | `tool_call` (error) |
| Agent handoff | `span.ended` + `span.started` | transition between agents |
| Run completed | `run.ended` | — |
| Run failed | `run.ended` (error) | — |

## Agent Handoffs

OpenAI Agents SDK supports handoffs between agents. The adapter captures these as:

```
run.started (agent: triage-agent)
  ├── span: llm_call
  │     └── completion: handoff → support-agent
  ├── span: agent_step (handoff: triage → support)
  ├── span: llm_call (agent: support-agent)
  │     └── completion: tool_call → search_docs
  └── run.ended
```

## Token Usage & Cost

OpenAI responses include `usage` field. The adapter extracts:

```typescript
{
  promptTokens: response.usage.prompt_tokens,
  completionTokens: response.usage.completion_tokens,
  totalTokens: response.usage.total_tokens,
}
```

Cost is calculated by `@rift/cost-calculator` based on model and token counts.

## Planned File Structure

```
packages/sdk-openai/
├── README.md
├── src/
│   ├── index.ts
│   ├── agent.ts                # withRiftAgent, wrapRunner
│   ├── chat.ts                 # wrapOpenAI (chat completions)
│   ├── assistant.ts            # wrapAssistantRunner
│   ├── handoff.ts              # Agent handoff capture
│   └── types.ts
├── package.json
└── tsconfig.json
```

## Dependencies

```json
{
  "peerDependencies": {
    "@rift/sdk-core": "workspace:*",
    "@openai/agents": ">=0.1.0",
    "openai": ">=4.0.0"
  }
}
```
