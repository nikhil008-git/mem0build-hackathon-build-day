import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";

const nav = [
  { label: "SDK", href: "/sdk" },
  { label: "Dashboard", href: "/dashboard/runs" },
  { label: "Pricing", href: "#" },
];

export function SiteNav() {
  return (
    <header className="rule flex items-center justify-between px-6 py-7 md:px-12 md:py-8">
      <Logo />

      <nav className="hidden items-center gap-12 md:flex">
        {nav.map((item) => (
          <Link key={item.label} href={item.href} className="label-caps hover:opacity-50">
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <Link href="/sign-in" className="label-caps hidden hover:opacity-50 sm:inline">
          Sign in
        </Link>
        <ButtonLink href="/dashboard" size="sm">
          Open app
        </ButtonLink>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const cols = [
    {
      title: "Product",
      links: [
        { label: "Runs", href: "/dashboard/runs" },
        { label: "Failures", href: "/dashboard/failures" },
        { label: "Remediation", href: "/dashboard/remediation" },
        { label: "Replay", href: "/dashboard/replay" },
      ],
    },
    {
      title: "Integrations",
      links: [
        { label: "SDK", href: "/sdk" },
        { label: "Hermes", href: "/sdk" },
        { label: "Dashboard", href: "/dashboard/runs" },
        { label: "GitHub", href: "/dashboard/settings" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/" },
        { label: "SDK Docs", href: "/sdk" },
        { label: "Pricing", href: "#" },
        { label: "Contact", href: "#" },
      ],
    },
  ];

  return (
    <footer className="rule bg-[var(--bg)] px-6 py-16 md:px-12 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Logo />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-[var(--muted)]">
              Observe agent runs. Fix failures with Hermes. Ship PRs automatically.
            </p>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-10 sm:grid-cols-3 lg:max-w-2xl">
            {cols.map((col) => (
              <div key={col.title}>
                <p className="label-caps mb-4">{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm font-semibold uppercase tracking-wide hover:opacity-50"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="rule mt-12 flex flex-col gap-4 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--muted-light)]">© Rift 2026 — Agent Observability</p>
          <div className="flex gap-6">
            {["Twitter", "GitHub", "Discord"].map((s) => (
              <span key={s} className="label-caps hover:opacity-50">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
