import Link from "next/link";

export function DecorativeTitle({ children }: { children: string }) {
  const first = children.charAt(0);
  const rest = children.slice(1);

  return (
    <span className="display-headline">
      <span className="display-serif mr-0.5 text-[1.15em]">{first}</span>
      {rest}
    </span>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="page-shell">{children}</div>;
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-[0.12em]">{title}</h2>
        {subtitle ? <p className="mt-1.5 text-xs text-[var(--muted)]">{subtitle}</p> : null}
      </div>
      {action ? (
        <Link href={action.href} className="label-caps shrink-0 hover:opacity-50">
          {action.label} →
        </Link>
      ) : null}
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

export function StatBlock({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "orange" | "purple" | "none";
}) {
  const accentBar =
    accent === "orange"
      ? "bg-[var(--accent-orange)]"
      : accent === "purple"
        ? "bg-[var(--accent-purple)]"
        : "bg-black";

  return (
    <div className="panel-elevated relative overflow-hidden p-6">
      <div className={`absolute inset-x-0 top-0 h-1 ${accentBar}`} />
      <p className="label-caps">{label}</p>
      <p className="display-headline mt-4 text-3xl md:text-4xl">{value}</p>
    </div>
  );
}

export function ListPanel({
  empty,
  children,
}: {
  empty?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel-elevated divide-y divide-black overflow-hidden">
      {empty ? <p className="empty-state">{empty}</p> : children}
    </div>
  );
}

export function ListRowLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="list-row block border-t border-black first:border-t-0">
      {children}
    </Link>
  );
}

export function ListRow({ children }: { children: React.ReactNode }) {
  return <div className="list-row border-t border-black first:border-t-0">{children}</div>;
}
