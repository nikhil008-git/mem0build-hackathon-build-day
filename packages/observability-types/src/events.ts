import { z } from "zod";

export const EventTypeSchema = z.enum([
  "run.started",
  "run.ended",
  "span.started",
  "span.ended",
  "llm.prompt",
  "llm.completion",
  "tool.input",
  "tool.output",
  "tool.error",
  "memory.query",
  "memory.results",
  "error",
]);

export type EventType = z.infer<typeof EventTypeSchema>;

export const RunStatusSchema = z.enum([
  "running",
  "success",
  "error",
  "timeout",
  "cancelled",
]);

export type RunStatus = z.infer<typeof RunStatusSchema>;

export const EventEnvelopeSchema = z.object({
  version: z.literal("1.0"),
  type: EventTypeSchema,
  id: z.string().min(1),
  runId: z.string().min(1),
  spanId: z.string().optional(),
  parentSpanId: z.string().optional(),
  projectId: z.string().min(1),
  agentId: z.string().optional(),
  timestamp: z.string().datetime(),
  environment: z.string(),
  sdk: z.object({
    name: z.string(),
    version: z.string(),
  }),
  data: z.record(z.unknown()),
});

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;

export const EventBatchSchema = z.object({
  events: z.array(EventEnvelopeSchema).min(1).max(100),
});

export type EventBatch = z.infer<typeof EventBatchSchema>;

export interface RunStartedData {
  input: unknown;
  metadata?: {
    agent?: string;
    model?: string;
    framework?: string;
    userId?: string;
    sessionId?: string;
    tags?: string[];
  };
}

export interface RunEndedData {
  status: RunStatus;
  output?: unknown;
  error?: {
    type: string;
    message: string;
    stack?: string;
    spanId?: string;
  };
  durationMs: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costUsd?: number;
}

export interface ToolInputData {
  spanId: string;
  toolName: string;
  arguments: unknown;
}

export interface ToolOutputData {
  spanId: string;
  toolName: string;
  result: unknown;
  latencyMs: number;
}

export interface ToolErrorData {
  spanId: string;
  toolName: string;
  error: {
    message: string;
    stack?: string;
    code?: string;
  };
  latencyMs: number;
}
