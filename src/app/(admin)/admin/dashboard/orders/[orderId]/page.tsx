
'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { OrderDetailsCard } from './components/order-details-card';
import { OrderItemsCard } from './components/order-items-card';
import { OrderStatusCard } from './components/order-status-card';


export default function OrderDetailsPage() {
    const params = useParams();
    const orderId = params.orderId as string;
    const firestore = useFirestore();

    const orderRef = useMemo(() => {
        if (!firestore || !orderId) return null;
        return doc(firestore, 'orders', orderId);
    }, [firestore, orderId]);

    const { data: order, isLoading, error } = useDoc<Order>(orderRef);

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
                     <OrderItemsCard items={order.items} total={order.total} />
                </div>
                <div className="md:col-span-1 space-y-6">
                    <OrderStatusCard order={order} />
                    <OrderDetailsCard order={order} />
                </div>
            </div>
        </div>
    );
}
