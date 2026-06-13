import { fetchRuns } from "@/lib/rift-api";
import { DashboardTopBar } from "@/components/layout/dashboard-sidebar";
import { ListPanel, ListRowLink, PageShell } from "@/components/layout/page-chrome";

export default async function ReasoningPage() {
  const { runs } = await fetchRuns();

  return (
    <>
      <DashboardTopBar
        eyebrow="Observability"
        title="Reasoning chain"
        subtitle="LLM turn-by-turn thought process across agent runs."
      />
      <PageShell>
        <ListPanel empty={runs.length === 0 ? "No runs with reasoning data yet." : undefined}>
          {runs.slice(0, 12).map((run) => (
            <ListRowLink key={run.id} href={`/dashboard/runs/${run.id}`}>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide">{run.agentName ?? "Agent"}</p>
                <p className="text-xs text-[var(--muted)]">
                  {run.model ?? "—"} · {run.framework ?? "—"}
                </p>
              </div>
              <span className="font-mono text-[10px] text-[var(--muted-light)]">{run.id}</span>
            </ListRowLink>
          ))}
        </ListPanel>
      </PageShell>
    </>
  );
}
