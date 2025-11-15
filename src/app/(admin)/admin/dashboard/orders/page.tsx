
import { OrderTable } from "./components/order-table";

export default function AdminOrdersPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Orders</h1>
      </div>
      <OrderTable />
    </div>
  );
}

    