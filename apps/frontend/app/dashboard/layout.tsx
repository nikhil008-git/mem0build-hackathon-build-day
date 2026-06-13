import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-shell flex min-h-screen bg-[var(--bg)] text-black">
      <DashboardSidebar />
      <div className="dashboard-main flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
