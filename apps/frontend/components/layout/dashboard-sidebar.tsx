"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { DecorativeTitle } from "@/components/layout/page-chrome";

const observability = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/runs", label: "Runs" },
  { href: "/dashboard/failures", label: "Failures" },
  { href: "/dashboard/reasoning", label: "Reasoning" },
  { href: "/dashboard/memory", label: "Memory" },
  { href: "/dashboard/cost", label: "Cost" },
  { href: "/dashboard/latency", label: "Latency" },
];

const actions = [
  { href: "/dashboard/replay", label: "Replay" },
  { href: "/dashboard/remediation", label: "Remediation" },
  { href: "/dashboard/settings", label: "Settings" },
];

function NavSection({
  title,
  items,
  pathname,
}: {
  title: string;
  items: { href: string; label: string }[];
  pathname: string;
}) {
  return (
    <div className="mb-12">
      <p className="label-caps mb-5 border-b border-black/20 pb-3">{title}</p>
      <nav className="space-y-1">
        {items.map((item, i) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition ${
                active ? "text-black" : "text-[var(--muted-light)] hover:text-black"
              }`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full border border-black transition ${
                  active ? "bg-black" : "bg-transparent group-hover:bg-black/30"
                }`}
              />
              <span className={active ? "underline decoration-2 underline-offset-4" : ""}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="dashboard-sidebar relative flex h-full w-[17rem] shrink-0 flex-col border-r border-black bg-[var(--bg)] lg:w-72">
      <div className="absolute inset-y-0 right-0 w-px bg-black/10" />

      <div className="border-b border-black px-7 py-8">
        <Logo />
        <p className="label-caps mt-4">Agent observability</p>
      </div>

      <div className="flex-1 overflow-y-auto px-7 py-10">
        <NavSection title="Observability" items={observability} pathname={pathname} />
        <NavSection title="Actions" items={actions} pathname={pathname} />
      </div>

      <div className="border-t border-black px-7 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-black bg-[var(--accent-orange)] text-xs font-bold">
            D
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em]">Demo Project</p>
            <p className="mt-0.5 text-[10px] text-[var(--muted-light)]">demo · free tier</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function DashboardTopBar({
  title,
  subtitle,
  eyebrow,
  children,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="relative border-b border-black bg-[var(--bg)]">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-[var(--accent-orange)]" />
      <div className="flex flex-col gap-6 px-6 py-10 md:flex-row md:items-end md:justify-between md:px-10 md:py-12">
        <div className="max-w-2xl animate-fade-up">
          {eyebrow ? <p className="label-caps mb-4">{eyebrow}</p> : null}
          <h1 className="text-3xl md:text-4xl lg:text-[2.75rem]">
            <DecorativeTitle>{title}</DecorativeTitle>
          </h1>
          {subtitle ? (
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--muted)] md:text-[15px]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {children ? <div className="shrink-0 animate-fade-up">{children}</div> : null}
      </div>
    </header>
  );
}

export function DateRangeTabs() {
  const tabs = ["Today", "7D", "30D", "Custom"];
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab, i) => (
        <button
          key={tab}
          type="button"
          className={`label-caps rounded-full border border-black px-5 py-2.5 transition ${
            i === 1
              ? "bg-black text-white shadow-[3px_3px_0_0_var(--accent-purple)]"
              : "bg-transparent text-[var(--muted)] hover:bg-black hover:text-white"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
