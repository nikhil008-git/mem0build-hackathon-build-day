"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SdkPlayground() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [runId, setRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendDemo() {
    setStatus("loading");
    setError(null);
    setRunId(null);

    try {
      const res = await fetch("/api/demo-run", { method: "POST" });
      const data = (await res.json()) as { runId?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to send demo run");
      setRunId(data.runId ?? null);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  return (
    <div className="panel-elevated p-6 md:p-8">
      <p className="label-caps mb-2">Live demo</p>
      <p className="text-sm text-[var(--muted)]">
        Sends a sample failed agent run to ingest — no terminal, no login.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={() => void sendDemo()} disabled={status === "loading"} size="md">
          {status === "loading" ? "Sending..." : "Send demo run"}
        </Button>
        <ButtonLink href="/dashboard/runs" variant="secondary" size="md">
          View dashboard
        </ButtonLink>
      </div>

      {status === "success" && runId ? (
        <div className="mt-6 border border-black bg-[var(--accent-cream)] p-4">
          <p className="text-sm font-bold uppercase tracking-wide">Run captured</p>
          <p className="mt-2 font-mono text-xs">{runId}</p>
          <Link href={`/dashboard/runs/${runId}`} className="label-caps mt-4 inline-block hover:opacity-50">
            Open run →
          </Link>
        </div>
      ) : null}

      {status === "error" && error ? (
        <div className="mt-6 border border-black bg-[var(--accent-orange)] p-4 text-sm">
          {error}
          <p className="mt-2 text-xs text-[var(--muted)]">Make sure `npm run dev` is running (ingest on :8081).</p>
        </div>
      ) : null}
    </div>
  );
}

function ButtonLink({
  href,
  children,
  variant,
  size,
}: {
  href: string;
  children: React.ReactNode;
  variant: "secondary";
  size: "md";
}) {
  return (
    <Link
      href={href}
      className="label-caps inline-flex items-center justify-center rounded-full border border-black bg-transparent px-6 py-3 text-[10px] text-black transition hover:bg-black hover:text-white"
    >
      {children}
    </Link>
  );
}
