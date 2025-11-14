
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Manage Shop Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This section is under construction. Soon you'll be able to manage general store settings here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
