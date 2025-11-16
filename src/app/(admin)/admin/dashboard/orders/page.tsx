
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
import { useAuth } from '@/components/auth/auth-provider';

export default function AdminOrdersPage() {
  const firestore = useFirestore();
  const [filters, setFilters] = useState<Filters>({});
  const { userProfile, isLoading: isAuthLoading } = useAuth();

  const isAdmin = userProfile?.role === 'admin';

  const ordersQuery = useMemo(() => {
    // CRITICAL: Do not build the query until we know the user is an admin.
    // The useCollection hook will wait if the query is null.
    if (!firestore || !isAdmin) return null;
    
    const collectionRef = collection(firestore, 'orders');
    let q = query(collectionRef, orderBy('createdAt', 'desc'));

    if (filters.orderId) {
        // Firestore doesn't support prefix search, so this requires an exact match
        // A more complex search might need a third-party service like Algolia
        try {
            q = query(q, where('__name__', '==', filters.orderId));
        } catch (e) {
            // Handle invalid ID format if necessary
            return collection(firestore, 'orders'); // Return a base query that finds nothing
        }
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
  }, [firestore, isAdmin, filters]);

  // isDataLoading is the loading state for the Firestore query itself.
  const { data: orders, isLoading: isDataLoading, error } = useCollection<Order>(ordersQuery);

  // The overall loading state depends on auth AND data loading, but only if a query is active.
  const isLoading = isAuthLoading || (isAdmin && isDataLoading);

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
