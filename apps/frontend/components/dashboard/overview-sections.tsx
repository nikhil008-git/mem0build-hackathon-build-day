import Link from "next/link";
import type { RunSummary } from "@/lib/rift-api";
import { groupByErrorType } from "@/lib/dashboard-analytics";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";

export function FailureSignals({ runs }: { runs: RunSummary[] }) {
  const signals = groupByErrorType(runs);
  const max = Math.max(...signals.map((s) => s.count), 1);

  if (signals.length === 0) {
    return (
      <Card elevated className="p-8">
        <p className="text-sm text-[var(--muted)]">No failure signals yet. All agents running clean.</p>
      </Card>
    );
  }

  return (
    <Card elevated className="divide-y divide-black">
      {signals.map((signal) => (
        <div key={signal.type} className="p-6">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide">{formatErrorLabel(signal.type)}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{describeError(signal.type)}</p>
            </div>
            <span className="display-headline text-2xl">{signal.count}</span>
          </div>
          <div className="h-2 w-full overflow-hidden border border-black bg-[var(--accent-cream)]">
            <div
              className="h-full bg-[var(--accent-orange)] transition-all"
              style={{ width: `${(signal.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </Card>
  );
}

function formatErrorLabel(type: string) {
  return type.replace(/_/g, " ");
}

function describeError(type: string) {
  const descriptions: Record<string, string> = {
    tool_error: "Tool execution failed — check indexes, APIs, and permissions",
    llm_error: "Model returned an error or hit rate limits",
    timeout: "Run exceeded configured timeout window",
    unknown_error: "Unclassified failure — inspect run timeline",
  };
  return descriptions[type] ?? "Review affected runs for root cause";
}

export function AgentBreakdown({ runs }: { runs: RunSummary[] }) {
  const agents = groupByAgentFromRuns(runs);

  return (
    <Card elevated className="divide-y divide-black">
      {agents.length === 0 ? (
        <p className="empty-state">No agent data yet.</p>
      ) : (
        agents.map((agent) => (
          <div key={agent.agent} className="flex items-center justify-between px-6 py-5">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide">{agent.agent}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {agent.total} runs · {agent.failed} failures
              </p>
            </div>
            <div className="text-right">
              <p className="display-headline text-2xl">
                {agent.total > 0 ? Math.round(((agent.total - agent.failed) / agent.total) * 100) : 100}%
              </p>
              <p className="label-caps mt-1">success</p>
            </div>
          </div>
        ))
      )}
    </Card>
  );
}

function groupByAgentFromRuns(runs: RunSummary[]) {
  const map = new Map<string, { total: number; failed: number }>();
  for (const run of runs) {
    const agent = run.agentName ?? "unknown";
    const entry = map.get(agent) ?? { total: 0, failed: 0 };
    entry.total += 1;
    if (run.status === "error") entry.failed += 1;
    map.set(agent, entry);
  }
  return [...map.entries()]
    .map(([agent, data]) => ({ agent, ...data }))
    .sort((a, b) => b.total - a.total);
}

export function RecentRunsFeed({ runs }: { runs: RunSummary[] }) {
  const recent = runs.slice(0, 6);

  if (recent.length === 0) {
    return (
      <Card elevated className="p-8">
        <p className="text-sm text-[var(--muted)]">
          No runs captured yet. Send events via{" "}
          <code className="code-inline">@rift/sdk-core</code> or the Hermes plugin.
        </p>
      </Card>
    );
  }

  return (
    <Card elevated className="divide-y divide-black">
      {recent.map((run) => (
        <Link
          key={run.id}
          href={`/dashboard/runs/${run.id}`}
          className="flex items-start gap-4 px-6 py-5 transition hover:bg-[var(--surface-hover)]"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-black bg-[var(--accent-orange)] text-sm font-bold">
            {(run.agentName ?? "A").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold uppercase tracking-wide">
                {run.agentName ?? "Unknown agent"}
              </p>
              <StatusBadge status={run.status} />
            </div>
            <p className="mt-1 truncate text-xs text-[var(--muted)]">
              {run.errorMsg ?? `${run.framework ?? "agent"} · ${run.model ?? "model"}`}
            </p>
            <p className="mt-1 font-mono text-[10px] text-[var(--muted-light)]">{run.id}</p>
          </div>
          <div className="shrink-0 text-right text-xs text-[var(--muted-light)]">
            {run.durationMs != null ? `${run.durationMs}ms` : "—"}
            <p className="mt-1">{formatRelative(run.startedAt)}</p>
          </div>
        </Link>
      ))}
    </Card>
  );
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
