const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const PROJECT_SLUG = process.env.NEXT_PUBLIC_PROJECT_SLUG ?? "demo";

export interface ProjectStats {
  project: { id: string; name: string; slug: string };
  stats: {
    runs: number;
    failures: number;
    toolCalls: number;
    costUsd: number;
  };
}

export interface RunSummary {
  id: string;
  status: string;
  agentName: string | null;
  framework: string | null;
  model: string | null;
  durationMs: number | null;
  costUsd: number | null;
  errorType: string | null;
  errorMsg: string | null;
  startedAt: string;
  endedAt: string | null;
  _count: { events: number };
}

export async function fetchStats(): Promise<ProjectStats> {
  const res = await fetch(`${API_URL}/v1/projects/${PROJECT_SLUG}/stats`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function fetchRuns(): Promise<{ runs: RunSummary[] }> {
  const res = await fetch(`${API_URL}/v1/projects/${PROJECT_SLUG}/runs`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch runs");
  return res.json();
}

export async function fetchRun(id: string) {
  const res = await fetch(`${API_URL}/v1/runs/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch run");
  return res.json();
}

export async function triggerRemediation(runId: string) {
  const res = await fetch(`${API_URL}/v1/runs/${runId}/remediate`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to trigger remediation");
  return res.json();
}
