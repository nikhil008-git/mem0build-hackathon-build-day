export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-full border border-black bg-[var(--accent-cream)] px-5 py-3 text-sm text-black placeholder:text-[var(--muted-light)] outline-none transition focus:ring-2 focus:ring-black/20 ${className ?? ""}`}
      {...props}
    />
  );
}
