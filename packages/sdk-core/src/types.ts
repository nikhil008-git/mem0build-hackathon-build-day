import type { EventEnvelope, RunStatus } from "@rift/observability-types";

export interface RiftConfig {
  apiKey: string;
  projectId: string;
  endpoint?: string;
  environment?: string;
  flushIntervalMs?: number;
  sdkName?: string;
  sdkVersion?: string;
}

export interface StartRunOptions {
  agent?: string;
  framework?: string;
  model?: string;
  input: unknown;
  metadata?: Record<string, unknown>;
}

export interface EndRunOptions {
  status: RunStatus;
  output?: unknown;
  error?: { type: string; message: string; stack?: string; spanId?: string };
  durationMs?: number;
  costUsd?: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface RunContext {
  runId: string;
  record(type: EventEnvelope["type"], data: Record<string, unknown>, spanId?: string): void;
  end(opts: EndRunOptions): void;
}
