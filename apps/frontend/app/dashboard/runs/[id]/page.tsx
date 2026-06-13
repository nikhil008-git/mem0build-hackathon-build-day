"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchRun, triggerRemediation } from "@/lib/rift-api";
import {
  RUN_TABS,
  endedData,
  filterEvents,
  formatJson,
  startedMetadata,
  type RunDetail,
  type RunTab,
} from "@/lib/run-detail";
import { DashboardTopBar } from "@/components/layout/dashboard-sidebar";
import { PageShell } from "@/components/layout/page-chrome";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge, TabButton } from "@/components/ui/badge";

function EventList({ events }: { events: RunDetail["events"] }) {
  if (events.length === 0) {
    return <p className="text-sm text-[var(--muted)]">No events in this view.</p>;
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <Card key={event.id} elevated className="p-5">
          <div className="flex items-center justify-between gap-4">
            <span className="font-mono text-xs text-black">{event.type}</span>
            <span className="text-xs text-[var(--muted-light)]">
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <pre className="mt-3 max-h-40 overflow-auto border border-black bg-[var(--accent-cream)] p-3 text-xs">
            {formatJson(event.data)}
          </pre>
        </Card>
      ))}
    </div>
  );
}

function ContextPanel({ run }: { run: RunDetail }) {
  const metadata = startedMetadata(run.events);
  const ended = endedData(run.events);
  const tokenUsage = ended.tokenUsage as
    | { promptTokens?: number; completionTokens?: number; totalTokens?: number }
    | undefined;

  const fields: { label: string; value: string }[] = [
    { label: "Agent", value: run.agentName ?? "—" },
    { label: "Framework", value: run.framework ?? "—" },
    { label: "Model", value: run.model ?? "—" },
    { label: "Environment", value: run.environment ?? "—" },
    { label: "Status", value: run.status },
    { label: "Duration", value: run.durationMs != null ? `${run.durationMs}ms` : "—" },
    { label: "Cost", value: run.costUsd != null ? `$${run.costUsd.toFixed(4)}` : "—" },
    { label: "Started", value: new Date(run.startedAt).toLocaleString() },
    { label: "Ended", value: run.endedAt ? new Date(run.endedAt).toLocaleString() : "—" },
  ];

  if (metadata.sessionId) fields.push({ label: "Session", value: String(metadata.sessionId) });
  if (metadata.userId) fields.push({ label: "User", value: String(metadata.userId) });
  if (Array.isArray(metadata.tags) && metadata.tags.length > 0) {
    fields.push({ label: "Tags", value: metadata.tags.join(", ") });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => (
          <Card key={field.label} elevated className="p-5">
            <p className="label-caps">{field.label}</p>
            <p className="mt-2 text-sm text-black">{field.value}</p>
          </Card>
        ))}
      </div>

      {tokenUsage ? (
        <Card elevated className="p-6">
          <p className="label-caps">Token usage</p>
          <div className="mt-3 flex flex-wrap gap-6 text-sm text-black">
            <span>Prompt: {tokenUsage.promptTokens ?? "—"}</span>
            <span>Completion: {tokenUsage.completionTokens ?? "—"}</span>
            <span>Total: {tokenUsage.totalTokens ?? "—"}</span>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card elevated className="p-6">
          <p className="label-caps">Input</p>
          <pre className="mt-3 max-h-64 overflow-auto border border-black bg-[var(--accent-cream)] p-3 text-xs">
            {formatJson(run.input)}
          </pre>
        </Card>
        <Card elevated className="p-6">
          <p className="label-caps">Output</p>
          <pre className="mt-3 max-h-64 overflow-auto border border-black bg-[var(--accent-cream)] p-3 text-xs">
            {formatJson(run.output)}
          </pre>
        </Card>
      </div>

      {run.errorMsg ? (
        <div className="border border-black bg-[var(--accent-orange)] p-5">
          <p className="text-sm font-bold uppercase">{run.errorType ?? "error"}</p>
          <p className="mt-2 text-sm">{run.errorMsg}</p>
        </div>
      ) : null}
    </div>
  );
}

