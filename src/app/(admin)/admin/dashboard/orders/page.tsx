
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

  // Server-side query based on status and date.
  const ordersQuery = useMemo(() => {
    if (!firestore || !isAdmin) return null;
    
    let q = query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));

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
  }, [firestore, isAdmin, filters.status, filters.dateRange]);

  // Fetch all orders matching the server-side query.
  const { data: allOrders, isLoading: isDataLoading, error } = useCollection<Order>(ordersQuery);

  // Client-side filtering logic for the unified search query.
  const filteredOrders = useMemo(() => {
    if (!allOrders) return null;
    if (!filters.searchQuery) return allOrders; // Return all if search is empty

    const lowerCaseQuery = filters.searchQuery.toLowerCase();

    return allOrders.filter(order => {
      // Check against multiple fields, safely handling potentially undefined ones.
      return (
        (order.id?.toLowerCase() ?? '').includes(lowerCaseQuery) ||
        (order.name?.toLowerCase() ?? '').includes(lowerCaseQuery) ||
        (order.email?.toLowerCase() ?? '').includes(lowerCaseQuery) ||
        (order.phone?.toLowerCase() ?? '').includes(lowerCaseQuery) ||
        (order.street?.toLowerCase() ?? '').includes(lowerCaseQuery) ||
        (order.city?.toLowerCase() ?? '').includes(lowerCaseQuery) ||
        (order.zip?.toLowerCase() ?? '').includes(lowerCaseQuery) ||
        (order.country?.toLowerCase() ?? '').includes(lowerCaseQuery)
      );
    });
  }, [allOrders, filters.searchQuery]);


  // The overall loading state depends on auth AND data loading.
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

      <OrderTable orders={filteredOrders} isLoading={isLoading} />
    </div>
  );
}
