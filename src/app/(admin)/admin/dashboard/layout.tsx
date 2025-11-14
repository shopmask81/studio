
import { AdminRoute } from "@/components/auth/admin-route";
import { AdminHeader } from "./components/AdminHeader";
import { AdminSidebar } from "./components/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRoute>
      <SidebarProvider>
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] group-data-[collapsible=icon]:md:grid-cols-[5rem_1fr]">
          <AdminSidebar />
          <div className="flex flex-col">
            <AdminHeader />
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/20 dark:bg-black/20">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AdminRoute>
  );
}
