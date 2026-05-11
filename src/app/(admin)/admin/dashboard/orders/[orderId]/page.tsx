'use client';

import { useMemo, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore } from '@/firebase';
import { doc, collection, query, where, getDocs } from 'firebase/firestore';
import type { Order, Product } from '@/lib/types';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { OrderDetailsCard } from './components/order-details-card';
import { OrderItemsCard } from './components/order-items-card';
import { OrderStatusCard } from './components/order-status-card';
import { AffiliateReferralCard } from './components/affiliate-referral-card';


export default function OrderDetailsPage() {
    const params = useParams();
    const orderId = params.orderId as string;
    const firestore = useFirestore();

    const orderRef = useMemo(() => {
        if (!firestore || !orderId) return null;
        return doc(firestore, 'orders', orderId);
    }, [firestore, orderId]);

    const { data: order, isLoading, error } = useDoc<Order>(orderRef);
    
    // State to cache product image URLs
    const [productImages, setProductImages] = useState<Record<string, string | null | undefined>>({});

    // Effect to fetch all product images for the items in the order
    useEffect(() => {
        if (!firestore || !order || order.items.length === 0) {
            return;
        }

        const fetchProductImages = async () => {
            const productIdsToFetch = [
                ...new Set(order.items.map(item => item.productId))
            ];

            if (productIdsToFetch.length === 0) return;

            // Set initial loading state for all product IDs in this order
            setProductImages(prev => {
                const newPlaceholders = Object.fromEntries(
                    productIdsToFetch.map(id => [id, prev[id] === undefined ? undefined : prev[id]])
                );
                return {...prev, ...newPlaceholders};
            });

            const newImageMap: Record<string, string | null> = {};
            // Firestore 'in' query supports up to 30 elements in the array
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
            
            // For any IDs that were fetched but not found in the DB (e.g., deleted products)
            productIdsToFetch.forEach(id => {
                if (!newImageMap.hasOwnProperty(id)) {
                    newImageMap[id] = null; // Mark as fetched but not found
                }
            });

            setProductImages(prev => ({...prev, ...newImageMap}));
        };

        fetchProductImages();
    }, [order, firestore]);


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <h1 className="text-3xl font-headline mb-2">Order Not Found</h1>
                <p className="text-muted-foreground mb-6">
                    We could not find an order with the ID <span className="font-mono text-foreground bg-muted p-1 rounded-sm">{orderId}</span>.
                </p>
                <Button asChild>
                    <Link href="/admin/dashboard/orders">Back to Orders</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Order Details</h1>
                    <p className="text-muted-foreground font-mono text-sm">{order.id}</p>
                </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                     <OrderItemsCard items={order.items} total={order.total} productImages={productImages} />
                </div>
                <div className="md:col-span-1 space-y-6">
                    <OrderStatusCard order={order} />
                    <AffiliateReferralCard order={order} />
                    <OrderDetailsCard order={order} />
                </div>
            </div>
        </div>
    );
}
