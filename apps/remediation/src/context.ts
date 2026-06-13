import type { AgentEvent, Run } from "@repo/db";

export interface RemediationContext {
  runId: string;
  agentName: string | null;
  framework: string | null;
  model: string | null;
  errorType: string | null;
  errorMsg: string | null;
  input: unknown;
  output: unknown;
  events: Array<{
    type: string;
    timestamp: string;
    data: unknown;
  }>;
}

export function buildRemediationContext(
  run: Run & { events: AgentEvent[] },
): RemediationContext {
  return {
    runId: run.id,
    agentName: run.agentName,
    framework: run.framework,
    model: run.model,
    errorType: run.errorType,
    errorMsg: run.errorMsg,
    input: run.input,
    output: run.output,
    events: run.events.map((e) => ({
      type: e.type,
      timestamp: e.timestamp.toISOString(),
      data: e.data,
    })),
  };
}
