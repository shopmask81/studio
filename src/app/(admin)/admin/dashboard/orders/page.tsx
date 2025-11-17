
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

  // State to cache product image URLs
  const [productImages, setProductImages] = useState<Record<string, string | null | undefined>>({});

  const isAdmin = userProfile?.role === 'admin';

  // Base query to fetch all orders, sorted by creation date.
  const allOrdersQuery = useMemo(() => {
    if (!firestore || !isAdmin || isAuthLoading) return null;
    return query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
  }, [firestore, isAdmin, isAuthLoading]);

  // The single source of truth for all orders, fetched from Firestore.
  const { data: allOrders, isLoading: isRealtimeLoading, error: realtimeError } = useCollection<Order>(allOrdersQuery);
  
  // This is the core filtering logic, now simplified and robust.
  const filteredOrders = useMemo(() => {
    if (!allOrders) return null;

    // Start with the full list of orders.
    let orders = [...allOrders];

    // Apply status filter
    if (filters.status) {
      orders = orders.filter(order => order.status === filters.status);
    }
    
    // Apply date range filter
    if (filters.dateRange?.from) {
        orders = orders.filter(order => {
            if (!order.createdAt) return false;
            const orderDate = order.createdAt.toDate();
            if (filters.dateRange?.to) {
                return orderDate >= filters.dateRange.from && orderDate <= filters.dateRange.to;
            }
            return orderDate >= filters.dateRange.from;
        });
    }

    // Apply search query filter
    const searchQuery = filters.searchQuery?.toLowerCase().trim();
    if (searchQuery) {
        orders = orders.filter((order, index) => {
            // Check for order number search (e.g., "1", "#1", "order 1")
            const numericQuery = searchQuery.replace(/[^0-9]/g, '');
            if (numericQuery && parseInt(numericQuery, 10) === index + 1) {
                return true;
            }
            
            // Safely stringify and check each field
            const check = (field: any) => String(field ?? '').toLowerCase().includes(searchQuery);

            // Check top-level order fields
            const matchesOrderFields = 
                check(order.id) ||
                check(order.name) ||
                check(order.email) ||
                check(order.phone) ||
                check(order.street) ||
                check(order.city) ||
                check(order.zip) ||
                check(order.country) ||
                check(order.status);
            
            if (matchesOrderFields) return true;

            // Check nested item fields
            const matchesItems = order.items.some(item =>
                check(item.name) ||
                check(item.productId)
            );

            return matchesItems;
        });
    }
    
    return orders;
  }, [allOrders, filters]);


  // Effect to fetch product images for the current set of final orders
  useEffect(() => {
    if (!firestore || !filteredOrders || filteredOrders.length === 0) {
      return;
    }

    const fetchProductImages = async () => {
        const productIdsToFetch = [
          ...new Set(
            filteredOrders
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
  }, [filteredOrders, firestore, productImages]);


  const isLoading = isAuthLoading || isRealtimeLoading;
  const error = realtimeError; // Only show errors from the real-time listener

  const selectedOrders = useMemo(() => {
    if (!filteredOrders) return [];
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
