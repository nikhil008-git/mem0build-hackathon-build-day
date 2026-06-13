/**
 * Demo: send a sample agent run to Rift.
 * Run: npm run demo
 */
import { Rift } from "@rift/sdk-core";

const ENDPOINT = process.env.RIFT_ENDPOINT ?? "http://localhost:8081";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const DASHBOARD = process.env.RIFT_DASHBOARD ?? "http://localhost:3000";

async function seedDemoProject(): Promise<void> {
  const { execSync } = await import("node:child_process");
  execSync("npm run db:seed", { stdio: "inherit" });
}

async function verifyRun(runId: string): Promise<void> {
  for (let i = 0; i < 10; i++) {
    const res = await fetch(`${API_URL}/v1/runs/${runId}`);
    if (res.ok) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(
    `Run ${runId} not found via query API (${API_URL}). Restart npm run dev after pulling fixes.`,
  );
}

async function waitForIngest(maxAttempts = 15): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${ENDPOINT}/health`);
      if (res.ok) return;
    } catch {
      // ingest not up yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(
    `Ingest API not reachable at ${ENDPOINT}. Start it with: npm run dev`,
  );
}

async function main() {
  console.log("Rift demo — sending sample agent run...\n");

  console.log("Seeding demo project + API key...");
  await seedDemoProject();

  await waitForIngest();
  console.log(`✓ Ingest API ready (${ENDPOINT})\n`);

  const rift = new Rift({
    apiKey: process.env.RIFT_API_KEY ?? "rift_test_demo_key",
    projectId: process.env.RIFT_PROJECT_ID ?? "demo",
    endpoint: ENDPOINT,
  });

  const run = rift.startRun({
    agent: "support-bot",
    framework: "vercel-ai",
    model: "gpt-4o",
    input: { message: "How do I reset my password?" },
    metadata: {
      sessionId: "sess_demo_001",
      userId: "user_42",
      tags: ["support", "password-reset"],
    },
  });

  const spanId = "span_search_docs";

  run.record("llm.prompt", {
    spanId,
    model: "gpt-4o",
    messages: [{ role: "user", content: "How do I reset my password?" }],
  });

  run.record("llm.completion", {
    spanId,
    model: "gpt-4o",
    content: "",
    toolCalls: [{ name: "search_docs", arguments: { query: "password reset" } }],
    latencyMs: 1400,
  });

  run.record("memory.query", {
    spanId: "span_mem",
    store: "mem0",
    query: "past password reset incidents",
    topK: 3,
  });

  run.record("memory.results", {
    spanId: "span_mem",
    store: "mem0",
    entries: [
      { content: "Previous fix: reindex docs_v2 after deploy", metadata: { score: 0.92 } },
    ],
    latencyMs: 45,
  });

  run.record(
    "tool.input",
    {
      spanId,
      toolName: "search_docs",
      arguments: { query: "password reset" },
    },
    spanId,
  );

  run.record(
    "tool.output",
    {
      spanId,
      toolName: "search_docs",
      result: { error: "Index not found: docs_v2" },
      latencyMs: 340,
    },
    spanId,
  );

  run.end({
    status: "error",
    error: {
      type: "tool_error",
      message: "Index not found: docs_v2",
      spanId,
    },
    costUsd: 0.0023,
    output: { message: "Unable to search documentation." },
    tokenUsage: { promptTokens: 120, completionTokens: 45, totalTokens: 165 },
  });

  await rift.shutdown();
  await verifyRun(run.runId);

  console.log("✓ Demo run sent:", run.runId);
  console.log("\nOpen in dashboard:");
  console.log(`  ${DASHBOARD}/dashboard/runs/${run.runId}`);
  console.log(`  ${DASHBOARD}/dashboard/runs`);
  console.log(`  ${DASHBOARD}/dashboard/failures`);
}

main().catch((err) => {
  console.error("\nDemo failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
