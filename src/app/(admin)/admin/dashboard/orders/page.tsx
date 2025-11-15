
'use client';

import { useState, useMemo } from 'react';
import { OrderTable } from "./components/order-table";
import { OrderFilters, type Filters } from './components/order-filters';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { FirestorePermissionError } from '@/firebase/errors';

export default function AdminOrdersPage() {
  const firestore = useFirestore();
  const [filters, setFilters] = useState<Filters>({});

  const ordersQuery = useMemo(() => {
    if (!firestore) return null;
    
    const collectionRef = collection(firestore, 'orders');
    let q = query(collectionRef, orderBy('createdAt', 'desc'));

    if (filters.orderId) {
        // Firestore doesn't support prefix search, so this requires an exact match
        // A more complex search might need a third-party service like Algolia
        q = query(q, where('__name__', '==', filters.orderId));
    }
    if (filters.email) {
        q = query(q, where('email_lowercase', '==', filters.email.toLowerCase()));
    }
    if (filters.status) {
        q = query(q, where('status', '==', filters.status));
    }
    if (filters.dateRange?.from) {
        q = query(q, where('createdAt', '>=', Timestamp.fromDate(filters.dateRange.from)));
    }
    if (filters.dateRange?.to) {
        q = query(q, where('createdAt', '<=', Timestamp.fromDate(filters.dateRange.to)));
    }
    
    return q;
  }, [firestore, filters]);

  const { data: orders, isLoading, error } = useCollection<Order>(ordersQuery);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Orders</h1>
      </div>
      
      <OrderFilters onFilterChange={setFilters} />

      {error && error instanceof FirestorePermissionError && (
         <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Permission Denied</AlertTitle>
            <AlertDescription>
                You do not have permission to view orders. Please contact your administrator.
            </AlertDescription>
        </Alert>
      )}

      <OrderTable orders={orders} isLoading={isLoading} />
    </div>
  );
}
