import type { RunSummary } from "@/lib/rift-api";

export function groupRunsByDay(runs: RunSummary[], days = 7) {
  const buckets: { label: string; count: number }[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.push({
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      count: runs.filter((r) => r.startedAt.slice(0, 10) === key).length,
    });
  }

  return buckets;
}

export function groupByErrorType(runs: RunSummary[]) {
  const failed = runs.filter((r) => r.status === "error");
  const map = new Map<string, number>();

  for (const run of failed) {
    const key = run.errorType ?? "unknown_error";
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  return [...map.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

export function groupByAgent(runs: RunSummary[]) {
  const map = new Map<string, { total: number; failed: number }>();

  for (const run of runs) {
    const agent = run.agentName ?? "unknown";
    const entry = map.get(agent) ?? { total: 0, failed: 0 };
    entry.total += 1;
    if (run.status === "error") entry.failed += 1;
    map.set(agent, entry);
  }

  return [...map.entries()]
    .map(([agent, data]) => ({ agent, ...data }))
    .sort((a, b) => b.total - a.total);
}

export function avgDuration(runs: RunSummary[]) {
  const withDuration = runs.filter((r) => r.durationMs != null);
  if (withDuration.length === 0) return null;
  const sum = withDuration.reduce((acc, r) => acc + (r.durationMs ?? 0), 0);
  return Math.round(sum / withDuration.length);
}

export function successRate(runs: RunSummary[]) {
  if (runs.length === 0) return 100;
  const ok = runs.filter((r) => r.status === "success").length;
  return Math.round((ok / runs.length) * 100);
}

export function p95Duration(runs: RunSummary[]) {
  const durations = runs
    .map((r) => r.durationMs)
    .filter((d): d is number => d != null)
    .sort((a, b) => a - b);
  if (durations.length === 0) return null;
  const idx = Math.floor(durations.length * 0.95);
  return durations[Math.min(idx, durations.length - 1)];
}
