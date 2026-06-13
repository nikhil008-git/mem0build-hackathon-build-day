/**
 * Demo: send a sample agent run to Rift.
 * Run: npx tsx examples/demo-run.ts
 */
import { Rift } from "@rift/sdk-core";

const rift = new Rift({
  apiKey: process.env.RIFT_API_KEY ?? "rift_test_demo_key",
  projectId: process.env.RIFT_PROJECT_ID ?? "demo",
  endpoint: process.env.RIFT_ENDPOINT ?? "http://localhost:8081",
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
run.record("tool.input", {
  spanId,
  toolName: "search_docs",
  arguments: { query: "password reset" },
}, spanId);

run.record("tool.output", {
  spanId,
  toolName: "search_docs",
  result: { error: "Index not found: docs_v2" },
  latencyMs: 340,
}, spanId);

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
console.log("Demo run sent:", run.runId);
