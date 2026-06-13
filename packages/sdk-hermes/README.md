# @rift/sdk-hermes (Python)

Rift plugin for **Nous Research Hermes Agent**. Sends agent lifecycle events to the Rift ingest API.

## Setup

```bash
export RIFT_API_KEY=rift_test_demo_key
export RIFT_PROJECT_ID=demo
export RIFT_ENDPOINT=http://localhost:8081

# Copy plugin into Hermes plugins dir
cp -r packages/sdk-hermes/rift_plugin ~/.hermes/plugins/rift/
```

Or install when published:

```bash
pip install -e packages/sdk-hermes
```

## Hooks mapped

| Hermes hook | Rift event |
|-------------|------------|
| `on_session_start` | `run.started` |
| `pre_tool_call` | `tool.input` |
| `post_tool_call` | `tool.output` |
| `on_session_end` | `run.ended` |

## Phase 3

Remediation service will call Nous Hermes `AIAgent` to generate real code fixes and open GitHub PRs.
