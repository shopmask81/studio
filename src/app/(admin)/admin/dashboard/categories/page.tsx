
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminCategoriesPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Categories</h1>
      <Card>
        <CardHeader>
          <CardTitle>Manage Product Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This section is under construction. Soon you'll be able to add, edit, and delete product categories here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
