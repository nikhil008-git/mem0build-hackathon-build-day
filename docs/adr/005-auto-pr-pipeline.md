# ADR-005: Auto-PR Pipeline

**Status:** Accepted
**Date:** 2026-06-13

## Context

When an agent fails, developers need to diagnose, fix, test, and deploy — a multi-step process that can take hours. Rift aims to automate this with AI-generated code fixes delivered as GitHub PRs.

## Decision

Implement a **remediation agent** (LLM-powered) that analyzes failures and generates code patches, delivered via GitHub PRs with human review required.

### Pipeline Stages

1. **Context gathering** — failure details, reasoning chain, tool I/O, source code from GitHub
2. **Root cause analysis** — remediation agent explains what went wrong
3. **Code generation** — unified diff patch with optional test
4. **PR creation** — branch + commit + PR with full context
5. **Status tracking** — webhook-driven CI/review/merge status
6. **Verification** — post-merge replay to confirm fix

### Key Constraints

| Constraint | Value |
|-----------|-------|
| Auto-merge | Disabled by default |
| Max remediations per day | 5 per project |
| Max diff size | 500 lines |
| Minimum confidence | `medium` to create PR |
| Syntax validation | Required before PR creation |

### Remediation Agent Model

Use a capable model (GPT-4o or Claude) with structured output:

```
Input: RemediationContext (failure + trace + source code)
Output: RemediationResult (analysis + patch + confidence)
```

Not fine-tuned — prompt engineering with few-shot examples from past remediations.

## Rationale

- GitHub PRs fit existing developer workflows (review, CI, merge)
- Human review prevents bad auto-fixes from reaching production
- Replay verification closes the loop (fix actually works)
- Feedback from merged/rejected PRs improves future remediations

## Consequences

- Requires GitHub integration (OAuth or GitHub App)
- Remediation quality depends on LLM capability and context quality
- Not all failures are code-fixable (e.g., infrastructure issues, bad data)
- Cost: ~$0.05–0.20 per remediation (LLM tokens for analysis + code generation)
- Developers must link GitHub repos to projects

## Alternatives Considered

| Alternative | Why Rejected |
|------------|--------------|
| Auto-commit to main | Too dangerous; no review |
| Suggest fix in dashboard only | Doesn't close the loop; developer still does manual work |
| Jira/Linear ticket | Doesn't include the fix; just tracks the issue |
| Email fix suggestions | Poor UX; no integration with code review workflow |

## Success Criteria

| Metric | Target (6 months post-launch) |
|--------|-------------------------------|
| PR creation rate | > 60% of triggered remediations |
| PR merge rate (no edits) | > 40% |
| Post-merge replay pass rate | > 80% |
| Time from failure to PR | < 3 minutes |
