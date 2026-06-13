# @rift/sdk-openai

> **Status:** Planned (Phase 2) — no code yet.

OpenAI adapter. Instruments the OpenAI Agents SDK, Chat Completions, and Assistants API.

## Usage (Planned)

```typescript
import { Agent, run } from '@openai/agents';
import { withRiftAgent, wrapRunner } from '@rift/sdk-openai';

const agent = withRiftAgent(rift, new Agent({ name: 'Support', tools: [...] }));
const result = await wrapRunner(rift, () => run(agent, userMessage));
```

## Documentation

- [OpenAI Integration](../../docs/integrations/openai.md)

## Peer Dependencies

- `@rift/sdk-core`
- `@openai/agents` >= 0.1.0
- `openai` >= 4.0.0
