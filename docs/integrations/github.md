# GitHub Integration

GitHub is the delivery mechanism for auto-remediation. Rift connects to GitHub to fetch source code for analysis, create fix PRs, and track CI/review status.

## Setup

### 1. GitHub App (Recommended)

Register a GitHub App with permissions:

| Permission | Access | Purpose |
|-----------|--------|---------|
| Contents | Read & Write | Read source, push fix branches |
| Pull Requests | Read & Write | Create and update PRs |
| Checks | Read | Monitor CI status |
| Metadata | Read | Repository info |

Events to subscribe:
- `pull_request` (opened, closed, merged)
- `check_run` (completed)
- `push` (to track fix branch updates)

### 2. OAuth Connection (Dashboard)

For simpler setup, users connect via OAuth in dashboard settings:

```
Dashboard → Settings → GitHub → Connect
  → GitHub OAuth flow
  → Store encrypted token in GitHubConnection record
  → Select repositories to link to projects
```

## Data Model

```typescript
interface GitHubConnection {
  id: string;
  organizationId: string;
  installationId?: number;     // GitHub App installation
  oauthToken?: string;           // encrypted OAuth token
  accountLogin: string;          // "acme-corp"
  accountType: 'User' | 'Organization';
  repositories: GitHubRepo[];
  createdAt: Date;
}

interface GitHubRepo {
  id: string;
  connectionId: string;
  projectId: string;            // linked Rift project
  fullName: string;             // "acme-corp/support-agent"
  defaultBranch: string;        // "main"
  relevantPaths: string[];      // ["src/tools/", "src/agents/"]
}
```

## Source Code Fetching

When remediation needs source code:

```
1. Identify relevant files from failure context:
   - Tool name → src/tools/{toolName}.ts
   - Stack trace → file paths in trace
   - Agent name → src/agents/{agentName}/

2. Fetch via GitHub API:
   GET /repos/{owner}/{repo}/contents/{path}?ref={branch}

3. Cache in remediation context (not persisted long-term)
```

## PR Creation Flow

```
1. Create branch
   POST /repos/{owner}/{repo}/git/refs
   { "ref": "refs/heads/rift/fix/run_abc123", "sha": "{base_sha}" }

2. Commit files
   POST /repos/{owner}/{repo}/git/trees     (create tree with changes)
   POST /repos/{owner}/{repo}/git/commits   (create commit)
   PATCH /repos/{owner}/{repo}/git/refs/heads/rift/fix/run_abc123

3. Open PR
   POST /repos/{owner}/{repo}/pulls
   {
     "title": "fix: handle missing index in search_docs tool",
     "body": "{remediation PR template}",
     "head": "rift/fix/run_abc123",
     "base": "main"
   }
```

## Webhook Handler

Endpoint: `POST /v1/webhooks/github`

```typescript
// Webhook event processing
switch (event) {
  case 'pull_request':
    if (action === 'opened') updateRemediation(prNumber, 'pr_opened');
    if (action === 'closed' && merged) {
      updateRemediation(prNumber, 'merged');
      triggerVerificationReplay(runId);
    }
    if (action === 'closed' && !merged) updateRemediation(prNumber, 'failed');
    break;

  case 'check_run':
    if (conclusion === 'success') updateRemediation(prNumber, 'ci_passed');
    if (conclusion === 'failure') updateRemediation(prNumber, 'ci_failed');
    break;
}
```

Webhook signature verification via `X-Hub-Signature-256`.

## Dashboard UI

### Settings → GitHub

```
┌─────────────────────────────────────────┐
│  GitHub Integration                      │
│                                          │
│  Connected: acme-corp (Organization)   │
│  [Disconnect]                            │
│                                          │
│  Linked Repositories:                    │
│  ┌────────────────────────────────────┐  │
│  │ acme-corp/support-agent            │  │
│  │ Project: Support Bot               │  │
│  │ Paths: src/tools/, src/agents/     │  │
│  │ [Configure] [Unlink]              │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [+ Link Repository]                     │
└─────────────────────────────────────────┘
```

### PR Status on Failure Detail

```
┌─────────────────────────────────────────┐
│  GitHub PR #42                           │
│  fix: handle missing index in search_docs│
│                                          │
│  Status: ● CI passed                     │
│  Branch: rift/fix/run_abc123 → main     │
│  [View on GitHub]                        │
└─────────────────────────────────────────┘
```

## Security

| Concern | Mitigation |
|---------|------------|
| Token storage | Encrypted at rest (AES-256-GCM) |
| Token scope | Minimum required permissions |
| Branch protection | Never push to protected branches directly |
| PR content | Generated code reviewed by human before merge |
| Webhook verification | HMAC-SHA256 signature check |
| Rate limiting | GitHub API rate limits respected with backoff |

## GitHub API Rate Limits

| Auth Method | Limit |
|------------|-------|
| GitHub App | 5,000 req/hour per installation |
| OAuth token | 5,000 req/hour per user |

Remediation pipeline typically uses 5–10 API calls per fix (well within limits).

## Planned File Structure

```
apps/remediation/src/services/github.ts    # GitHub API client
apps/api/src/routes/webhooks/github.ts       # Webhook handler
packages/remediation-core/src/pr-template.ts # PR body generation
```
