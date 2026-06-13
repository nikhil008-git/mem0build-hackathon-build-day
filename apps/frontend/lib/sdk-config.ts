export const SDK_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_RIFT_API_KEY ?? "rift_test_demo_key",
  projectId: process.env.NEXT_PUBLIC_RIFT_PROJECT_ID ?? "demo",
  endpoint: process.env.NEXT_PUBLIC_RIFT_ENDPOINT ?? "http://localhost:8081",
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
};

export const SDK_QUICKSTART = `import { Rift } from "@rift/sdk-core";

const rift = new Rift({
  apiKey: "${SDK_CONFIG.apiKey}",
  projectId: "${SDK_CONFIG.projectId}",
  endpoint: "${SDK_CONFIG.endpoint}",
});

const run = rift.startRun({
  agent: "support-bot",
  framework: "vercel-ai",
  model: "gpt-4o",
  input: { message: userMessage },
});

run.record("llm.prompt", { model: "gpt-4o", messages: [...] });
run.record("tool.input", { toolName: "search", arguments: {...} }, spanId);
run.record("tool.output", { toolName: "search", result: {...} }, spanId);

run.end({ status: "success", output: { answer: "..." } });
await rift.shutdown();`;

export const HERMES_SETUP = `# Hermes telemetry plugin
export RIFT_API_KEY=${SDK_CONFIG.apiKey}
export RIFT_ENDPOINT=${SDK_CONFIG.endpoint}

cp -r packages/sdk-hermes/rift_plugin ~/.hermes/plugins/rift/`;

export const INSTALL_CMD = "npm install @rift/sdk-core  # workspace: packages/sdk-core";
