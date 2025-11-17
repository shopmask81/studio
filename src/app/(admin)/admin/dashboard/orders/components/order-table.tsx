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
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';

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
  selectedOrderIds: string[];
  productImages: Record<string, string | null | undefined>;
  onSelectionChange: (orderId: string, isSelected: boolean) => void;
  onSelectAll: (isSelected: boolean) => void;
}

export function OrderTable({ 
  orders, 
  isLoading, 
  selectedOrderIds,
  productImages,
  onSelectionChange, 
  onSelectAll 
}: OrderTableProps) {
  const allOnPageSelected = orders ? selectedOrderIds.length === orders.length && orders.length > 0 : false;
  const isIndeterminate = orders ? selectedOrderIds.length > 0 && !allOnPageSelected : false;


  if (isLoading) {
    return (
        <div className="border rounded-lg p-4 space-y-2">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-2">
                    <Skeleton className="h-5 w-5 rounded-sm" />
                    <Skeleton className="h-10 w-10 rounded-md" />
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
            <TableHead className="w-12">
                <Checkbox 
                  checked={allOnPageSelected}
                  onCheckedChange={(checked) => onSelectAll(!!checked)}
                  aria-label="Select all orders on this page"
                />
            </TableHead>
            <TableHead className="min-w-[200px]">Order</TableHead>
            <TableHead className="min-w-[150px]">Customer</TableHead>
            <TableHead className="hidden lg:table-cell min-w-[200px]">Email</TableHead>
            <TableHead className="w-[100px] text-right">Total</TableHead>
            <TableHead className="w-[120px] text-center">Status</TableHead>
            <TableHead className="hidden md:table-cell w-[150px]">Date</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const firstItemId = order.items?.[0]?.productId;
            const imageUrl = firstItemId ? productImages[firstItemId] : undefined;
            const isImageLoading = firstItemId && productImages.hasOwnProperty(firstItemId) && imageUrl === undefined;
            
            return (
              <TableRow key={order.id} data-state={selectedOrderIds.includes(order.id) && 'selected'}>
                <TableCell>
                    <Checkbox 
                      checked={selectedOrderIds.includes(order.id)}
                      onCheckedChange={(checked) => onSelectionChange(order.id, !!checked)}
                      aria-label={`Select order ${order.id}`}
                    />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {isImageLoading ? (
                          <Skeleton className="h-12 w-12 rounded-md" />
                      ) : (
                          <Image
                              alt={order.items[0]?.name || 'Product Image'}
                              className="aspect-square rounded-md object-cover"
                              height="50"
                              src={imageUrl || 'https://placehold.co/50x50'}
                              width="50"
                          />
                      )}
                      <span className="font-mono text-xs text-muted-foreground truncate">{order.id}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium truncate">{order.name}</TableCell>
                <TableCell className="hidden lg:table-cell font-medium text-muted-foreground truncate">{order.email}</TableCell>
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
            )
          })}
        </TableBody>
      </Table>
    </div>
  );
}
