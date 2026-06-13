import { randomUUID } from "node:crypto";
import type { EventEnvelope } from "@rift/observability-types";
import type { RiftConfig, RunContext, StartRunOptions, EndRunOptions } from "./types.js";
import { enterRunContext, getCurrentRun } from "./context.js";
import { sendBatch } from "./transport.js";

function makeRunId(): string {
  return `run_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export class Rift {
  private buffer: EventEnvelope[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private readonly config: Required<
    Pick<RiftConfig, "endpoint" | "environment" | "flushIntervalMs" | "sdkName" | "sdkVersion">
  > & RiftConfig;

  constructor(config: RiftConfig) {
    this.config = {
      endpoint: "http://localhost:8081",
      environment: process.env.NODE_ENV ?? "development",
      flushIntervalMs: 2000,
      sdkName: "@rift/sdk-core",
      sdkVersion: "0.0.1",
      ...config,
    };

    this.flushTimer = setInterval(() => {
      void this.flush();
    }, this.config.flushIntervalMs);
    this.flushTimer.unref?.();
  }

  startRun(opts: StartRunOptions): RunContext {
    const runId = makeRunId();
    const startedAt = Date.now();

    this.enqueue({
      type: "run.started",
      runId,
      data: {
        input: opts.input,
        metadata: {
          agent: opts.agent,
          framework: opts.framework,
          model: opts.model,
          ...opts.metadata,
        },
      },
    });

    const ctx: RunContext = {
      runId,
      record: (type, data, spanId) => {
        this.enqueue({ type, runId, data, spanId });
      },
      end: (endOpts) => {
        const durationMs = endOpts.durationMs ?? Date.now() - startedAt;
        this.enqueue({
          type: "run.ended",
          runId,
          data: {
            status: endOpts.status,
            output: endOpts.output,
            error: endOpts.error,
            durationMs,
            costUsd: endOpts.costUsd,
            tokenUsage: endOpts.tokenUsage,
          },
        });
        void this.flush();
      },
    };

    enterRunContext(ctx);
    return ctx;
  }

  currentRun(): RunContext | undefined {
    return getCurrentRun();
  }

  async flush(): Promise<boolean> {
    if (this.buffer.length === 0) return true;
    const batch = this.buffer.splice(0, this.buffer.length);
    try {
      await sendBatch(this.config, batch);
      return true;
    } catch (err) {
      this.buffer.unshift(...batch);
      console.error(
        "[rift] flush failed:",
        err instanceof Error ? err.message : err,
      );
      return false;
    }
  }

  async shutdown(): Promise<void> {
    if (this.flushTimer) clearInterval(this.flushTimer);
    const ok = await this.flush();
    if (!ok || this.buffer.length > 0) {
      throw new Error(
        `Failed to send events to ${this.config.endpoint}. ` +
          "Start ingest-api (npm run dev) and seed the DB (npm run db:seed).",
      );
    }
  }

  private enqueue(partial: {
    type: EventEnvelope["type"];
    runId: string;
    data: Record<string, unknown>;
    spanId?: string;
  }): void {
    const event: EventEnvelope = {
      version: "1.0",
      type: partial.type,
      id: `evt_${randomUUID().replace(/-/g, "").slice(0, 16)}`,
      runId: partial.runId,
      projectId: this.config.projectId,
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
      sdk: {
        name: this.config.sdkName,
        version: this.config.sdkVersion,
      },
      data: partial.data,
      ...(partial.spanId ? { spanId: partial.spanId } : {}),
    };

    this.buffer.push(event);
    if (this.buffer.length >= 50) void this.flush();
  }
}
