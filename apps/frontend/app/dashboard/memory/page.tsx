import { DashboardTopBar } from "@/components/layout/dashboard-sidebar";
import { PageShell } from "@/components/layout/page-chrome";

export default function MemoryPage() {
  return (
    <>
      <DashboardTopBar
        eyebrow="Observability"
        title="Memory"
        subtitle="Reads and writes to agent memory stores — Mem0, Pinecone, Redis, and more."
      />
      <PageShell>
        <div className="panel-elevated p-8 md:p-10">
          <p className="label-caps mb-4">Memory access</p>
          <p className="max-w-xl text-sm leading-relaxed text-[var(--muted)]">
            Memory events appear on run timelines under the Memory tab. Send{" "}
            <code className="code-inline">memory.query</code> and{" "}
            <code className="code-inline">memory.results</code> via the SDK.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {["Mem0", "Pinecone", "Redis"].map((store) => (
              <div key={store} className="panel-muted p-6">
                <p className="text-sm font-bold uppercase tracking-wide">{store}</p>
                <p className="mt-2 text-xs text-[var(--muted)]">0 queries this period</p>
              </div>
            ))}
          </div>
        </div>
      </PageShell>
    </>
  );
}
