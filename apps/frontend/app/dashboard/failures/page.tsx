import Link from "next/link";
import { fetchRuns, fetchStats } from "@/lib/rift-api";
import { groupByErrorType } from "@/lib/dashboard-analytics";
import { DashboardTopBar } from "@/components/layout/dashboard-sidebar";
import { ListPanel, ListRowLink, PageShell, StatGrid, StatBlock } from "@/components/layout/page-chrome";
import { StatusBadge } from "@/components/ui/badge";

export default async function FailuresPage() {
  const [{ stats }, { runs }] = await Promise.all([fetchStats(), fetchRuns()]);
  const failed = runs.filter((r) => r.status === "error");
  const signals = groupByErrorType(runs);

  return (
    <>
      <DashboardTopBar
        eyebrow="Observability"
        title="Failures"
        subtitle="Grouped failure inbox — like Sentry, but for agent runs."
      />
      <PageShell>
        <StatGrid>
          <StatBlock label="Open failures" value={stats.failures} accent="orange" />
          <StatBlock
            label="Failure rate"
            value={runs.length ? `${Math.round((failed.length / runs.length) * 100)}%` : "0%"}
          />
          <StatBlock label="Error types" value={signals.length} accent="purple" />
        </StatGrid>

        <ListPanel empty={failed.length === 0 ? "No failures recorded." : undefined}>
          {failed.map((run) => (
            <ListRowLink key={run.id} href={`/dashboard/runs/${run.id}`}>
              <div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold uppercase tracking-wide">{run.errorType ?? "error"}</p>
                  <StatusBadge status="error" />
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">{run.errorMsg ?? "No message"}</p>
                <p className="mt-1 font-mono text-[10px] text-[var(--muted-light)]">{run.id}</p>
              </div>
              <span className="label-caps shrink-0">{run.agentName ?? "—"}</span>
            </ListRowLink>
          ))}
        </ListPanel>
      </PageShell>
    </>
  );
}
