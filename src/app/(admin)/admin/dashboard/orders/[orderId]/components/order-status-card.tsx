
'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface OrderStatusCardProps {
    order: Order;
}

const orderStatuses: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const statusStyles: { [key: string]: string } = {
    pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
    processing: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
    shipped: 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
    delivered: 'bg-green-500/20 text-green-700 dark:text-green-400',
    cancelled: 'bg-red-500/20 text-red-700 dark:text-red-400',
};

export function OrderStatusCard({ order }: OrderStatusCardProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [currentStatus, setCurrentStatus] = useState<Order['status']>(order.status);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStatusUpdate = async () => {
        if (!firestore || currentStatus === order.status) return;

        setIsUpdating(true);
        const orderRef = doc(firestore, 'orders', order.id);
        const dataToUpdate = { status: currentStatus };

        try {
            await updateDoc(orderRef, dataToUpdate);
            toast({
                title: 'Order Status Updated',
                description: `Order has been marked as ${currentStatus}.`,
            });
        } catch (error) {
            console.error("Error updating order status:", error);
            setCurrentStatus(order.status); // Revert on failure
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update order status.',
            });
            const permissionError = new FirestorePermissionError({
              path: orderRef.path,
              operation: 'update',
              requestResourceData: dataToUpdate,
            });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setIsUpdating(false);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Order Status</CardTitle>
                <CardDescription>View and update the order status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Select value={currentStatus} onValueChange={(v) => setCurrentStatus(v as Order['status'])}>
                    <SelectTrigger className={cn("capitalize h-11 text-base", statusStyles[currentStatus])}>
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        {orderStatuses.map(status => (
                            <SelectItem key={status} value={status} className="capitalize">
                                {status}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button 
                    onClick={handleStatusUpdate} 
                    disabled={isUpdating || currentStatus === order.status}
                    className="w-full"
                >
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Status
                </Button>
            </CardContent>
        </Card>
    );
}
