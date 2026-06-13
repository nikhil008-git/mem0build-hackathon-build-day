import { fetchRuns } from "@/lib/rift-api";
import { avgDuration, p95Duration } from "@/lib/dashboard-analytics";
import { DashboardTopBar } from "@/components/layout/dashboard-sidebar";
import { ListPanel, ListRow, PageShell, StatGrid, StatBlock } from "@/components/layout/page-chrome";

export default async function LatencyPage() {
  const { runs } = await fetchRuns();
  const avg = avgDuration(runs);
  const p95 = p95Duration(runs);
  const byFramework = groupLatency(runs);

  return (
    <>
      <DashboardTopBar
        eyebrow="Observability"
        title="Latency"
        subtitle="P50/P95/P99 breakdowns by span type and framework."
      />
      <PageShell>
        <StatGrid>
          <StatBlock label="Avg" value={avg != null ? `${avg}ms` : "—"} />
          <StatBlock label="P95" value={p95 != null ? `${p95}ms` : "—"} accent="purple" />
          <StatBlock label="Sampled" value={runs.filter((r) => r.durationMs).length} />
          <StatBlock label="Slowest" value={slowest(runs)} accent="orange" />
        </StatGrid>
        <ListPanel empty={byFramework.length === 0 ? "No latency data yet." : undefined}>
          {byFramework.map(([fw, data]) => (
            <ListRow key={fw}>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide">{fw}</p>
                <p className="text-xs text-[var(--muted)]">{data.count} runs</p>
              </div>
              <p className="display-headline text-xl">{data.avg}ms avg</p>
            </ListRow>
          ))}
        </ListPanel>
      </PageShell>
    </>
  );
}

function slowest(runs: Awaited<ReturnType<typeof fetchRuns>>["runs"]) {
  const max = runs.reduce((m, r) => Math.max(m, r.durationMs ?? 0), 0);
  return max ? `${max}ms` : "—";
}

function groupLatency(runs: Awaited<ReturnType<typeof fetchRuns>>["runs"]) {
  const map = new Map<string, { total: number; count: number }>();
  for (const run of runs) {
    if (run.durationMs == null) continue;
    const fw = run.framework ?? "unknown";
    const e = map.get(fw) ?? { total: 0, count: 0 };
    e.total += run.durationMs;
    e.count += 1;
    map.set(fw, e);
  }
  return [...map.entries()].map(([fw, d]) => [fw, { avg: Math.round(d.total / d.count), count: d.count }] as const);
}
