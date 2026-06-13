# Auto-Remediation

Auto-remediation closes the loop from failure to fix. When an agent run fails, Rift can analyze the failure, generate a code fix, create a GitHub PR, and verify the fix — all tracked in the dashboard.

## Flow

```
Failure Detected
       │
       ▼
Developer clicks "Remediate" (or auto-remediate is enabled)
       │
       ▼
┌─────────────────────────────────┐
│  1. Context Gathering           │
│  - Failure details              │
│  - Full reasoning chain         │
│  - Tool inputs/outputs          │
│  - Stack trace                  │
│  - Source code (via GitHub)     │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│  2. Root Cause Analysis         │
│  (Remediation Agent — LLM)      │
│  - Why did this fail?           │
│  - Which file/function?         │
│  - What's the fix?              │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│  3. Code Generation             │
│  - Generate patch (unified diff)│
│  - Include test if possible     │
│  - Validate syntax              │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│  4. PR Creation                 │
│  - Branch: rift/fix/run_{id}   │
│  - Commit with patch            │
│  - PR with full context         │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│  5. Status Tracking             │
│  - CI status via webhook        │
│  - Review status                │
│  - Merge detection              │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│  6. Verification                │
│  - Replay with mock_all         │
│  - Compare: fixed vs original   │
│  - Update dashboard status      │
└─────────────────────────────────┘
```

## Remediation Agent

The remediation agent is an LLM-powered analysis engine in `packages/remediation-core`.

### Input Context

```typescript
interface RemediationContext {
  // Failure
  failure: {
    type: FailureType;
    message: string;
    stack?: string;
    spanId?: string;
  };

  // Run trace
  run: {
    input: unknown;
    output?: unknown;
    agent: string;
    model: string;
    framework: string;
  };

  // Reasoning chain
  reasoningChain: Array<{
    role: string;
    content: string;
    toolCalls?: unknown[];
  }>;

  // Tool details
  toolCalls: Array<{
    name: string;
    input: unknown;
    output?: unknown;
    error?: string;
    latencyMs: number;
  }>;

  // Source code (fetched from GitHub)
  sourceFiles: Array<{
    path: string;
    content: string;
    language: string;
  }>;

  // Project context
  project: {
    repoUrl: string;
    defaultBranch: string;
    relevantPaths: string[];   // agent code directories
  };
}
```

### Output

```typescript
interface RemediationResult {
  analysis: string;            // Markdown root cause explanation
  rootCause: {
    file: string;
    line?: number;
    function?: string;
    explanation: string;
  };
  fix: {
    files: Array<{
      path: string;
      patch: string;           // Unified diff format
    }>;
    testFile?: {
      path: string;
      content: string;
    };
    confidence: 'high' | 'medium' | 'low';
  };
}
```

### Prompt Strategy

The remediation agent uses a structured prompt:

1. **Analyze:** Given the failure context, explain what went wrong and why
2. **Locate:** Identify the exact file and function responsible
3. **Fix:** Generate a minimal patch that fixes the root cause (not symptoms)
4. **Test:** If possible, generate a test that would catch this failure
5. **Validate:** Self-check — would this fix prevent the recorded failure on replay?

## GitHub PR Pipeline

### Prerequisites

- GitHub OAuth connection in dashboard settings
- Repository linked to project
- GitHub App or OAuth token with `repo` + `pull_request` scopes

### PR Creation

```typescript
interface PRRequest {
  repo: string;                // "owner/repo"
  branch: string;              // "rift/fix/run_abc123"
  baseBranch: string;          // "main"
  title: string;               // "fix: handle missing index in search_docs tool"
  body: string;                // Markdown with full context
  files: Array<{
    path: string;
    content: string;           // Full file content (not just diff)
  }>;
}
```

### PR Body Template

```markdown
## Rift Auto-Remediation

**Run:** [run_abc123](https://dashboard.rift.dev/runs/run_abc123)
**Failure:** tool_error — Index not found: docs_v2
**Agent:** support-bot (gpt-4o, vercel-ai)
**Severity:** high (12 occurrences)

### Root Cause

The `search_docs` tool queries Pinecone index `docs_v2`, but the index was
renamed to `docs_v3` in commit abc1234. The tool definition still references
the old index name.

### Fix

Updated index name in `tools/search-docs.ts` from `docs_v2` to `docs_v3`.

### Replay

- [Original run](https://dashboard.rift.dev/runs/run_abc123) (failed)
- [Replay result](https://dashboard.rift.dev/replays/replay_xyz) (pending verification)

---
*This PR was automatically generated by [Rift](https://rift.dev). Review carefully before merging.*
```

