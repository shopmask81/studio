
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Welcome, Admin!</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is your administrative dashboard. From here, you can manage products, orders, users, and more.</p>
          <p className="text-muted-foreground mt-2">Use the sidebar to navigate to different sections.</p>
        </CardContent>
      </Card>
    </div>
  );
}
