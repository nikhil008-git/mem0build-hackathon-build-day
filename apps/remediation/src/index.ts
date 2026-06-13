import { config } from "dotenv";
import { resolve } from "node:path";
import express from "express";
import { prisma } from "@repo/db";
import { buildRemediationContext } from "./context.js";
import { analyzeWithHermes, waitForHermes } from "./hermes.js";
import { createFixPR } from "./github.js";

config({ path: resolve(import.meta.dirname, "../../../.env") });

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, hermes: process.env.HERMES_REMEDIATION_URL ?? "http://localhost:8083" });
});

/** Fallback when Hermes worker is not running */
async function stubAnalyze(run: {
  id: string;
  errorType: string | null;
  errorMsg: string | null;
  framework: string | null;
  agentName: string | null;
}) {
  const analysis = [
    `## Root Cause`,
    ``,
    `Run \`${run.id}\` failed with **${run.errorType ?? "unknown"}**.`,
    ``,
    run.errorMsg ? `> ${run.errorMsg}` : "",
    ``,
    `## Suggested Fix`,
    ``,
    `Start the Hermes worker: \`npm run hermes:worker\``,
    `Then click Fix with PR again for a real Hermes-generated patch.`,
  ].join("\n");

  const patch = [
    `--- a/src/tools/search_docs.ts`,
    `+++ b/src/tools/search_docs.ts`,
    `@@ -1,3 +1,3 @@`,
    `-const INDEX = "docs_v2";`,
    `+const INDEX = "docs_v3";`,
  ].join("\n");

  return {
    analysis,
    patch,
    pr_title: `fix: update index for ${run.agentName ?? "agent"}`,
    confidence: "low",
  };
}

app.post("/internal/remediate", async (req, res) => {
  const { runId, remediationId } = req.body as {
    runId: string;
    remediationId: string;
  };

  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: { events: { orderBy: { timestamp: "asc" } } },
  });

  if (!run) {
    res.status(404).json({ error: "Run not found" });
    return;
  }

  await prisma.remediation.update({
    where: { id: remediationId },
    data: { status: "analyzing" },
  });

  let result: { analysis: string; patch: string; pr_title: string; confidence: string };

  const hermesUp = await waitForHermes();
  if (hermesUp) {
    try {
      const context = buildRemediationContext(run);
      result = await analyzeWithHermes(context);
      console.log(`[remediation] Hermes analyzed ${runId} (confidence: ${result.confidence})`);
    } catch (err) {
      console.error("[remediation] Hermes failed, using stub:", err);
      result = await stubAnalyze(run);
    }
  } else {
    console.warn("[remediation] Hermes worker not running — using stub. Run: npm run hermes:worker");
    result = await stubAnalyze(run);
  }

  await prisma.remediation.update({
    where: { id: remediationId },
    data: { status: "fix_generated", analysis: result.analysis, patch: result.patch },
  });

  let prUrl: string | null = null;
  let prNumber: number | null = null;
  let status = "fix_generated";

  if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) {
    try {
      await prisma.remediation.update({
        where: { id: remediationId },
        data: { status: "creating_pr" },
      });

      const pr = await createFixPR({
        runId: run.id,
        title: result.pr_title,
        analysis: result.analysis,
        patch: result.patch,
      });

      if (pr) {
        prUrl = pr.prUrl;
        prNumber = pr.prNumber;
        status = "pr_opened";
        console.log(`[remediation] PR opened: ${prUrl}`);
      }
    } catch (err) {
      console.error("[remediation] GitHub PR failed:", err);
    }
  } else if (process.env.GITHUB_REPO) {
    // Demo mode — repo configured, token not yet added
    const repo = process.env.GITHUB_REPO;
    const branch = `rift/fix/${run.id.slice(0, 20)}`;
    const base = process.env.GITHUB_BASE_BRANCH ?? "main";
    prUrl = `https://github.com/${repo}/compare/${base}...${branch}?expand=1&title=${encodeURIComponent(result.pr_title)}`;
    prNumber = 1;
    status = "pr_demo";
    console.log(`[remediation] Demo PR link (add GITHUB_TOKEN to .env for real PRs): ${prUrl}`);
  }

  await prisma.remediation.update({
    where: { id: remediationId },
    data: { status, analysis: result.analysis, patch: result.patch, prUrl, prNumber },
  });

  res.json({ ok: true, status, prUrl });
});

const PORT = Number(process.env.REMEDIATION_PORT ?? 8082);
app.listen(PORT, () => {
  console.log(`Remediation service on http://localhost:${PORT}`);
  console.log(`Hermes worker expected at ${process.env.HERMES_REMEDIATION_URL ?? "http://localhost:8083"}`);
});
