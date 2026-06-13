import { SiteNav, SiteFooter } from "@/components/layout/nav";
import { DecorativeTitle } from "@/components/layout/page-chrome";
import { CodeBlock } from "@/components/sdk/code-block";
import { SdkPlayground } from "@/components/sdk/sdk-playground";
import { SDK_CONFIG, SDK_QUICKSTART, HERMES_SETUP, INSTALL_CMD } from "@/lib/sdk-config";
import { ButtonLink } from "@/components/ui/button";

export default function SdkPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-black">
      <SiteNav />

      <main className="mx-auto max-w-5xl px-6 py-16 md:px-12 md:py-24">
        <p className="label-caps mb-4">Public · no login required</p>
        <h1 className="text-4xl md:text-5xl">
          <DecorativeTitle>Rift SDK</DecorativeTitle>
        </h1>
        <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">
          Instrument agents in under 5 minutes. Use the demo key below locally, send a test run from
          the browser, then open the dashboard — no account needed.
        </p>

        {/* Credentials */}
        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            { label: "API key", value: SDK_CONFIG.apiKey },
            { label: "Project", value: SDK_CONFIG.projectId },
            { label: "Ingest endpoint", value: SDK_CONFIG.endpoint },
          ].map((item) => (
            <div key={item.label} className="panel-elevated p-5">
              <p className="label-caps">{item.label}</p>
              <p className="mt-3 break-all font-mono text-xs">{item.value}</p>
            </div>
          ))}
        </section>

        {/* Live playground */}
        <section className="mt-12">
          <SdkPlayground />
        </section>

        {/* Install */}
        <section className="mt-16">
          <h2 className="text-sm font-bold uppercase tracking-[0.12em]">Install</h2>
          <div className="mt-4">
            <CodeBlock code={INSTALL_CMD} title="Terminal" />
          </div>
        </section>

        {/* Quickstart */}
        <section className="mt-12">
          <h2 className="text-sm font-bold uppercase tracking-[0.12em]">Quickstart</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">TypeScript — @rift/sdk-core</p>
          <div className="mt-4">
            <CodeBlock code={SDK_QUICKSTART} title="instrument.ts" />
          </div>
        </section>

        {/* Hermes */}
        <section className="mt-12">
          <h2 className="text-sm font-bold uppercase tracking-[0.12em]">Hermes plugin</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Python agents via Nous Research Hermes</p>
          <div className="mt-4">
            <CodeBlock code={HERMES_SETUP} title="WSL / terminal" />
          </div>
        </section>

        {/* CLI demo */}
        <section className="mt-12 panel-elevated p-6 md:p-8">
          <p className="label-caps">Or from terminal</p>
          <CodeBlock code="npm run demo" title="Monorepo root" />
        </section>

        <div className="mt-16 flex flex-wrap gap-4">
          <ButtonLink href="/dashboard/runs" size="lg">
            Open dashboard
          </ButtonLink>
          <ButtonLink href="/" variant="secondary" size="lg">
            Back home
          </ButtonLink>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
