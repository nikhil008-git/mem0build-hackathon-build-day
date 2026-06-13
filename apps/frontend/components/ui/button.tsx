import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "ghost";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-black text-white hover:bg-[var(--accent-ink)] border border-black shadow-[4px_4px_0_0_var(--accent-orange)] hover:shadow-[2px_2px_0_0_var(--accent-orange)] hover:translate-x-[2px] hover:translate-y-[2px]",
  secondary:
    "border border-black bg-transparent text-black hover:bg-black hover:text-white shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]",
  ghost: "text-[var(--muted)] hover:text-black",
};

const sizes = {
  sm: "px-5 py-2.5 text-[10px]",
  md: "px-6 py-3 text-[10px]",
  lg: "px-8 py-3.5 text-[11px]",
};

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: keyof typeof sizes;
}) {
  return (
    <button
      className={cn(
        "label-caps inline-flex items-center justify-center rounded-full transition-all duration-150 disabled:opacity-40",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "label-caps inline-flex items-center justify-center rounded-full transition-all duration-150",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </Link>
  );
}
