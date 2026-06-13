import type { EventBatch, EventEnvelope } from "@rift/observability-types";
import type { RiftConfig } from "./types.js";

export async function sendBatch(
  config: RiftConfig,
  events: EventEnvelope[],
): Promise<void> {
  const endpoint = config.endpoint ?? "http://localhost:8081";
  const body: EventBatch = { events };

  const res = await fetch(`${endpoint}/v1/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Rift ingest failed (${res.status}): ${text}`);
  }
}
