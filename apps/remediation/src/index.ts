import { config } from "dotenv";
import { resolve } from "node:path";
import express from "express";
import { prisma } from "@repo/db";

config({ path: resolve(import.meta.dirname, "../../.env") });

const app = express();
app.use(express.json());

/**
 * Remediation pipeline (MVP stub).
 * Phase 3: replace analyzeAndPatch() with Nous Research Hermes AIAgent.
 */
async function analyzeAndPatch(run: {
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
    `Update the failing tool handler in your ${run.framework ?? "agent"} codebase.`,
    `Verify index names, API keys, and error handling for \`${run.agentName ?? "agent"}\`.`,
  ].join("\n");

  const patch = [
    `--- a/src/tools/handler.ts`,
    `+++ b/src/tools/handler.ts`,
    `@@ -1,5 +1,9 @@`,
    ` export async function handler(input: { query: string }) {`,
    `-  const result = await search(input.query);`,
    `+  try {`,
    `+    const result = await search(input.query);`,
    `+    return result;`,
    `+  } catch (err) {`,
    `+    throw new Error(\`Search failed: \${err instanceof Error ? err.message : "unknown"}\`);`,
    `+  }`,
    `-  return result;`,
    ` }`,
  ].join("\n");

  return { analysis, patch };
}

app.post("/internal/remediate", async (req, res) => {
  const { runId, remediationId } = req.body as {
    runId: string;
    remediationId: string;
  };

  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: { events: true },
  });

  if (!run) {
    res.status(404).json({ error: "Run not found" });
    return;
  }

  await prisma.remediation.update({
    where: { id: remediationId },
    data: { status: "analyzing" },
  });

  const { analysis, patch } = await analyzeAndPatch(run);

  // MVP: simulate PR creation. Phase 3: GitHub API + Hermes worker.
  const prUrl = process.env.GITHUB_REPO
    ? `https://github.com/${process.env.GITHUB_REPO}/pull/1`
    : null;

  await prisma.remediation.update({
    where: { id: remediationId },
    data: {
      status: prUrl ? "pr_opened" : "fix_generated",
      analysis,
      patch,
      prUrl,
      prNumber: prUrl ? 1 : null,
    },
  });

  res.json({ ok: true, status: prUrl ? "pr_opened" : "fix_generated" });
});

const PORT = Number(process.env.REMEDIATION_PORT ?? 8082);
app.listen(PORT, () => {
  console.log(`Remediation service on http://localhost:${PORT}`);
});
