import Link from "next/link";
import { fetchRuns } from "@/lib/rift-api";
import { DashboardTopBar } from "@/components/layout/dashboard-sidebar";
import { PageShell } from "@/components/layout/page-chrome";
import { StatusBadge } from "@/components/ui/badge";

export default async function RunsPage() {
  const { runs } = await fetchRuns();

  return (
    <>
      <DashboardTopBar
        eyebrow="Observability"
        title="Agent runs"
        subtitle="Every captured invocation — filter, inspect, replay, and remediate."
      />
      <PageShell>
        <div className="panel-elevated overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black bg-[var(--accent-cream)]">
                {["Run ID", "Agent", "Framework", "Model", "Status", "Duration", "Cost", "Events"].map((h) => (
                  <th key={h} className="label-caps px-5 py-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-state">
                    No runs yet. Send events via SDK or Hermes plugin.
                  </td>
                </tr>
              ) : (
                runs.map((run) => (
                  <tr key={run.id} className="border-t border-black transition hover:bg-[var(--surface-hover)]">
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/runs/${run.id}`} className="font-mono text-xs font-medium hover:underline">
                        {run.id}
                      </Link>
                    </td>
                    <td className="px-5 py-4 font-medium uppercase tracking-wide">{run.agentName ?? "—"}</td>
                    <td className="px-5 py-4">{run.framework ?? "—"}</td>
                    <td className="px-5 py-4">{run.model ?? "—"}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={run.status} />
                    </td>
                    <td className="px-5 py-4">{run.durationMs != null ? `${run.durationMs}ms` : "—"}</td>
                    <td className="px-5 py-4">{run.costUsd != null ? `$${run.costUsd.toFixed(4)}` : "—"}</td>
                    <td className="px-5 py-4">{run._count.events}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </PageShell>
    </>
  );
}
