export interface RunEvent {
  id: string;
  type: string;
  timestamp: string;
  data: unknown;
}

export interface RunDetail {
  id: string;
  status: string;
  agentName: string | null;
  framework: string | null;
  model: string | null;
  environment: string | null;
  input: unknown;
  output: unknown;
  errorType: string | null;
  errorMsg: string | null;
  durationMs: number | null;
  costUsd: number | null;
  startedAt: string;
  endedAt: string | null;
  events: RunEvent[];
  remediation: {
    status: string;
    prUrl: string | null;
    analysis: string | null;
  } | null;
}

export type RunTab =
  | "context"
  | "timeline"
  | "reasoning"
  | "tools"
  | "memory"
  | "cost";

export const RUN_TABS: { id: RunTab; label: string }[] = [
  { id: "context", label: "Context" },
  { id: "timeline", label: "Timeline" },
  { id: "reasoning", label: "Reasoning" },
  { id: "tools", label: "Tools" },
  { id: "memory", label: "Memory" },
  { id: "cost", label: "Cost" },
];

const REASONING_TYPES = new Set(["llm.prompt", "llm.completion"]);
const TOOL_TYPES = new Set(["tool.input", "tool.output", "tool.error"]);
const MEMORY_TYPES = new Set(["memory.query", "memory.results"]);

const COST_TYPES = new Set(["run.ended", "llm.prompt", "llm.completion"]);

export function filterEvents(events: RunEvent[], tab: RunTab): RunEvent[] {
  if (tab === "timeline" || tab === "context") {
    return events;
  }
  if (tab === "cost") {
    return events.filter((e) => COST_TYPES.has(e.type));
  }
  if (tab === "reasoning") {
    return events.filter((e) => REASONING_TYPES.has(e.type));
  }
  if (tab === "tools") {
    return events.filter((e) => TOOL_TYPES.has(e.type));
  }
  if (tab === "memory") {
    return events.filter((e) => MEMORY_TYPES.has(e.type));
  }
  return events;
}

export function startedMetadata(events: RunEvent[]): Record<string, unknown> {
  const started = events.find((e) => e.type === "run.started");
  if (!started || typeof started.data !== "object" || started.data === null) {
    return {};
  }
  const data = started.data as { metadata?: Record<string, unknown> };
  return data.metadata ?? {};
}

export function endedData(events: RunEvent[]): Record<string, unknown> {
  const ended = events.find((e) => e.type === "run.ended");
  if (!ended || typeof ended.data !== "object" || ended.data === null) {
    return {};
  }
  return ended.data as Record<string, unknown>;
}

export function formatJson(value: unknown): string {
  if (value === null || value === undefined) return "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
