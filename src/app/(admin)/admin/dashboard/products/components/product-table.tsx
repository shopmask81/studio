'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function ProductTable() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const productsQuery = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);

  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  const handleDelete = async (productId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'products', productId));
      toast({
        title: 'Product Deleted',
        description: 'The product has been successfully removed.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Deleting Product',
        description: 'There was a problem removing the product.',
      });
    }
  };

  const truncateName = (name: string, maxLength = 50) => {
    if (name.length <= maxLength) {
      return name;
    }
    return `${name.substring(0, maxLength)}...`;
  };

  if (isLoading) {
    return <div>Loading products...</div>;
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
            <TableHead className="hidden md:table-cell">Created at</TableHead>
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
                ${product.price.toFixed(2)}
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
                {product.createdAt ? format(product.createdAt.toDate(), 'PPP') : 'N/A'}
              </TableCell>
              <TableCell>
                 <AlertDialog>
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
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
                            <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4"/> Delete
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                    </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this product.
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
