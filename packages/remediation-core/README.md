# @rift/remediation-core

> **Status:** Planned (Phase 3) — no code yet.

Remediation agent logic. Builds failure context, prompts an LLM to analyze root cause and generate code patches, and formats GitHub PR bodies.

## Exports

| Export | Description |
|--------|-------------|
| `RemediationAgent` | LLM-powered analysis and fix generation |
| `buildContext` | Assemble remediation context from failure data |
| `validatePatch` | Syntax-check generated code |
| `formatPRBody` | Generate PR description from remediation result |

## Documentation

- [Auto-Remediation](../../docs/platform/auto-remediation.md)
- [ADR-005: Auto-PR Pipeline](../../docs/adr/005-auto-pr-pipeline.md)
