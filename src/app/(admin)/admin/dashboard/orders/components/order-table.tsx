
'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';

import { MoreHorizontal, PackageCheck, PackageSearch, Rocket, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const statusStyles: { [key: string]: string } = {
    pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
    processing: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
    shipped: 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30',
    delivered: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
    cancelled: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
};

const statusIcons: { [key: string]: React.ReactNode } = {
    pending: <PackageSearch className="mr-2 h-4 w-4" />,
    processing: <Rocket className="mr-2 h-4 w-4" />,
    shipped: <PackageCheck className="mr-2 h-4 w-4" />,
    delivered: <CheckCircle className="mr-2 h-4 w-4" />,
    cancelled: <XCircle className="mr-2 h-4 w-4" />,
};

const orderStatuses: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export function OrderTable() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const ordersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

  const handleStatusUpdate = async (orderId: string, status: Order['status']) => {
    if (!firestore) return;

    const orderRef = doc(firestore, 'orders', orderId);
    const dataToUpdate = { status };

    try {
        await updateDoc(orderRef, dataToUpdate);
        toast({
            title: 'Order Status Updated',
            description: `Order ${orderId.slice(0,6)}... marked as ${status}.`,
        });
    } catch (error) {
        console.error("Error updating order status:", error);
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
    }
  };

  if (isLoading) {
    return <div>Loading orders...</div>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="hidden md:table-cell">Date</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders?.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {order.id}
              </TableCell>
              <TableCell className="font-medium">{order.name}</TableCell>
              <TableCell className="hidden md:table-cell">
                {order.createdAt ? format(order.createdAt.toDate(), 'PPP') : 'N/A'}
              </TableCell>
              <TableCell className="text-right font-medium">
                ${order.total.toFixed(2)}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className={cn("capitalize border", statusStyles[order.status])}>
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Update Status</DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    {orderStatuses.map(status => (
                                        <DropdownMenuItem
                                            key={status}
                                            onClick={() => handleStatusUpdate(order.id, status)}
                                            disabled={order.status === status}
                                        >
                                            {statusIcons[status]}
                                            <span className="capitalize">{status}</span>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                        {/* <DropdownMenuItem>View Details</DropdownMenuItem> */}
                    </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
       {orders && orders.length === 0 && (
          <div className="text-center p-8 text-muted-foreground">
              No orders found.
          </div>
      )}
    </div>
  );
}
