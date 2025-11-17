'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { OrderTable } from "./components/order-table";
import { OrderFilters, type Filters } from './components/order-filters';
import { useFirestore } from '@/firebase';
import { collection, query, where, orderBy, Timestamp, writeBatch, doc, getDocs } from 'firebase/firestore';
import type { Order, Product } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Loader2 } from 'lucide-react';
import { BulkActionsBar } from './components/bulk-actions-bar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/auth-provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { OrderPDFGenerator } from './components/order-pdf-generator';

export default function AdminOrdersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [filters, setFilters] = useState<Filters>({});
  const { userProfile, isLoading: isAuthLoading } = useAuth();
  
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

  // State to cache product image URLs
  const [productImages, setProductImages] = useState<Record<string, string | null>>({});

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
    if (!allOrders) return [];
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


  // Effect to fetch product images for the current set of filtered orders
  useEffect(() => {
    if (!firestore || !filteredOrders || filteredOrders.length === 0) {
      return;
    }

    const fetchProductImages = async () => {
        // 1. Collect unique product IDs from the first item of each order
        const productIdsToFetch = [
          ...new Set(
            filteredOrders
              .map(order => order.items?.[0]?.productId)
              .filter((id): id is string => !!id && !productImages.hasOwnProperty(id))
          ),
        ];

        if (productIdsToFetch.length === 0) {
          return; // All images are already cached
        }

        // Set initial loading state for new product IDs
        setProductImages(prev => {
            const newPlaceholders: Record<string, undefined> = {};
            productIdsToFetch.forEach(id => newPlaceholders[id] = undefined);
            return {...prev, ...newPlaceholders};
        });

        // 2. Fetch product documents in batches of 30 (Firestore 'in' query limit)
        const newImageMap: Record<string, string | null> = {};
        const productChunks = [];
        for (let i = 0; i < productIdsToFetch.length; i += 30) {
          productChunks.push(productIdsToFetch.slice(i, i + 30));
        }

        for (const chunk of productChunks) {
            const productsRef = collection(firestore, 'products');
            const q = query(productsRef, where('__name__', 'in', chunk));
            const querySnapshot = await getDocs(q);

            querySnapshot.forEach(doc => {
              const product = doc.data() as Product;
              newImageMap[doc.id] = product.mainImage || product.images?.[0] || null;
            });
        }
        
        // 3. Update the image cache state
        setProductImages(prev => ({...prev, ...newImageMap}));
    };

    fetchProductImages();
  }, [filteredOrders, firestore, productImages]);


  // The overall loading state depends on auth AND data loading (if the user is an admin).
  const isLoading = isAuthLoading || (isAdmin && isDataLoading);

  const selectedOrders = useMemo(() => {
    return filteredOrders.filter(order => selectedOrderIds.includes(order.id));
  }, [filteredOrders, selectedOrderIds]);

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

  const handleBulkStatusChange = async (status: Order['status']) => {
    if (!firestore || selectedOrderIds.length === 0) return;
    setIsBulkActionLoading(true);
    
    const batch = writeBatch(firestore);
    const dataToUpdate = { status };
    selectedOrderIds.forEach(orderId => {
        const orderRef = doc(firestore, 'orders', orderId);
        batch.update(orderRef, dataToUpdate);
    });

    try {
        await batch.commit();
        toast({
            title: "Bulk Update Successful",
            description: `${selectedOrderIds.length} orders have been updated to "${status}".`
        });
        setSelectedOrderIds([]); // Clear selection after action
    } catch(error) {
        console.error("Bulk status update failed:", error);
        toast({
            variant: "destructive",
            title: "Bulk Update Failed",
            description: "Could not update order statuses. Check permissions."
        });
        throw error;
    } finally {
        setIsBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!firestore || selectedOrderIds.length === 0) return;
    setIsBulkActionLoading(true);

    const batch = writeBatch(firestore);
    selectedOrderIds.forEach(orderId => {
        const orderRef = doc(firestore, 'orders', orderId);
        batch.delete(orderRef);
    });

     try {
        await batch.commit();
        toast({
            title: "Bulk Delete Successful",
            description: `${selectedOrderIds.length} orders have been deleted.`
        });
        setSelectedOrderIds([]);
    } catch (error) {
        console.error("Bulk delete failed:", error);
        toast({
            variant: "destructive",
            title: "Bulk Delete Failed",
            description: "Could not delete orders. Check permissions."
        });
        throw error;
    } finally {
        setIsBulkActionLoading(false);
    }
  };
  
  const [isExporting, setIsExporting] = useState(false);
  const [ordersToExport, setOrdersToExport] = useState<Order[]>([]);

  const triggerExport = (orders: Order[]) => {
      setOrdersToExport(orders);
      setIsExporting(true);
  };
  
  useEffect(() => {
      if (isExporting) {
          // This will trigger the PDF generation in the OrderPDFGenerator component
          // A small timeout allows the state to update and the component to render
          const timer = setTimeout(() => {
              // The actual generation is handled inside the generator component
              // which we expect to be rendered now.
          }, 100);
          return () => clearTimeout(timer);
      }
  }, [isExporting]);


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Orders</h1>
         {filteredOrders && filteredOrders.length > 0 && (
            <OrderPDFGenerator orders={filteredOrders} isLoading={isLoading} />
        )}
      </div>
      
      <OrderFilters onFilterChange={setFilters} />

      {isBulkActionLoading && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}

      {selectedOrderIds.length > 0 && (
          <BulkActionsBar
            selectedOrders={selectedOrders}
            onStatusChange={handleBulkStatusChange}
            onDelete={handleBulkDelete}
            onExport={triggerExport}
          />
      )}
      
      {isExporting && <OrderPDFGenerator orders={ordersToExport} variant="selected" />}


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
        productImages={productImages}
      />
    </div>
  );
}
