import Link from "next/link";
import { fetchRuns } from "@/lib/rift-api";
import { DashboardTopBar } from "@/components/layout/dashboard-sidebar";
import { ListPanel, ListRow, PageShell } from "@/components/layout/page-chrome";

export default async function RemediationPage() {
  const { runs } = await fetchRuns();
  const failed = runs.filter((r) => r.status === "error");

  return (
    <>
      <DashboardTopBar
        eyebrow="Actions"
        title="Remediation"
        subtitle="Hermes-powered fixes delivered as GitHub pull requests."
      />
      <PageShell>
        <ListPanel empty={failed.length === 0 ? "No failures eligible for remediation." : undefined}>
          {failed.map((run) => (
            <ListRow key={run.id}>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide">{run.errorType ?? "error"}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{run.errorMsg}</p>
              </div>
              <Link
                href={`/dashboard/runs/${run.id}`}
                className="label-caps shrink-0 rounded-full border border-black bg-black px-5 py-2.5 text-white transition hover:bg-[var(--accent-purple)]"
              >
                Fix with PR
              </Link>
            </ListRow>
          ))}
        </ListPanel>
      </PageShell>
    </>
  );
}
