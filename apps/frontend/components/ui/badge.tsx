function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    success: "bg-black text-white border-black",
    error: "bg-[var(--accent-orange)] text-black border-black",
    running: "bg-[var(--accent-purple)] text-white border-black",
    pr_demo: "bg-[var(--accent-cream)] text-black border-black",
    pr_opened: "bg-black text-white border-black",
    fix_generated: "bg-[var(--accent-cream)] text-black border-black",
  };

  return (
    <span
      className={cn(
        "label-caps inline-flex rounded-full border px-3 py-1",
        styles[status] ?? "bg-[var(--accent-cream)] text-black border-black",
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="label-caps inline-flex rounded-full border border-black bg-[var(--accent-cream)] px-3 py-1 text-[10px] text-black">
      {children}
    </span>
  );
}

export function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "label-caps rounded-full border px-4 py-2 transition",
        active
          ? "border-black bg-black text-white"
          : "border-black bg-transparent text-[var(--muted)] hover:bg-black hover:text-white",
      )}
    >
      {children}
    </button>
  );
}
