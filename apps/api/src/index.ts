import { config } from "dotenv";
import { resolve } from "node:path";
import express from "express";
import cors from "cors";
import { prisma } from "@repo/db";

config({ path: resolve(import.meta.dirname, "../../../.env") });

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/v1/projects/:slug/stats", async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { slug: req.params.slug },
  });
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const [runs, failures, toolCalls, cost] = await Promise.all([
    prisma.run.count({ where: { projectId: project.id } }),
    prisma.run.count({ where: { projectId: project.id, status: "error" } }),
    prisma.agentEvent.count({
      where: {
        run: { projectId: project.id },
        type: { in: ["tool.input", "tool.output", "tool.error"] },
      },
    }),
    prisma.run.aggregate({
      where: { projectId: project.id },
      _sum: { costUsd: true },
    }),
  ]);

  res.json({
    project: { id: project.id, name: project.name, slug: project.slug },
    stats: {
      runs,
      failures,
      toolCalls,
      costUsd: cost._sum.costUsd ?? 0,
    },
  });
});

app.get("/v1/projects/:slug/runs", async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { slug: req.params.slug },
  });
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const runs = await prisma.run.findMany({
    where: { projectId: project.id },
    orderBy: { startedAt: "desc" },
    take: limit,
    include: {
      _count: { select: { events: true } },
    },
  });

  res.json({ runs });
});

app.get("/v1/runs/:id", async (req, res) => {
  const run = await prisma.run.findUnique({
    where: { id: req.params.id },
    include: {
      events: { orderBy: { timestamp: "asc" } },
      remediation: true,
    },
  });

  if (!run) {
    res.status(404).json({ error: "Run not found" });
    return;
  }

  res.json({ run });
});

app.post("/v1/runs/:id/remediate", async (req, res) => {
  const run = await prisma.run.findUnique({ where: { id: req.params.id } });
  if (!run) {
    res.status(404).json({ error: "Run not found" });
    return;
  }

  const remediation = await prisma.remediation.upsert({
    where: { runId: run.id },
    create: { runId: run.id, status: "pending" },
    update: { status: "pending", updatedAt: new Date() },
  });

  // Forward to remediation service (Phase 3)
  const remediationUrl = process.env.REMEDIATION_URL ?? "http://localhost:8082";
  void fetch(`${remediationUrl}/internal/remediate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ runId: run.id, remediationId: remediation.id }),
  }).catch(() => {});

  res.status(202).json({ remediation });
});

const PORT = Number(process.env.API_PORT ?? 8080);
app.listen(PORT, () => {
  console.log(`Query API running on http://localhost:${PORT}`);
});
