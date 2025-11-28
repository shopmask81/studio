
'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useDoc } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import type { Product } from '@/lib/types';
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
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { MoreHorizontal, Edit, Trash2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { updateProductCache } from '../cache-service';

export function ProductTable() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const cachedProductsRef = useMemo(() => {
    if (!firestore) return null;
    return doc(firestore, 'cachedData', 'allProducts');
  }, [firestore]);

  const { data: cachedData, isLoading } = useDoc<{ products: Product[] }>(cachedProductsRef);
  const products = cachedData?.products || [];
  
  const handleDelete = async (productId: string) => {
    if (!firestore) return;
    setIsDeleting(productId);
    try {
      // First, delete the actual product document
      await deleteDoc(doc(firestore, 'products', productId));
      toast({
        title: 'Product Deleted',
        description: 'The product has been removed.',
      });

      // Then, trigger a cache refresh
      toast({
        title: 'Refreshing Cache...',
        description: 'Updating the product cache after deletion.',
      });
      await updateProductCache(firestore);
      toast({
        title: 'Cache Refreshed',
        description: 'The product cache is now up to date.',
      });

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Deleting Product',
        description: 'There was a problem removing the product.',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const truncateName = (name: string, maxLength = 50) => {
    if (name.length <= maxLength) {
      return name;
    }
    return `${name.substring(0, maxLength)}...`;
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>;
  }

  if (!products || products.length === 0) {
      return (
          <div className="text-center p-8 text-muted-foreground border rounded-lg">
              No products found in the cache. Try refreshing the cache.
          </div>
      );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="hidden md:table-cell">Price</TableHead>
            <TableHead className="hidden md:table-cell">Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Featured</TableHead>
            <TableHead className="hidden md:table-cell">Last Updated</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products?.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                   <Image
                    alt={product.name}
                    className="aspect-square rounded-md object-cover"
                    height="40"
                    src={product.mainImage || 'https://placehold.co/40x40'}
                    width="40"
                  />
                  <span>{truncateName(product.name)}</span>
                </div>
              </TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell className="hidden md:table-cell">
                ${product.price ? product.price.toFixed(2) : 'N/A'}
              </TableCell>
              <TableCell className="hidden md:table-cell">{product.stock}</TableCell>
              <TableCell>
                <Badge variant={product.active ? 'default' : 'outline'}>
                  {product.active ? 'Active' : 'Draft'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className={cn(
                  "rounded px-2 py-1 text-xs text-center w-fit",
                  product.featured 
                    ? "bg-green-600/20 text-green-500" 
                    : "bg-gray-600/20 text-gray-400"
                )}>
                  {product.featured ? 'Yes' : 'No'}
                </div>
              </TableCell>
               <TableCell className="hidden md:table-cell">
                {product.updatedAt ? format(product.updatedAt.toDate(), 'PPP') : 'N/A'}
              </TableCell>
              <TableCell>
                 <AlertDialog>
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isDeleting === product.id}>
                          {isDeleting === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href={`/admin/dashboard/products/${product.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4"/> Edit
                            </Link>
                        </DropdownMenuItem>
                         <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="mr-2 h-4 w-4"/> Delete
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                    </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this product and refresh the cache.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(product.id)}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
