function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Card({
  children,
  className,
  muted = false,
  elevated = false,
}: {
  children: React.ReactNode;
  className?: string;
  muted?: boolean;
  elevated?: boolean;
}) {
  return (
    <div
      className={cn(
        muted ? "panel-muted" : elevated ? "panel-elevated" : "panel",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  sub,
  trend,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: string;
  accent?: "orange" | "purple" | "none";
}) {
  const bar =
    accent === "orange"
      ? "bg-[var(--accent-orange)]"
      : accent === "purple"
        ? "bg-[var(--accent-purple)]"
        : "bg-black";

  return (
    <Card elevated className="relative overflow-hidden p-6">
      <div className={cn("absolute inset-x-0 top-0 h-1", bar)} />
      <p className="label-caps">{label}</p>
      <p className="display-headline mt-4 text-4xl md:text-5xl">{value}</p>
      {sub ? <p className="mt-2 text-sm text-[var(--muted)]">{sub}</p> : null}
      {trend ? (
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-light)]">
          {trend}
        </p>
      ) : null}
    </Card>
  );
}
