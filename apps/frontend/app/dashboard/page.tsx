import Link from "next/link";
import { fetchStats, fetchRuns } from "@/lib/rift-api";
import { avgDuration, p95Duration, successRate } from "@/lib/dashboard-analytics";
import { MetricCard } from "@/components/ui/card";
import { DashboardTopBar, DateRangeTabs } from "@/components/layout/dashboard-sidebar";
import { SectionHeader, PageShell } from "@/components/layout/page-chrome";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import {
  AgentBreakdown,
  FailureSignals,
  RecentRunsFeed,
} from "@/components/dashboard/overview-sections";

export default async function DashboardPage() {
  const [{ stats, project }, { runs }] = await Promise.all([fetchStats(), fetchRuns()]);
  const avgMs = avgDuration(runs);
  const p95Ms = p95Duration(runs);
  const rate = successRate(runs);

  return (
    <>
      <DashboardTopBar
        eyebrow={project.name}
        title="Overview"
        subtitle="Find out why agents fail, what they cost, and how to fix them."
      >
        <DateRangeTabs />
      </DashboardTopBar>

      <PageShell>
        <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard label="Agent runs" value={stats.runs} sub="Total invocations" trend={`${rate}% success`} accent="orange" />
          <MetricCard label="Tool calls" value={stats.toolCalls} sub="Across all runs" />
          <MetricCard label="Failures" value={stats.failures} sub={stats.failures > 0 ? "Investigate" : "All clear"} accent="purple" />
          <MetricCard label="Total cost" value={`$${stats.costUsd.toFixed(4)}`} sub="USD this period" />
        </div>

        <div className="mb-10 grid gap-4 md:grid-cols-3">
          <MetricCard label="Avg latency" value={avgMs != null ? `${avgMs}ms` : "—"} sub="Mean duration" />
          <MetricCard label="P95 latency" value={p95Ms != null ? `${p95Ms}ms` : "—"} sub="95th percentile" />
          <MetricCard
            label="Active agents"
            value={new Set(runs.map((r) => r.agentName).filter(Boolean)).size || 0}
            sub="Unique agents"
          />
        </div>

        <div className="mb-10 grid gap-10 lg:grid-cols-2">
          <section>
            <SectionHeader
              title="Failure signals"
              subtitle="Grouped by error type"
              action={{ label: "View all", href: "/dashboard/failures" }}
            />
            <FailureSignals runs={runs} />
          </section>
          <section>
            <SectionHeader title="Run activity" subtitle="Last 7 days" />
            <div className="panel-elevated p-6">
              <ActivityChart runs={runs} />
            </div>
          </section>
        </div>

        <div className="mb-10 grid gap-10 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <SectionHeader
              title="Recent runs"
              subtitle="Latest invocations"
              action={{ label: "All runs", href: "/dashboard/runs" }}
            />
            <RecentRunsFeed runs={runs} />
          </section>
          <section>
            <SectionHeader title="Agents" subtitle="Performance by name" />
            <AgentBreakdown runs={runs} />
          </section>
        </div>

        <SectionHeader title="Integrations" subtitle="Connected services" />
        <div className="grid gap-4 md:grid-cols-3">
          <IntegrationCard title="SDK" status="Live" desc="@rift/sdk-core on :8081" accent="orange" />
          <IntegrationCard title="Hermes" status="Ready" desc="Python plugin + remediation worker" accent="purple" />
          <IntegrationCard
            title="GitHub"
            status="Configure"
            desc="Auto-remediation PRs"
            action={{ label: "Settings", href: "/dashboard/settings" }}
          />
        </div>
      </PageShell>
    </>
  );
}

function IntegrationCard({
  title,
  status,
  desc,
  action,
  accent,
}: {
  title: string;
  status: string;
  desc: string;
  action?: { label: string; href: string };
  accent?: "orange" | "purple";
}) {
  const bar = accent === "orange" ? "bg-[var(--accent-orange)]" : accent === "purple" ? "bg-[var(--accent-purple)]" : "bg-black";

  return (
    <div className="panel-elevated relative overflow-hidden p-6">
      <div className={`absolute inset-x-0 top-0 h-1 ${bar}`} />
      <div className="flex items-center justify-between">
        <p className="label-caps">{title}</p>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-light)]">{status}</span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">{desc}</p>
      {action ? (
        <Link href={action.href} className="label-caps mt-5 inline-block hover:opacity-50">
          {action.label} →
        </Link>
      ) : null}
    </div>
  );
}
