
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminUsersPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Users</h1>
      <Card>
        <CardHeader>
          <CardTitle>Manage Users</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This section is under construction. Soon you'll be able to view users and manage their roles here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
