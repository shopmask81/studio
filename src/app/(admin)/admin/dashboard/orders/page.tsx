
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminOrdersPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Orders</h1>
      <Card>
        <CardHeader>
          <CardTitle>View Customer Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This section is under construction. Soon you'll be able to view and manage all customer orders here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
