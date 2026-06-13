# @rift/sdk-mastra

> **Status:** Planned (Phase 2) — no code yet.

Mastra adapter. Instruments Mastra agents, workflows, tools, and memory via middleware.

## Usage (Planned)

```typescript
import { Mastra } from '@mastra/core';
import { riftMiddleware } from '@rift/sdk-mastra';

const mastra = new Mastra({
  middleware: [riftMiddleware(rift)],
  agents: { supportAgent },
});
```

## Documentation

- [Mastra Integration](../../docs/integrations/mastra.md)

## Peer Dependencies

- `@rift/sdk-core`
- `@mastra/core` >= 0.1.0
