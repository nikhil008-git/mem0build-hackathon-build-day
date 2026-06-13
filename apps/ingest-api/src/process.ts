import type { Request, Response, NextFunction } from "express";
import { prisma } from "@repo/db";
import type { Prisma } from "@repo/db";
import type { EventEnvelope, RunEndedData, RunStartedData } from "@rift/observability-types";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function authApiKey(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing API key" });
    return;
  }

  const key = header.slice(7);
  const apiKey = await prisma.apiKey.findUnique({
    where: { key },
    include: { project: true },
  });

  if (!apiKey) {
    res.status(401).json({ error: "Invalid API key" });
    return;
  }

  req.rift = { projectId: apiKey.projectId, project: apiKey.project };
  next();
}

export async function processEvents(
  projectId: string,
  events: EventEnvelope[],
): Promise<void> {
  for (const event of events) {
    // Always scope to authenticated project (ignore client-sent projectId)
    const scoped = { ...event, projectId };

    await prisma.agentEvent.upsert({
      where: { id: scoped.id },
      create: {
        id: scoped.id,
        runId: scoped.runId,
        type: scoped.type,
        spanId: scoped.spanId ?? null,
        timestamp: new Date(scoped.timestamp),
        data: toJson(scoped.data),
      },
      update: {},
    });

    if (scoped.type === "run.started") {
      const data = scoped.data as unknown as RunStartedData;
      await prisma.run.upsert({
        where: { id: scoped.runId },
        create: {
          id: scoped.runId,
          projectId,
          status: "running",
          agentName: data.metadata?.agent ?? null,
          framework: data.metadata?.framework ?? null,
          model: data.metadata?.model ?? null,
          environment: scoped.environment,
          input: toJson(data.input),
          startedAt: new Date(scoped.timestamp),
        },
        update: {},
      });
    }

    if (scoped.type === "run.ended") {
      const data = scoped.data as unknown as RunEndedData;
      await prisma.run.update({
        where: { id: scoped.runId },
        data: {
          status: data.status,
          ...(data.output !== undefined ? { output: toJson(data.output) } : {}),
          errorType: data.error?.type ?? null,
          errorMsg: data.error?.message ?? null,
          durationMs: data.durationMs,
          costUsd: data.costUsd ?? null,
          endedAt: new Date(scoped.timestamp),
        },
      });
    }
  }
}

declare global {
  namespace Express {
    interface Request {
      rift?: {
        projectId: string;
        project: { id: string; name: string; slug: string };
      };
    }
  }
}
