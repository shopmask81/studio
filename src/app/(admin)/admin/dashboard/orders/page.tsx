
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { OrderTable } from "./components/order-table";
import { OrderFilters, type Filters } from './components/order-filters';
import { useFirestore } from '@/firebase';
import { collection, query, where, Timestamp, writeBatch, doc, getDocs, orderBy } from 'firebase/firestore';
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
  const [ordersToExport, setOrdersToExport] = useState<Order[]>([]);
  const [isExportingSelected, setIsExportingSelected] = useState(false);


  // State for one-time fetched data when filters are active
  const [fetchedOrders, setFetchedOrders] = useState<Order[] | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  // State to cache product image URLs
  const [productImages, setProductImages] = useState<Record<string, string | null | undefined>>({});

  const isAdmin = userProfile?.role === 'admin';
  const isAnyFilterActive = !!(filters.status || filters.dateRange?.from || filters.searchQuery);

  // Real-time query for the default, unfiltered view
  const liveOrdersQuery = useMemo(() => {
    // Only run this query if user is an admin AND no filters are active AND auth has loaded
    if (!firestore || !isAdmin || isAnyFilterActive || isAuthLoading) return null;
    
    return query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
  }, [firestore, isAdmin, isAnyFilterActive, isAuthLoading]);

  // Fetch all orders matching the real-time query.
  // This hook will pause if liveOrdersQuery is null.
  const { data: liveOrders, isLoading: isRealtimeLoading, error: realtimeError } = useCollection<Order>(liveOrdersQuery);

  // Effect to fetch data once when filters are applied
  useEffect(() => {
    if (!firestore || !isAdmin) {
      if (isAnyFilterActive) {
        setFetchedOrders(null);
      }
      return;
    }
  
    const fetchFilteredData = async () => {
      if (!isAnyFilterActive) {
          if (fetchedOrders) setFetchedOrders(null); // Clear fetched data if filters are cleared
          return;
      }

      setIsFetching(true);
      let q = query(collection(firestore, 'orders'));
  
      // Prioritize date range filter on Firestore if it exists as it is most selective
      if (filters.dateRange?.from) {
          q = query(q, where('createdAt', '>=', Timestamp.fromDate(filters.dateRange.from)));
           if (filters.dateRange.to) {
              q = query(q, where('createdAt', '<=', Timestamp.fromDate(filters.dateRange.to)));
          }
      }
  
      try {
        const querySnapshot = await getDocs(q);
        let orders = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
  
        // Apply the status filter on the client-side if it exists
        if (filters.status) {
          orders = orders.filter(order => order.status === filters.status);
        }

        // Always sort on the client-side to avoid needing composite indexes for sorting
        orders.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
  
        setFetchedOrders(orders);
      } catch (e) {
        console.error("Failed to fetch filtered orders:", e);
        setFetchedOrders([]);
        toast({
          variant: 'destructive',
          title: "Filter Error",
          description: "Could not fetch orders with the current combination. A composite index might be required."
        })
      } finally {
        setIsFetching(false);
      }
    };
    
    fetchFilteredData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.dateRange, firestore, isAdmin, toast]);


  // Determine which data source to use (live or fetched)
  const sourceOrders = useMemo(() => {
    return isAnyFilterActive ? fetchedOrders : liveOrders;
  }, [isAnyFilterActive, fetchedOrders, liveOrders]);

  // Apply client-side search to the currently active data source
  const finalOrders = useMemo(() => {
    if (!sourceOrders) return null;
    if (!filters.searchQuery) return sourceOrders;

    const lowerCaseQuery = filters.searchQuery.toLowerCase().trim();
    if (!lowerCaseQuery) return sourceOrders;

    return sourceOrders.filter((order, index) => {
        // First, check text fields
        const matchesTextFields = (
            (order.id?.toLowerCase() ?? '').includes(lowerCaseQuery) ||
            (order.name?.toLowerCase() ?? '').includes(lowerCaseQuery) ||
            (order.email?.toLowerCase() ?? '').includes(lowerCaseQuery) ||
            (order.phone?.toLowerCase() ?? '').includes(lowerCaseQuery) ||
            (order.street?.toLowerCase() ?? '').includes(lowerCaseQuery) ||
            (order.city?.toLowerCase() ?? '').includes(lowerCaseQuery) ||
            (order.zip?.toLowerCase() ?? '').includes(lowerCaseQuery) ||
            (order.country?.toLowerCase() ?? '').includes(lowerCaseQuery) ||
            (order.status?.toLowerCase() ?? '').includes(lowerCaseQuery)
        );
        
        if (matchesTextFields) return true;

        // Second, check item fields
        const matchesItems = order.items.some(item => 
            (item.name?.toLowerCase() ?? '').includes(lowerCaseQuery) ||
            (item.productId?.toLowerCase() ?? '').includes(lowerCaseQuery)
        );
        
        if (matchesItems) return true;

        // Third, check for a numeric match against the order's visual index
        const numericQuery = parseInt(lowerCaseQuery.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(numericQuery)) {
            const orderNumber = index + 1; // The visual order number is index + 1
            if (orderNumber === numericQuery) {
                return true;
            }
        }
        
        // If none of the above matched, exclude the order
        return false;
    });
  }, [sourceOrders, filters.searchQuery]);


  // Effect to fetch product images for the current set of final orders
  useEffect(() => {
    if (!firestore || !finalOrders || finalOrders.length === 0) {
      return;
    }

    const fetchProductImages = async () => {
        const productIdsToFetch = [
          ...new Set(
            finalOrders
              .map(order => order.items?.[0]?.productId)
              .filter((id): id is string => !!id && !productImages.hasOwnProperty(id))
          ),
        ];

        if (productIdsToFetch.length === 0) return;

        setProductImages(prev => {
            const newPlaceholders: Record<string, undefined> = {};
            productIdsToFetch.forEach(id => newPlaceholders[id] = undefined);
            return {...prev, ...newPlaceholders};
        });

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
        
        // For any IDs that were fetched but not found in the DB (e.g., deleted products)
        productIdsToFetch.forEach(id => {
            if (!newImageMap.hasOwnProperty(id)) {
                newImageMap[id] = null; // Mark as fetched but not found
            }
        });

        setProductImages(prev => ({...prev, ...newImageMap}));
    };

    fetchProductImages();
  }, [finalOrders, firestore, productImages]);


  const isLoading = isAuthLoading || (isAdmin && (isRealtimeLoading && !isAnyFilterActive) || isFetching);
  const error = realtimeError; // Only show errors from the real-time listener

  const selectedOrders = useMemo(() => {
    if (!finalOrders) return [];
    return finalOrders.filter(order => selectedOrderIds.includes(order.id));
  }, [finalOrders, selectedOrderIds]);

  const handleSelectionChange = (orderId: string, isSelected: boolean) => {
    setSelectedOrderIds(prev => 
      isSelected ? [...prev, orderId] : prev.filter(id => id !== orderId)
    );
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected && finalOrders) {
      setSelectedOrderIds(finalOrders.map(o => o.id));
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
        setSelectedOrderIds([]);
    } catch(error) {
        console.error("Bulk status update failed:", error);
        toast({
            variant: "destructive",
            title: "Bulk Update Failed",
            description: "Could not update order statuses. Check permissions."
        });
        // Note: No need to throw here, toast provides user feedback.
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
        // Note: No need to throw here, toast provides user feedback.
    } finally {
        setIsBulkActionLoading(false);
    }
  };

  const handleExportSelected = () => {
    if (selectedOrders.length > 0) {
      setOrdersToExport(selectedOrders);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Orders</h1>
         {finalOrders && finalOrders.length > 0 && (
            <OrderPDFGenerator orders={finalOrders} isLoading={isLoading} />
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
            onExport={handleExportSelected}
            isExporting={isExportingSelected}
          />
      )}
      
      {ordersToExport.length > 0 && (
        <OrderPDFGenerator 
          orders={ordersToExport} 
          variant="selected"
          onGenerationStart={() => setIsExportingSelected(true)}
          onGenerationEnd={() => {
            setOrdersToExport([]);
            setIsExportingSelected(false);
            setSelectedOrderIds([]);
          }}
        />
      )}


      {error && !isLoading && (
         <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Permission Denied</AlertTitle>
            <AlertDescription>
                You do not have permission to view orders. Please contact your administrator.
            </AlertDescription>
        </Alert>
      )}

      <OrderTable 
        orders={finalOrders} 
        isLoading={isLoading} 
        selectedOrderIds={selectedOrderIds}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
        productImages={productImages}
      />
    </div>
  );
}

    