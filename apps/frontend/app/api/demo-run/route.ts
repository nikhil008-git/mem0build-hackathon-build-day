import { config } from "dotenv";
import { resolve } from "node:path";
import { NextResponse } from "next/server";
import { Rift } from "@rift/sdk-core";

config({ path: resolve(process.cwd(), "../../.env") });

export async function POST() {
  const endpoint = process.env.RIFT_ENDPOINT ?? process.env.NEXT_PUBLIC_RIFT_ENDPOINT ?? "http://localhost:8081";

  try {
    const health = await fetch(`${endpoint}/health`);
    if (!health.ok) {
      return NextResponse.json({ error: "Ingest API not running. Start with: npm run dev" }, { status: 503 });
    }
  } catch {
    return NextResponse.json({ error: "Ingest API not reachable at " + endpoint }, { status: 503 });
  }

  try {
    const rift = new Rift({
      apiKey: process.env.RIFT_API_KEY ?? "rift_test_demo_key",
      projectId: process.env.RIFT_PROJECT_ID ?? "demo",
      endpoint,
    });

    const run = rift.startRun({
      agent: "support-bot",
      framework: "vercel-ai",
      model: "gpt-4o",
      input: { message: "How do I reset my password?" },
      metadata: { sessionId: "sess_ui_demo", source: "frontend-sdk-playground" },
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
      toolCalls: [{ name: "search_docs", arguments: { query: "password reset" } }],
      latencyMs: 1400,
    });

    run.record("tool.input", { spanId, toolName: "search_docs", arguments: { query: "password reset" } }, spanId);
    run.record(
      "tool.output",
      { spanId, toolName: "search_docs", result: { error: "Index not found: docs_v2" }, latencyMs: 340 },
      spanId,
    );

    run.end({
      status: "error",
      error: { type: "tool_error", message: "Index not found: docs_v2", spanId },
      costUsd: 0.0023,
      output: { message: "Unable to search documentation." },
      tokenUsage: { promptTokens: 120, completionTokens: 45, totalTokens: 165 },
    });

    await rift.shutdown();

    return NextResponse.json({
      runId: run.runId,
      dashboardUrl: `/dashboard/runs/${run.runId}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Demo failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
