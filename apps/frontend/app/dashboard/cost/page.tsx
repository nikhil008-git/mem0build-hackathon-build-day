import { fetchRuns } from "@/lib/rift-api";
import { DashboardTopBar } from "@/components/layout/dashboard-sidebar";
import { ListPanel, ListRow, PageShell, StatBlock, StatGrid } from "@/components/layout/page-chrome";

export default async function CostPage() {
  const { runs } = await fetchRuns();
  const total = runs.reduce((acc, r) => acc + (r.costUsd ?? 0), 0);
  const byModel = groupBy(runs, (r) => r.model ?? "unknown", (r) => r.costUsd ?? 0);

  return (
    <>
      <DashboardTopBar
        eyebrow="Observability"
        title="Cost"
        subtitle="Token spend and USD cost per run, model, and agent."
      />
      <PageShell>
        <StatGrid>
          <StatBlock label="Total spend" value={`$${total.toFixed(4)}`} accent="orange" />
        </StatGrid>
        <ListPanel empty={byModel.length === 0 ? "No cost data yet." : undefined}>
          {byModel.map(([model, cost]) => (
            <ListRow key={model}>
              <span className="text-sm font-bold uppercase tracking-wide">{model}</span>
              <span className="display-headline text-xl">${cost.toFixed(4)}</span>
            </ListRow>
          ))}
        </ListPanel>
      </PageShell>
    </>
  );
}

function groupBy<T>(items: T[], keyFn: (item: T) => string, valFn: (item: T) => number) {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = keyFn(item);
    map.set(k, (map.get(k) ?? 0) + valFn(item));
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}
