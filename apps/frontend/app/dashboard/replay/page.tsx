import Link from "next/link";
import { fetchRuns } from "@/lib/rift-api";
import { DashboardTopBar } from "@/components/layout/dashboard-sidebar";
import { ListPanel, ListRow, ListRowLink, PageShell } from "@/components/layout/page-chrome";

export default async function ReplayPage() {
  const { runs } = await fetchRuns();
  const failed = runs.filter((r) => r.status === "error");

  return (
    <>
      <DashboardTopBar
        eyebrow="Actions"
        title="Replay"
        subtitle="Re-execute failed runs with recorded inputs and mock tool responses."
      />
      <PageShell>
        <div className="panel-elevated mb-8 p-8">
          <p className="label-caps mb-3">Phase 3</p>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            Replay engine coming soon. Select a failed run to inspect before replaying.
          </p>
        </div>
        <ListPanel empty={failed.length === 0 ? "No failed runs to replay." : undefined}>
          {failed.map((run) => (
            <ListRow key={run.id}>
              <div>
                <p className="font-mono text-[10px] text-[var(--muted-light)]">{run.id}</p>
                <p className="mt-1 text-sm font-medium">{run.errorMsg ?? run.errorType}</p>
              </div>
              <Link href={`/dashboard/runs/${run.id}`} className="label-caps hover:opacity-50">
                Inspect →
              </Link>
            </ListRow>
          ))}
        </ListPanel>
      </PageShell>
    </>
  );
}
