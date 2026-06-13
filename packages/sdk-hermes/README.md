# @rift/sdk-hermes (Python)

Rift integration for **Nous Research Hermes Agent** — two roles:

1. **Telemetry plugin** — send agent runs to Rift dashboard
2. **Remediation worker** — Hermes analyzes failures and generates fix PRs

---

## Part 1: Telemetry (watch agents)

```bash
export RIFT_API_KEY=rift_test_demo_key
export RIFT_PROJECT_ID=demo
export RIFT_ENDPOINT=http://localhost:8081

cp -r packages/sdk-hermes/rift_plugin ~/.hermes/plugins/rift/
```

| Hermes hook | Rift event |
|-------------|------------|
| `on_session_start` | `run.started` |
| `pre_tool_call` | `tool.input` |
| `post_tool_call` | `tool.output` |
| `on_session_end` | `run.ended` |

---

## Part 2: Auto-fix PR (Fix with PR button)

When you click **Fix with PR** in the Rift dashboard, the remediation service calls this Hermes worker.

### Setup (WSL)

**Terminal 1 — Rift stack:**
```bash
npm run dev
```

**Terminal 2 — Hermes remediation worker:**
```bash
# Option A: OpenRouter fallback (fastest — no Hermes pip install needed)
export OPENROUTER_API_KEY=sk-or-...
npm run hermes:worker

# Option B: Full Hermes AIAgent (optional)
npm run hermes:setup    # one-time, installs into .venv
npm run hermes:worker
```

**Optional — real GitHub PRs** (add to root `.env`):
```env
GITHUB_REPO=gittt/rift-support-agent-demo
GITHUB_TOKEN=ghp_...              # leave empty for demo compare links
GITHUB_BASE_BRANCH=main
```

### Flow

```
Dashboard "Fix with PR"
  → apps/api (POST /v1/runs/:id/remediate)
  → apps/remediation (:8082)
  → Hermes worker (:8083) — AIAgent analyzes failure
  → GitHub API (optional) — opens PR with patch
  → Dashboard shows analysis + PR link
```

### Test the worker directly

```bash
curl -s http://localhost:8083/health
curl -s -X POST http://localhost:8083/analyze \
  -H 'Content-Type: application/json' \
  -d '{"runId":"run_test","errorType":"tool_error","errorMsg":"Index not found: docs_v2","agentName":"support-bot","framework":"vercel-ai","model":"gpt-4o","input":{},"output":{},"events":[]}'
```

---

## Requirements

- Hermes Agent installed: `pip install git+https://github.com/NousResearch/hermes-agent.git`
- API key configured (same as `hermes` CLI): `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, or `OPENAI_API_KEY`
