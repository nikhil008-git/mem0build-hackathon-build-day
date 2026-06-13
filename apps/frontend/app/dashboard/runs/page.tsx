import Link from "next/link";
import { fetchRuns } from "@/lib/rift-api";

function statusColor(status: string) {
  if (status === "success") return "text-emerald-400";
  if (status === "error") return "text-red-400";
  return "text-white/60";
}

export default async function RunsPage() {
  const { runs } = await fetchRuns();

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link href="/dashboard" className="text-sm text-white/50 hover:text-white">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Agent Runs</h1>

        <div className="mt-8 overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/50">
              <tr>
                <th className="px-4 py-3">Run</th>
                <th className="px-4 py-3">Framework</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Cost</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/runs/${run.id}`}
                      className="font-mono text-violet-300 hover:underline"
                    >
                      {run.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{run.framework ?? "—"}</td>
                  <td className={`px-4 py-3 ${statusColor(run.status)}`}>
                    {run.status}
                  </td>
                  <td className="px-4 py-3">
                    {run.durationMs != null ? `${run.durationMs}ms` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {run.costUsd != null ? `$${run.costUsd.toFixed(4)}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
