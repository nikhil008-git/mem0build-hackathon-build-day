import { config } from "dotenv";
import { resolve } from "node:path";
import express from "express";
import { EventBatchSchema } from "@rift/observability-types";
import { authApiKey, processEvents } from "./process.js";

config({ path: resolve(import.meta.dirname, "../../../.env") });

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/v1/events", authApiKey, async (req, res) => {
  const parsed = EventBatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid event batch", details: parsed.error.flatten() });
    return;
  }

  try {
    await processEvents(req.rift!.projectId, parsed.data.events);
    res.status(202).json({ accepted: parsed.data.events.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed";
    res.status(400).json({ error: message });
  }
});

const PORT = Number(process.env.INGEST_PORT ?? 8081);
app.listen(PORT, () => {
  console.log(`Ingest API running on http://localhost:${PORT}`);
});
