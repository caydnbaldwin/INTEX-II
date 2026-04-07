import { DonorSidebar } from "@/components/donor-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <DonorSidebar />
      <main className="ml-64 min-h-screen p-8">{children}</main>
    </div>
  );
}
