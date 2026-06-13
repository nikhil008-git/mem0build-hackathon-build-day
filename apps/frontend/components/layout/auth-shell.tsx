import { Logo } from "@/components/ui/logo";
import { DecorativeTitle } from "@/components/layout/page-chrome";

export function AuthShell({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-black">
      <header className="rule px-6 py-7 md:px-12">
        <Logo />
      </header>

      <main className="grid min-h-[calc(100vh-73px)] lg:grid-cols-2">
        <section className="flex flex-col justify-center border-b border-black px-6 py-16 md:px-12 lg:border-b-0 lg:border-r">
          <div className="max-w-lg animate-fade-up">
            <p className="label-caps mb-6">Rift workspace</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl">
              <DecorativeTitle>{title}</DecorativeTitle>
            </h1>
            <p className="mt-6 text-[15px] leading-relaxed text-[var(--muted)]">{subtitle}</p>
          </div>
        </section>

        <section className="flex items-center justify-center bg-[var(--accent-cream)] px-6 py-16 md:px-12">
          <div className="animate-fade-up w-full max-w-md">
            <div className="panel-elevated p-8 md:p-10">{children}</div>
            <p className="mt-8 text-center text-sm text-[var(--muted)]">{footer}</p>
          </div>
        </section>
      </main>
    </div>
  );
}
