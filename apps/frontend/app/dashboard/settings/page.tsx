import { DashboardTopBar } from "@/components/layout/dashboard-sidebar";
import { PageShell } from "@/components/layout/page-chrome";
import { Input } from "@/components/ui/input";

const GITHUB_REPO = process.env.GITHUB_REPO ?? "gittt/rift-support-agent-demo";
const HAS_TOKEN = Boolean(process.env.GITHUB_TOKEN);

export default function SettingsPage() {
  return (
    <>
      <DashboardTopBar
        eyebrow="Actions"
        title="Settings"
        subtitle="API keys, GitHub connection, and Hermes worker configuration."
      />
      <PageShell>
        <div className="mx-auto max-w-xl space-y-6">
          {[
            {
              title: "Project",
              desc: "Demo project configuration",
              fields: [
                { label: "Name", value: "Demo Project" },
                { label: "Slug", value: "demo" },
              ],
            },
            {
              title: "API key",
              desc: "Use with @rift/sdk-core or Hermes plugin",
              fields: [{ label: "Key", value: "rift_test_demo_key" }],
            },
            {
              title: "GitHub",
              desc: "Add GITHUB_TOKEN to root .env for real PRs",
              fields: [
                { label: "Repository", value: GITHUB_REPO },
                { label: "Token", value: HAS_TOKEN ? "Configured" : "Not set" },
              ],
            },
          ].map((section) => (
            <section key={section.title} className="panel-elevated p-6 md:p-8">
              <p className="label-caps">{section.title}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">{section.desc}</p>
              <div className="mt-5 space-y-3">
                {section.fields.map((f) => (
                  <Input key={f.label} defaultValue={f.value} readOnly aria-label={f.label} />
                ))}
              </div>
            </section>
          ))}

          <section className="panel-elevated p-6 md:p-8">
            <p className="label-caps">Hermes worker</p>
            <pre className="mt-4 overflow-x-auto border border-black bg-black p-5 text-xs leading-relaxed text-[var(--bg)]">
              {`export OPENROUTER_API_KEY=sk-or-...
npm run hermes:worker`}
            </pre>
          </section>
        </div>
      </PageShell>
    </>
  );
}
