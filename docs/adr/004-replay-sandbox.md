# ADR-004: Replay Sandbox Model

**Status:** Accepted
**Date:** 2026-06-13

## Context

Replay requires re-executing agent code in an isolated environment. The sandbox must prevent replays from affecting production systems while providing enough fidelity to reproduce failures.

## Decision

Use **Docker containers** as the default replay sandbox, with recorded response injection for deterministic modes.

### Sandbox Lifecycle

```
1. Orchestrator receives replay request
2. Pull sandbox image (project-specific or default)
3. Create container with:
   - Network: isolated (no production access)
   - Env: RIFT_REPLAY_MODE, RIFT_RUN_ID, recorded responses
   - Timeout: 5 minutes (configurable)
   - Memory: 512MB limit
4. Container executes agent with original input
5. SDK in container emits events to ingest-api (tagged as replay)
6. Orchestrator collects results, destroys container
7. Diff engine compares original vs replay
```

### Mock Injection

Recorded responses are injected via environment variables or a mounted JSON file:

```
/container/
  ├── replay-config.json     # mode, recorded responses
  ├── agent-code/            # mounted from snapshot (or git checkout)
  └── run.sh                 # entrypoint
```

The SDK in the container reads `replay-config.json` and intercepts tool/LLM calls based on mode.

### Default Sandbox Image

```
rift-sandbox:latest
  ├── Node.js 20
  ├── @rift/sdk-core
  ├── @rift/sdk-vercel-ai (or project-specific adapter)
  └── replay-runner script
```

Projects can specify a custom image via `ProjectSettings.replaySandboxImage`.

## Rationale

- Docker provides strong isolation without building a custom runtime
- Recorded response injection enables deterministic replay without production API calls
- Container-per-replay is simple and stateless (no cleanup issues)
- 5-minute timeout prevents runaway replays

## Consequences

- Requires Docker runtime in production (Fly.io supports this)
- Cold start latency: 2–5 seconds per replay (image pull + container start)
- Cannot replay browser-based agents (Node.js only for Phase 1)
- Custom sandbox images require documentation for project-specific setups

## Alternatives Considered

| Alternative | Why Rejected |
|------------|--------------|
| Serverless functions (Lambda) | 15-min limit ok, but hard to inject mocks; cold starts worse |
| In-process replay | No isolation; replay could affect production state |
| Firecracker microVMs | Better isolation but much more complex infrastructure |
| WASM sandbox | Limited Node.js ecosystem support |

## Future

Phase 3 may add serverless isolate support (Cloudflare Workers) for faster cold starts on simple replays.