### Branch Naming

```
rift/fix/run_{run_id}          # Standard fix
rift/fix/fail_{fingerprint}    # Fix for grouped failure
```

## Webhook Integration

GitHub webhooks update remediation status in real time:

| GitHub Event | Remediation Status |
|-------------|-------------------|
| `pull_request.opened` | `pr_opened` |
| `check_run.completed` (success) | `ci_passed` |
| `check_run.completed` (failure) | `ci_failed` |
| `pull_request.merged` | `merged` → trigger verification replay |
| `pull_request.closed` (not merged) | `failed` |

Webhook endpoint: `POST /v1/webhooks/github`

## Auto-Remediate Mode

Projects can enable automatic remediation (no manual trigger):

```typescript
interface ProjectSettings {
  autoRemediate: boolean;      // default: false
  autoRemediateMinSeverity: 'high' | 'critical';  // only auto-fix high+ severity
  autoRemediateMaxPerDay: number;  // rate limit (default: 5)
}
```

When enabled:
1. Worker detects failure with severity >= threshold
2. Automatically triggers remediation pipeline
3. PR created without human intervention
4. Dashboard shows remediation in progress
5. Developer reviews PR before merge (always requires human merge unless explicitly configured)

## Safety Guardrails

| Guardrail | Description |
|-----------|-------------|
| Human review required | PRs are never auto-merged by default |
| Rate limiting | Max 5 auto-remediations per day per project |
| Confidence threshold | Only create PR if remediation agent confidence >= medium |
| Syntax validation | Generated code must pass AST parsing before PR creation |
| Diff size limit | Max 500 lines changed per remediation |
| Protected branches | Never push directly to main — always via PR |
| Test requirement | If CI is configured, PR must pass CI before verification |

## Dashboard Integration

### Remediation Status Card

Shown on failure detail and run detail pages:

```
┌─────────────────────────────────────────┐
│  Remediation Status                      │
│                                          │
│  ● Analyzing root cause...        [30s] │
│  ○ Generating fix                        │
│  ○ Creating PR                           │
│  ○ CI verification                       │
│  ○ Replay verification                   │
│                                          │
│  [Cancel]                                │
└─────────────────────────────────────────┘
```

### Remediation History

On failure detail — list of all remediation attempts for this failure group:

| Attempt | Status | PR | Created |
|---------|--------|----|---------|
| rem_001 | verified ✓ | [#42](link) | 2h ago |
| rem_002 | ci_failed ✗ | [#43](link) | 1h ago |

## Planned File Structure

```
apps/remediation/
├── README.md
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── remediate.ts      # POST /v1/runs/:id/remediate
│   │   └── webhooks.ts       # POST /v1/webhooks/github
│   ├── pipeline/
│   │   ├── gather.ts         # Context gathering
│   │   ├── analyze.ts        # Root cause analysis
│   │   ├── generate.ts       # Code generation
│   │   ├── pr.ts             # GitHub PR creation
│   │   └── verify.ts         # Post-merge replay
│   └── services/
│       ├── github.ts
│       └── llm.ts
├── package.json
└── tsconfig.json

packages/remediation-core/
├── README.md
├── src/
│   ├── index.ts
│   ├── agent.ts              # Remediation agent (LLM prompts)
│   ├── context.ts            # Context builder
│   ├── patch.ts              # Diff generation and validation
│   ├── pr-template.ts        # PR body templates
│   └── types.ts
├── package.json
└── tsconfig.json
```

## Improvement Feedback Loop

After remediation, the platform learns:

| Signal | Action |
|--------|--------|
| PR merged without edits | Increase confidence for similar failure patterns |
| PR merged with edits | Store diff between generated and final fix for prompt improvement |
| PR rejected | Log as negative example |
| Replay verified | Mark failure as resolved |
| Same failure recurs after fix | Reopen failure, link to previous remediation |

This feedback is stored and used to improve remediation agent prompts over time (not model fine-tuning — prompt engineering with examples).