function CostPanel({ run }: { run: RunDetail }) {
  const ended = endedData(run.events);
  const tokenUsage = ended.tokenUsage as
    | { promptTokens?: number; completionTokens?: number; totalTokens?: number }
    | undefined;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-5">
          <p className="label-caps">Run cost</p>
          <p className="mt-2 text-2xl font-semibold">
            {run.costUsd != null ? `$${run.costUsd.toFixed(4)}` : "—"}
          </p>
        </Card>
        <Card className="p-5">
          <p className="label-caps">Duration</p>
          <p className="mt-2 text-2xl font-semibold">
            {run.durationMs != null ? `${run.durationMs}ms` : "—"}
          </p>
        </Card>
        <Card className="p-5">
          <p className="label-caps">Total tokens</p>
          <p className="mt-2 text-2xl font-semibold">{tokenUsage?.totalTokens ?? "—"}</p>
        </Card>
      </div>
      <EventList events={filterEvents(run.events, "cost")} />
    </div>
  );
}

export default function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [runId, setRunId] = useState<string | null>(null);
  const [run, setRun] = useState<RunDetail | null>(null);
  const [tab, setTab] = useState<RunTab>("context");
  const [loading, setLoading] = useState(true);
  const [remediating, setRemediating] = useState(false);

  useEffect(() => {
    void params.then((p) => setRunId(p.id));
  }, [params]);

  useEffect(() => {
    if (!runId) return;
    void fetchRun(runId)
      .then((data) => setRun(data.run))
      .finally(() => setLoading(false));
  }, [runId]);

  async function onRemediate() {
    if (!runId) return;
    setRemediating(true);
    try {
      await triggerRemediation(runId);
      const data = await fetchRun(runId);
      setRun(data.run);
    } finally {
      setRemediating(false);
    }
  }

  if (loading) {
    return (
      <>
        <DashboardTopBar title="Loading..." />
        <p className="px-8 py-12 text-neutral-500">Loading run...</p>
      </>
    );
  }

  if (!run) {
    return (
      <>
        <DashboardTopBar title="Not found" />
        <p className="px-8 py-12 text-neutral-500">Run not found.</p>
      </>
    );
  }

  const tabEvents = filterEvents(run.events, tab);

  return (
    <>
      <DashboardTopBar
        eyebrow="Run detail"
        title={run.id}
        subtitle={`${run.agentName ?? "agent"} · ${run.framework ?? "unknown"} · ${run.model ?? "unknown"}`}
      >
        <div className="flex items-center gap-3">
          <StatusBadge status={run.status} />
          {run.status === "error" ? (
            <Button onClick={() => void onRemediate()} disabled={remediating} size="sm">
              {remediating ? "Remediating..." : "Fix with PR"}
            </Button>
          ) : null}
        </div>
      </DashboardTopBar>

      <PageShell>
        <Link href="/dashboard/runs" className="label-caps hover:opacity-60">
          ← All runs
        </Link>

        {run.errorMsg ? (
          <div className="mt-6 border border-black bg-[var(--accent-orange)] px-5 py-4 text-sm font-bold uppercase tracking-wide">
            {run.errorMsg}
          </div>
        ) : null}

        {run.remediation ? (
          <Card elevated className="mt-8 p-6 md:p-8">
            <p className="label-caps">Remediation · {run.remediation.status}</p>
            {run.remediation.analysis ? (
              <pre className="mt-4 whitespace-pre-wrap text-sm text-[var(--muted)]">
                {run.remediation.analysis}
              </pre>
            ) : null}
            {run.remediation.patch ? (
              <pre className="mt-4 overflow-x-auto border border-black bg-black p-4 text-xs text-[var(--bg)]">
                {run.remediation.patch}
              </pre>
            ) : null}
            {run.remediation.prUrl ? (
              <a href={run.remediation.prUrl} target="_blank" rel="noreferrer" className="label-caps mt-4 inline-block hover:opacity-60">
                View PR →
              </a>
            ) : null}
          </Card>
        ) : null}

        <div className="mt-10 flex flex-wrap gap-2 border-b border-black pb-5">
          {RUN_TABS.map((item) => (
            <TabButton key={item.id} active={tab === item.id} onClick={() => setTab(item.id)}>
              {item.label}
            </TabButton>
          ))}
        </div>

        <div className="mt-10">
          {tab === "context" ? <ContextPanel run={run} /> : null}
          {tab === "cost" ? <CostPanel run={run} /> : null}
          {tab !== "context" && tab !== "cost" ? <EventList events={tabEvents} /> : null}
        </div>
      </PageShell>
    </>
  );
}
