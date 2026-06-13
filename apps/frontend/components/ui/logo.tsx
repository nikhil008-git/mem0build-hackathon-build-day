import Link from "next/link";

export function Logo({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`group inline-flex items-center gap-3 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center border border-black bg-black text-[var(--bg)] transition group-hover:bg-[var(--accent-orange)] group-hover:text-black">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M13 2L4 14h7l-1 10 9-14h-7l1-8z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="font-[family-name:var(--font-syne)] text-sm font-extrabold tracking-[0.22em]">
        RIFT
      </span>
    </Link>
  );
}
