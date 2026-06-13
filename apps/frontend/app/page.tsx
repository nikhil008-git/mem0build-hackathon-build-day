import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/layout/nav";
import { ButtonLink } from "@/components/ui/button";
import { DecorativeTitle } from "@/components/layout/page-chrome";
import { SdkPlayground } from "@/components/sdk/sdk-playground";

const capabilities = [
  {
    n: "01",
    title: "Observe",
    desc: "Every run, tool call, reasoning step, memory access, and cost — one timeline.",
  },
  {
    n: "02",
    title: "Diagnose",
    desc: "Failure inbox grouped by fingerprint. Find root cause in seconds, not hours.",
  },
  {
    n: "03",
    title: "Remediate",
    desc: "Hermes analyzes failures and Rift opens GitHub PRs with patches attached.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-black">
      <SiteNav />

      <main>
        {/* Hero split */}
        <section className="grid min-h-[88vh] lg:grid-cols-2">
          <div className="flex flex-col justify-center px-6 py-16 md:px-12 md:py-24">
            <div className="max-w-xl animate-fade-up">
              <p className="label-caps mb-6">Agent observability platform</p>
              <h1 className="text-[clamp(2.75rem,7vw,5rem)] leading-[0.9]">
                <DecorativeTitle>Observe agents fix failures ship PRs fast</DecorativeTitle>
              </h1>
              <p className="mt-8 max-w-md text-[15px] leading-relaxed text-[var(--muted)]">
                Datadog × Sentry × PostHog — built for AI agents. One SDK, full visibility,
                Hermes-powered auto-remediation.
              </p>
              <div className="mt-12 flex flex-wrap gap-4">
                <ButtonLink href="/sdk" size="lg">
                  Try SDK
                </ButtonLink>
                <ButtonLink href="/sign-up" size="lg">
                  Get started
                </ButtonLink>
                <ButtonLink href="/dashboard" variant="secondary" size="lg">
                  View dashboard
                </ButtonLink>
              </div>
            </div>
          </div>

          <div className="relative min-h-[420px] overflow-hidden bg-[var(--accent-purple)] lg:min-h-0">
            <div
              className="absolute inset-0 bg-[var(--accent-orange)]"
              style={{ clipPath: "polygon(48% 0, 100% 0, 100% 100%, 22% 100%)" }}
            />
            <div className="relative flex h-full items-center justify-center px-8 py-16">
              <div className="w-full max-w-[300px] rounded-[2.25rem] border-[3px] border-black bg-black p-3 shadow-[10px_10px_0_0_#000]">
                <div className="rounded-[1.75rem] bg-black px-6 py-8 text-white">
                  <div className="flex items-center justify-between">
                    <span className="label-caps text-white/60">Rift</span>
                    <span className="text-white/40">☰</span>
                  </div>
                  <p className="label-caps mt-10 text-white/50">Live statistics</p>
                  <p className="display-headline mt-3 text-6xl text-white">28m</p>
                  <p className="mt-2 text-xs text-white/40">runs captured</p>
                  <div className="mt-10 space-y-3">
                    {["Failures · 23", "PRs opened · 4", "Hermes · active"].map((row) => (
                      <div
                        key={row}
                        className="rounded-full border border-white/25 px-4 py-2.5 text-center text-[10px] uppercase tracking-[0.2em] text-white/80"
                      >
                        {row}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="rule px-6 py-20 md:px-12 md:py-28">
          <div className="mx-auto max-w-6xl">
            <p className="label-caps">Capabilities</p>
            <h2 className="mt-4 text-3xl md:text-4xl">
              <DecorativeTitle>Everything your agent stack needs</DecorativeTitle>
            </h2>
            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {capabilities.map((cap) => (
                <div key={cap.n} className="panel-elevated p-8">
                  <p className="display-serif text-4xl text-[var(--accent-orange)]">{cap.n}</p>
                  <h3 className="mt-6 text-sm font-bold uppercase tracking-[0.14em]">{cap.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">{cap.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SDK playground — no login */}
        <section className="rule px-6 py-20 md:px-12 md:py-28">
          <div className="mx-auto max-w-3xl">
            <p className="label-caps">Try it now</p>
            <h2 className="mt-4 text-3xl md:text-4xl">
              <DecorativeTitle>Send a demo run from the browser</DecorativeTitle>
            </h2>
            <p className="mt-4 text-sm text-[var(--muted)]">
              No login, no terminal. Uses the public demo API key → ingest → dashboard.
            </p>
            <div className="mt-10">
              <SdkPlayground />
            </div>
            <Link href="/sdk" className="label-caps mt-6 inline-block hover:opacity-50">
              Full SDK docs →
            </Link>
          </div>
        </section>

        {/* CTA band */}
        <section className="border-y border-black bg-[var(--accent-cream)] px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-10 md:flex-row md:items-center">
            <h2 className="text-3xl md:text-5xl">
              <DecorativeTitle>Want a project</DecorativeTitle>
            </h2>
            <ButtonLink href="/sdk" size="lg">
              Explore all
            </ButtonLink>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
