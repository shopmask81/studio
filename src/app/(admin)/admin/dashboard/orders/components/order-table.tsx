
'use client';

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
import { Eye } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const statusStyles: { [key: string]: string } = {
    pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
    processing: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
    shipped: 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30',
    delivered: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
    cancelled: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
};

interface OrderTableProps {
  orders: Order[] | null;
  isLoading: boolean;
}

export function OrderTable({ orders, isLoading }: OrderTableProps) {

  if (isLoading) {
    return (
        <div className="border rounded-lg p-4 space-y-2">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-2">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                </div>
            ))}
        </div>
    );
  }

  if (!orders || orders.length === 0) {
     return (
        <div className="text-center p-8 text-muted-foreground border rounded-lg">
            No orders found matching your criteria.
        </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="hidden md:table-cell">Date</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {order.id}
              </TableCell>
              <TableCell className="font-medium">{order.name}</TableCell>
              <TableCell className="font-medium text-muted-foreground">{order.email}</TableCell>
              <TableCell className="text-right font-medium">
                ${order.total.toFixed(2)}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className={cn("capitalize border text-xs", statusStyles[order.status])}>
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                {order.createdAt ? format(order.createdAt.toDate(), 'PPp') : 'N/A'}
              </TableCell>
              <TableCell>
                <Button asChild variant="outline" size="icon">
                  <Link href={`/admin/dashboard/orders/${order.id}`}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View Details</span>
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
