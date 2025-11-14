
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
        <div className="flex min-h-screen">
          <AdminSidebar />
          <main className="flex-1 flex flex-col">
            <AdminHeader />
            <div className="flex-1 p-8 bg-muted/40">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </AdminRoute>
  );
}
