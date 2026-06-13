# @rift/sdk-core

> **Status:** Planned (Phase 1) — no code yet.

Core Rift SDK. Provides the `Rift` client, run/span lifecycle, event batching, transport to ingest-api, and the `replay()` API.

## Usage (Planned)

```typescript
import { Rift } from '@rift/sdk-core';

const rift = new Rift({
  apiKey: process.env.RIFT_API_KEY!,
  projectId: 'proj_xyz789',
});

const run = rift.startRun({ agent: 'support-bot', input: { message } });
// ... agent executes ...
run.end({ status: 'success', output });
```

## Exports

| Export | Description |
|--------|-------------|
| `Rift` | Main client class |
| `RunContext` | Active run handle |
| `Span` | Span within a run |
| `ReplayOptions` | Replay configuration |
| `ReplayResult` | Replay outcome |

## Documentation

- [SDK Design](../../docs/platform/sdk.md)
- [Event Schema](../../docs/architecture/event-schema.md)

## Dependencies

- `@rift/observability-types` — event types
