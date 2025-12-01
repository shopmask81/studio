'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { OrderTable } from "./components/order-table";
import { OrderFilters, type Filters } from './components/order-filters';
import { useFirestore, useDoc } from '@/firebase';
import { writeBatch, doc, getDocs, collection, query, orderBy, where } from 'firebase/firestore';
import type { Order, Product } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Loader2, RefreshCw } from 'lucide-react';
import { BulkActionsBar } from './components/bulk-actions-bar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/auth-provider';
import { OrderPDFGenerator } from './components/order-pdf-generator';
import { updateOrderCache } from './services/order-service';
import { Button } from '@/components/ui/button';

export default function AdminOrdersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [filters, setFilters] = useState<Filters>({});
  const { userProfile, isLoading: isAuthLoading } = useAuth();
  
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  const [isCaching, setIsCaching] = useState(false);
  const [ordersToExport, setOrdersToExport] = useState<Order[]>([]);
  const [isExportingSelected, setIsExportingSelected] = useState(false);

  const [productImages, setProductImages] = useState<Record<string, string | null | undefined>>({});

  const isAdmin = userProfile?.role === 'admin';

  // Listen to the cached document instead of the whole collection
  const cachedOrdersRef = useMemo(() => {
    if (!firestore || !isAdmin || isAuthLoading) return null;
    return doc(firestore, 'cachedData', 'allOrders');
  }, [firestore, isAdmin, isAuthLoading]);

  const { data: cachedData, isLoading: isCacheLoading, error: cacheError } = useDoc<{ orders: Order[] }>(cachedOrdersRef);
  
  const allOrders = useMemo(() => {
    if (!cachedData?.orders) return [];
    // Firestore Timestamps need to be converted back to Date objects for filtering
    return cachedData.orders.map(order => ({
      ...order,
      createdAt: order.createdAt ? (order.createdAt as any)?.toDate ? (order.createdAt as any).toDate() : new Date(order.createdAt as any) : new Date(),
    }));
  }, [cachedData]);
  
  // This is the core filtering logic, now simplified and robust.
  const filteredOrders = useMemo(() => {
    if (!allOrders) return null;

    let orders = [...allOrders];

    if (filters.status) {
      orders = orders.filter(order => order.status === filters.status);
    }
    
    if (filters.dateRange?.from) {
        orders = orders.filter(order => {
            if (!order.createdAt) return false;
            const orderDate = order.createdAt; // Already a Date object
            if (filters.dateRange?.to) {
                return orderDate >= filters.dateRange.from && orderDate <= filters.dateRange.to;
            }
            return orderDate >= filters.dateRange.from;
        });
    }

    const searchQuery = filters.searchQuery?.toLowerCase().trim();
    if (searchQuery) {
        orders = orders.filter((order, index) => {
            const numericQuery = searchQuery.replace(/[^0-9]/g, '');
            const orderNumberMatch = numericQuery && parseInt(numericQuery, 10) === index + 1;
            if (orderNumberMatch) return true;
            
            const check = (field: any) => String(field ?? '').toLowerCase().includes(searchQuery);

            return check(order.id) ||
                   check(order.name) ||
                   check(order.email) ||
                   check(order.phone) ||
                   check(order.street) ||
                   check(order.city) ||
                   check(order.zip) ||
                   check(order.country) ||
                   check(order.status) ||
                   order.items?.some(item => check(item.name) || check(item.productId));
        });
    }
    
    return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [allOrders, filters]);


  useEffect(() => {
    if (!firestore || !filteredOrders || filteredOrders.length === 0) return;

    const fetchProductImages = async () => {
        const productIdsToFetch = [...new Set(
            filteredOrders.flatMap(order => order.items?.map(item => item.productId) || [])
                         .filter(id => !!id && !productImages.hasOwnProperty(id))
        )];

        if (productIdsToFetch.length === 0) return;

        setProductImages(prev => ({...prev, ...Object.fromEntries(productIdsToFetch.map(id => [id, undefined]))}));

        const newImageMap: Record<string, string | null> = {};
        const productChunks = [];
        for (let i = 0; i < productIdsToFetch.length; i += 30) {
          productChunks.push(productIdsToFetch.slice(i, i + 30));
        }

        for (const chunk of productChunks) {
            if (chunk.length === 0) continue;
            const productsRef = collection(firestore, 'products');
            const q = query(productsRef, where('__name__', 'in', chunk));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(doc => {
              const product = doc.data() as Product;
              newImageMap[doc.id] = product.mainImage || product.images?.[0] || null;
            });
        }
        
        productIdsToFetch.forEach(id => {
            if (!newImageMap.hasOwnProperty(id)) newImageMap[id] = null;
        });

        setProductImages(prev => ({...prev, ...newImageMap}));
    };

    fetchProductImages();
  }, [filteredOrders, firestore, productImages]);


  const isLoading = isAuthLoading || isCacheLoading;
  const error = cacheError;

  const selectedOrders = useMemo(() => {
    if (!filteredOrders) return [];
    return filteredOrders.filter(order => selectedOrderIds.includes(order.id));
  }, [filteredOrders, selectedOrderIds]);

  const handleSelectionChange = (orderId: string, isSelected: boolean) => {
    setSelectedOrderIds(prev => isSelected ? [...prev, orderId] : prev.filter(id => id !== orderId));
  };

  const handleSelectAll = (isSelected: boolean) => {
    setSelectedOrderIds(isSelected && filteredOrders ? filteredOrders.map(o => o.id) : []);
  };
  
  const handleCacheUpdate = async () => {
    if (!firestore) return;
    setIsCaching(true);
    try {
      const count = await updateOrderCache(firestore);
      toast({ title: 'Order Cache Updated', description: `${count} orders have been cached.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Cache Update Failed', description: error.message });
    } finally {
      setIsCaching(false);
    }
  }

  const handleBulkStatusChange = async (status: Order['status']) => {
    if (!firestore || selectedOrderIds.length === 0) return;
    setIsBulkActionLoading(true);
    
    const batch = writeBatch(firestore);
    selectedOrderIds.forEach(orderId => batch.update(doc(firestore, 'orders', orderId), { status }));

    try {
        await batch.commit();
        await updateOrderCache(firestore); // Refresh cache
        toast({ title: "Bulk Update Successful", description: `${selectedOrderIds.length} orders updated.` });
        setSelectedOrderIds([]);
    } catch(error) {
        console.error("Bulk status update failed:", error);
        toast({ variant: "destructive", title: "Bulk Update Failed", description: "Could not update order statuses." });
    } finally {
        setIsBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!firestore || selectedOrderIds.length === 0) return;
    setIsBulkActionLoading(true);

    const batch = writeBatch(firestore);
    selectedOrderIds.forEach(orderId => batch.delete(doc(firestore, 'orders', orderId)));

     try {
        await batch.commit();
        await updateOrderCache(firestore); // Refresh cache
        toast({ title: "Bulk Delete Successful", description: `${selectedOrderIds.length} orders deleted.` });
        setSelectedOrderIds([]);
    } catch (error) {
        console.error("Bulk delete failed:", error);
        toast({ variant: "destructive", title: "Bulk Delete Failed", description: "Could not delete orders." });
    } finally {
        setIsBulkActionLoading(false);
    }
  };

  const handleExportSelected = () => {
    if (selectedOrders.length > 0) setOrdersToExport(selectedOrders);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Orders</h1>
         <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCacheUpdate} disabled={isCaching}>
                {isCaching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh Orders Cache
            </Button>
            {filteredOrders && filteredOrders.length > 0 && (
                <OrderPDFGenerator orders={filteredOrders} isLoading={isLoading} />
            )}
        </div>
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
                You do not have permission to view the orders cache. Please contact your administrator.
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
