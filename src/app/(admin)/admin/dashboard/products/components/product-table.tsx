
'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { MoreHorizontal, Edit, Trash2, Loader2, Save, GripVertical } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { updateProductCache } from '../cache-service';
import { useCurrency } from '@/components/currency/currency-provider';
import { updateAllProductSortOrders } from '../services/product-service';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

function DndProductTable({
    products,
    onDelete,
    onSaveOrder,
    onOrderChange,
    isSaving,
}: {
    products: Product[];
    onDelete: (productId: string) => void;
    onSaveOrder: () => void;
    onOrderChange: (reorderedProducts: Product[]) => void;
    isSaving: boolean;
}) {
    const { toast } = useToast();
    const { formatPrice } = useCurrency();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(products);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update the sortOrder based on the new index
        const updatedItems = items.map((item, index) => ({
            ...item,
            sortOrder: index,
        }));
        onOrderChange(updatedItems);
    };
    
    const handleDelete = async (productId: string) => {
      setIsDeleting(productId);
      try {
        await onDelete(productId);
      } finally {
        setIsDeleting(null);
      }
    };
    
    const truncateName = (name: string, maxLength = 50) => {
        if (name.length <= maxLength) return name;
        return `${name.substring(0, maxLength)}...`;
    };
    
    return (
        <div className="border rounded-lg overflow-hidden relative">
            {isSaving && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-12"></TableHead>
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
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="products">
                        {(provided) => (
                             <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                                {products.map((product, index) => (
                                     <Draggable key={product.id} draggableId={product.id} index={index}>
                                        {(provided) => (
                                            <TableRow ref={provided.innerRef} {...provided.draggableProps}>
                                                <TableCell className="text-center px-2 cursor-grab" {...provided.dragHandleProps}>
                                                    <GripVertical className="h-5 w-5 text-muted-foreground"/>
                                                </TableCell>
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
                                                    {product.price ? formatPrice(product.price) : 'N/A'}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">{product.stock}</TableCell>
                                                <TableCell>
                                                    <Badge variant={product.active ? 'default' : 'outline'}>
                                                        {product.active ? 'Active' : 'Draft'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={product.featured ? 'secondary' : 'outline'}>
                                                        {product.featured ? 'Yes' : 'No'}
                                                    </Badge>
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
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </TableBody>
                        )}
                    </Droppable>
                </DragDropContext>
            </Table>
        </div>
    );
}

export function ProductTable() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const cachedProductsRef = useMemo(() => {
    if (!firestore) return null;
    return doc(firestore, 'cachedData', 'allProducts');
  }, [firestore]);

  const { data: cachedData, isLoading } = useDoc<{ products: Product[] }>(cachedProductsRef);

  const originalProducts = useMemo(() => cachedData?.products || [], [cachedData]);

  const [editableProducts, setEditableProducts] = useState<Product[]>([]);
  const [isOrderChanged, setIsOrderChanged] = useState(false);
  
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const sortedProducts = [...originalProducts].sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity));
    setEditableProducts(sortedProducts);
    setIsOrderChanged(false); 
  }, [originalProducts]);

  const handleOrderChange = (reorderedProducts: Product[]) => {
      setEditableProducts(reorderedProducts);
      setIsOrderChanged(true);
  };
  
  const handleSaveOrder = async () => {
    if (!firestore) return;
    setIsSavingOrder(true);
    
    const productsToUpdate = editableProducts.map(p => ({ id: p.id, sortOrder: p.sortOrder! }));

    try {
      await updateAllProductSortOrders(firestore, productsToUpdate);
      toast({ title: 'Product Order Saved', description: 'The new display order has been saved.' });
      
      await updateProductCache(firestore);
      setIsOrderChanged(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!firestore) return;
    await deleteDoc(doc(firestore, 'products', productId));
    toast({
      title: 'Product Deleted',
      description: 'The product has been removed.',
    });
    await updateProductCache(firestore);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>;
  }

  if (editableProducts.length === 0) {
      return (
          <div className="text-center p-8 text-muted-foreground border rounded-lg">
              No products found. Add a new product or refresh the cache.
          </div>
      );
  }

  return (
    <div className="space-y-4">
      {isOrderChanged && (
        <div className="sticky top-16 z-10 bg-card border rounded-lg p-3 flex items-center justify-between shadow-md">
          <p className="text-sm font-medium">You have unsaved changes to the display order.</p>
          <Button onClick={handleSaveOrder} disabled={isSavingOrder}>
            {isSavingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Order
          </Button>
        </div>
      )}
      {isClient ? (
          <DndProductTable 
            products={editableProducts}
            onDelete={handleDeleteProduct}
            onSaveOrder={handleSaveOrder}
            onOrderChange={handleOrderChange}
            isSaving={isSavingOrder}
          />
      ) : (
           <div className="border rounded-lg overflow-hidden">
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Name</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {editableProducts.map(p => <TableRow key={p.id}><TableCell>{p.name}</TableCell></TableRow>)}
                </TableBody>
             </Table>
           </div>
      )}
    </div>
  );
}
