# remediation

> **Status:** Planned (Phase 3) — no code yet.

Auto-remediation service. Analyzes agent failures, generates code fixes via an LLM remediation agent, creates GitHub PRs, and tracks fix verification.

## Pipeline

1. **Gather** — failure context, reasoning chain, source code from GitHub
2. **Analyze** — root cause analysis via remediation agent
3. **Generate** — code patch (unified diff)
4. **PR** — create GitHub branch, commit, and pull request
5. **Verify** — post-merge replay to confirm fix

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/runs/:id/remediate` | Trigger remediation |
| `POST` | `/v1/webhooks/github` | GitHub webhook handler |

## Documentation

- [Auto-Remediation](../../docs/platform/auto-remediation.md)
- [GitHub Integration](../../docs/integrations/github.md)
- [ADR-005: Auto-PR Pipeline](../../docs/adr/005-auto-pr-pipeline.md)

## Dependencies

- `@rift/remediation-core` — remediation agent logic
- `@rift/replay` — post-merge verification
- `@repo/db` — remediation records
- GitHub API — PR creation and status

## Port

`8082` (local development)
