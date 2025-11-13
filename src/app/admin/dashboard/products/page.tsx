
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { ProductTable } from "./components/product-table";

export default function AdminProductsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button asChild>
          <Link href="/admin/dashboard/products/add">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Product
          </Link>
        </Button>
      </div>
      <ProductTable />
    </div>
  );
}
