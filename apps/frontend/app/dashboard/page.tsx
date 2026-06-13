import Link from "next/link";
import { fetchStats, fetchRuns } from "@/lib/rift-api";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-white/50">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-white">{value}</p>
      {sub ? <p className="mt-1 text-xs text-white/40">{sub}</p> : null}
    </div>
  );
}

function statusColor(status: string) {
  if (status === "success") return "text-emerald-400";
  if (status === "error") return "text-red-400";
  if (status === "running") return "text-amber-400";
  return "text-white/60";
}

export default async function DashboardPage() {
  const [{ stats, project }, { runs }] = await Promise.all([
    fetchStats(),
    fetchRuns(),
  ]);

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-violet-400">Rift Observability</p>
            <h1 className="text-3xl font-semibold">{project.name}</h1>
          </div>
          <Link
            href="/dashboard/runs"
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium hover:bg-violet-500"
          >
            All Runs
          </Link>
        </div>

        <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Agent Runs" value={stats.runs} />
          <StatCard label="Tool Calls" value={stats.toolCalls} />
          <StatCard
            label="Failures"
            value={stats.failures}
            sub={stats.failures > 0 ? "needs attention" : "all clear"}
          />
          <StatCard
            label="Cost"
            value={`$${stats.costUsd.toFixed(4)}`}
          />
        </div>

        <section>
          <h2 className="mb-4 text-lg font-medium">Recent Runs</h2>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-white/50">
                <tr>
                  <th className="px-4 py-3">Run</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Events</th>
                </tr>
              </thead>
              <tbody>
                {runs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-white/40">
                      No runs yet. Send events via SDK or Hermes plugin.
                    </td>
                  </tr>
                ) : (
                  runs.slice(0, 10).map((run) => (
                    <tr
                      key={run.id}
                      className="border-t border-white/5 hover:bg-white/5"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/runs/${run.id}`}
                          className="font-mono text-violet-300 hover:underline"
                        >
                          {run.id}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{run.agentName ?? "—"}</td>
                      <td className={`px-4 py-3 ${statusColor(run.status)}`}>
                        {run.status}
                      </td>
                      <td className="px-4 py-3">
                        {run.durationMs != null ? `${run.durationMs}ms` : "—"}
                      </td>
                      <td className="px-4 py-3">{run._count.events}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
