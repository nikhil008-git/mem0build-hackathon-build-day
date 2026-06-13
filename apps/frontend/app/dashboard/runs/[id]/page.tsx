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

function EventList({ events }: { events: RunDetail["events"] }) {
  if (events.length === 0) {
    return <p className="text-sm text-white/40">No events in this view.</p>;
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div
          key={event.id}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-3"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-violet-300">{event.type}</span>
            <span className="text-xs text-white/40">
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <pre className="mt-2 max-h-40 overflow-auto text-xs text-white/60">
            {formatJson(event.data)}
          </pre>
        </div>
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

  if (metadata.sessionId) {
    fields.push({ label: "Session", value: String(metadata.sessionId) });
  }
  if (metadata.userId) {
    fields.push({ label: "User", value: String(metadata.userId) });
  }
  if (Array.isArray(metadata.tags) && metadata.tags.length > 0) {
    fields.push({ label: "Tags", value: metadata.tags.join(", ") });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => (
          <div
            key={field.label}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-3"
          >
            <p className="text-xs text-white/40">{field.label}</p>
            <p className="mt-1 text-sm text-white">{field.value}</p>
          </div>
        ))}
      </div>

      {tokenUsage ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-medium text-white/70">Token usage</h3>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <span>Prompt: {tokenUsage.promptTokens ?? "—"}</span>
            <span>Completion: {tokenUsage.completionTokens ?? "—"}</span>
            <span>Total: {tokenUsage.totalTokens ?? "—"}</span>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-medium text-white/70">Input</h3>
          <pre className="mt-3 max-h-64 overflow-auto text-xs text-white/60">
            {formatJson(run.input)}
          </pre>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-medium text-white/70">Output</h3>
          <pre className="mt-3 max-h-64 overflow-auto text-xs text-white/60">
            {formatJson(run.output)}
          </pre>
        </div>
      </div>

      {run.errorMsg ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <h3 className="text-sm font-medium text-red-300">
            {run.errorType ?? "error"}
          </h3>
          <p className="mt-2 text-sm text-red-200">{run.errorMsg}</p>
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
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs text-white/40">Run cost</p>
          <p className="mt-1 text-2xl font-semibold">
            {run.costUsd != null ? `$${run.costUsd.toFixed(4)}` : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs text-white/40">Duration</p>
          <p className="mt-1 text-2xl font-semibold">
            {run.durationMs != null ? `${run.durationMs}ms` : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs text-white/40">Total tokens</p>
          <p className="mt-1 text-2xl font-semibold">
            {tokenUsage?.totalTokens ?? "—"}
          </p>
        </div>
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
      <main className="min-h-screen bg-[#0a0a0f] p-10 text-white">
        Loading run...
      </main>
    );
  }

  if (!run) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] p-10 text-white">
        Run not found
      </main>
    );
  }

  const tabEvents = filterEvents(run.events, tab);

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link href="/dashboard/runs" className="text-sm text-white/50 hover:text-white">
          ← Runs
        </Link>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-mono text-2xl">{run.id}</h1>
            <p className="mt-2 text-white/60">
              {run.agentName ?? "agent"} · {run.framework ?? "unknown"} ·{" "}
              {run.model ?? "unknown"} ·{" "}
              {run.durationMs != null ? `${run.durationMs}ms` : "—"}
            </p>
            {run.errorMsg ? (
              <p className="mt-2 text-red-400">{run.errorMsg}</p>
            ) : null}
          </div>

          {run.status === "error" ? (
            <button
              onClick={() => void onRemediate()}
              disabled={remediating}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium hover:bg-violet-500 disabled:opacity-50"
            >
              {remediating ? "Remediating..." : "Fix with PR"}
            </button>
          ) : null}
        </div>

        {run.remediation ? (
          <div className="mt-6 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
            <p className="text-sm text-violet-300">
              Remediation: {run.remediation.status}
            </p>
            {run.remediation.analysis ? (
              <pre className="mt-2 whitespace-pre-wrap text-sm text-white/80">
                {run.remediation.analysis}
              </pre>
            ) : null}
            {run.remediation.prUrl ? (
              <a
                href={run.remediation.prUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm text-violet-300 underline"
              >
                View PR
              </a>
            ) : null}
          </div>
        ) : null}

        <div className="mt-10 flex flex-wrap gap-2 border-b border-white/10 pb-3">
          {RUN_TABS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                tab === item.id
                  ? "bg-violet-600 text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "context" ? <ContextPanel run={run} /> : null}
          {tab === "cost" ? <CostPanel run={run} /> : null}
          {tab !== "context" && tab !== "cost" ? (
            <EventList events={tabEvents} />
          ) : null}
        </div>
      </div>
    </main>
  );
}
