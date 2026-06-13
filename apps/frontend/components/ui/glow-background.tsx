export function GlowBackground({ variant = "default" }: { variant?: "default" | "auth" | "hero" }) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {variant === "hero" ? (
        <>
          <div className="glow-orb glow-orb-warm -bottom-32 left-1/2 h-[420px] w-[640px] -translate-x-1/2" />
          <div className="glow-orb glow-orb-blue -top-20 right-1/4 h-72 w-72" />
          <div className="glow-orb glow-orb-cyan top-1/3 -left-20 h-64 w-64" />
        </>
      ) : variant === "auth" ? (
        <>
          <div className="glow-orb glow-orb-violet top-1/4 left-1/2 h-80 w-80 -translate-x-1/2" />
          <div className="glow-orb glow-orb-cyan bottom-1/4 right-1/4 h-56 w-56" />
        </>
      ) : (
        <>
          <div className="glow-orb glow-orb-blue -top-32 right-0 h-64 w-64 opacity-30" />
          <div className="glow-orb glow-orb-violet bottom-0 left-1/4 h-48 w-48 opacity-25" />
        </>
      )}
    </div>
  );
}
