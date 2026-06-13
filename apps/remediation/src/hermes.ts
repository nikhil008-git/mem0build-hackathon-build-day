import type { RemediationContext } from "./context.js";

export interface HermesAnalysis {
  analysis: string;
  patch: string;
  pr_title: string;
  confidence: string;
}

export async function analyzeWithHermes(
  context: RemediationContext,
): Promise<HermesAnalysis> {
  const url = process.env.HERMES_REMEDIATION_URL ?? "http://localhost:8083/analyze";

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(context),
  });

  const body = (await res.json()) as HermesAnalysis & { ok?: boolean; error?: string };

  if (!res.ok || body.error) {
    throw new Error(
      body.error ??
        `Hermes worker failed (${res.status}). Start it with: npm run hermes:worker`,
    );
  }

  return {
    analysis: body.analysis,
    patch: body.patch,
    pr_title: body.pr_title,
    confidence: body.confidence,
  };
}

export async function waitForHermes(maxAttempts = 5): Promise<boolean> {
  const base = process.env.HERMES_REMEDIATION_URL ?? "http://localhost:8083/analyze";
  const healthUrl = base.replace(/\/analyze$/, "/health");

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(healthUrl);
      if (res.ok) return true;
    } catch {
      // worker not up
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}
