
'use client';

import { useState, useMemo, useCallback } from 'react';
import { OrderTable } from "./components/order-table";
import { OrderFilters, type Filters } from './components/order-filters';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, Timestamp, writeBatch, doc } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Loader2 } from 'lucide-react';
import { FirestorePermissionError, errorEmitter } from '@/firebase';
import { BulkActionsBar } from './components/bulk-actions-bar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/auth-provider';

export default function AdminOrdersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [filters, setFilters] = useState<Filters>({});
  const { userProfile, isLoading: isAuthLoading } = useAuth();
  
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

  const isAdmin = userProfile?.role === 'admin';

  // Server-side query based on status and date.
  const ordersQuery = useMemo(() => {
    // CRITICAL: Do not build the query until we know the user is an admin.
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
  // useCollection will wait if ordersQuery is null.
  const { data: allOrders, isLoading: isDataLoading, error } = useCollection<Order>(ordersQuery);

  // Client-side filtering logic for the unified search query.
  const filteredOrders = useMemo(() => {
    if (!allOrders) return null;
    if (!filters.searchQuery) return allOrders;

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


  // The overall loading state depends on auth AND data loading (if the user is an admin).
  const isLoading = isAuthLoading || (isAdmin && isDataLoading);

  const handleSelectionChange = (orderId: string, isSelected: boolean) => {
    setSelectedOrderIds(prev => 
      isSelected ? [...prev, orderId] : prev.filter(id => id !== orderId)
    );
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected && filteredOrders) {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleBulkStatusChange = useCallback(async (status: Order['status']) => {
    if (!firestore || selectedOrderIds.length === 0) return;
    setIsBulkActionLoading(true);
    
    const batch = writeBatch(firestore);
    const dataToUpdate = { status };
    selectedOrderIds.forEach(orderId => {
        const orderRef = doc(firestore, 'orders', orderId);
        batch.update(orderRef, dataToUpdate);
    });

    batch.commit()
      .then(() => {
        toast({
            title: "Bulk Update Successful",
            description: `${selectedOrderIds.length} orders have been updated to "${status}".`
        });
        setSelectedOrderIds([]); // Clear selection after action
      })
      .catch((error) => {
        console.error("Bulk status update failed:", error);
        toast({
            variant: "destructive",
            title: "Bulk Update Failed",
            description: "Could not update order statuses. Please check permissions."
        });

        const permissionError = new FirestorePermissionError({
          path: 'orders/[MULTIPLE]',
          operation: 'update',
          requestResourceData: dataToUpdate,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsBulkActionLoading(false);
      });

  }, [firestore, selectedOrderIds, toast]);

  const handleBulkDelete = useCallback(async () => {
    if (!firestore || selectedOrderIds.length === 0) return;
    setIsBulkActionLoading(true);

    const batch = writeBatch(firestore);
    selectedOrderIds.forEach(orderId => {
        const orderRef = doc(firestore, 'orders', orderId);
        batch.delete(orderRef);
    });

    batch.commit()
      .then(() => {
        toast({
            title: "Bulk Delete Successful",
            description: `${selectedOrderIds.length} orders have been deleted.`
        });
        setSelectedOrderIds([]); // Clear selection after action
      })
      .catch((error) => {
        console.error("Bulk delete failed:", error);
        toast({
            variant: "destructive",
            title: "Bulk Delete Failed",
            description: "Could not delete orders. Please check permissions."
        });
        const permissionError = new FirestorePermissionError({
          path: 'orders/[MULTIPLE]',
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsBulkActionLoading(false);
      });
  }, [firestore, selectedOrderIds, toast]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Orders</h1>
      </div>
      
      <OrderFilters onFilterChange={setFilters} />

      {isBulkActionLoading && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}

      {selectedOrderIds.length > 0 && (
          <BulkActionsBar
            selectedCount={selectedOrderIds.length}
            onStatusChange={handleBulkStatusChange}
            onDelete={handleBulkDelete}
          />
      )}

      {error && (
         <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Permission Denied</AlertTitle>
            <AlertDescription>
                You do not have permission to view orders. Please contact your administrator.
            </AlertDescription>
        </Alert>
      )}

      <OrderTable 
        orders={filteredOrders} 
        isLoading={isLoading} 
        selectedOrderIds={selectedOrderIds}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
      />
    </div>
  );
}
