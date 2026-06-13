# @rift/replay

> **Status:** Planned (Phase 3) — no code yet.

Replay engine. Loads run snapshots, orchestrates sandbox execution, injects recorded responses, and diffs original vs replayed output.

## Exports

| Export | Description |
|--------|-------------|
| `ReplayOrchestrator` | Main replay coordinator |
| `loadSnapshot` | Load run snapshot from S3 |
| `createSandbox` | Spin up Docker container |
| `diffRuns` | Compare original vs replay traces |

## Replay Modes

- `full` — live LLM + live tools
- `mock_tools` — live LLM, recorded tool responses (default)
- `mock_all` — all recorded responses (deterministic)
- `step` — interactive step-by-step

## Documentation

- [Replay Engine](../../docs/platform/replay.md)
- [ADR-004: Replay Sandbox](../../docs/adr/004-replay-sandbox.md)
