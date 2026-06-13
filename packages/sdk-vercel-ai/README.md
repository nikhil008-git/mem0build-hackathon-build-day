# @rift/sdk-vercel-ai

> **Status:** Planned (Phase 1) — no code yet.

Vercel AI SDK adapter. Instruments `generateText`, `streamText`, and tool execution via middleware or wrapper.

## Usage (Planned)

```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { Rift } from '@rift/sdk-core';
import { riftMiddleware } from '@rift/sdk-vercel-ai';

const model = wrapLanguageModel({
  model: openai('gpt-4o'),
  middleware: riftMiddleware(rift),
});
```

## Documentation

- [Vercel AI SDK Integration](../../docs/integrations/vercel-ai-sdk.md)

## Peer Dependencies

- `@rift/sdk-core`
- `ai` >= 3.0.0
