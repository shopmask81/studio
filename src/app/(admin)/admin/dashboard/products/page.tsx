
'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { PlusCircle, RefreshCw, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ProductTable } from './components/product-table';
import { updateProductCache } from './cache-service';
import { useRouter } from 'next/navigation';

export default function AdminProductsPage() {
  const [isCaching, setIsCaching] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const handleCacheRefresh = async () => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Firestore not available',
      });
      return;
    }

    setIsCaching(true);
    try {
      const productCount = await updateProductCache(firestore);
      toast({
        title: 'Product Cache Refreshed',
        description: `${productCount} products have been successfully cached.`,
      });
      // Force a re-render of the table component by navigating
      router.refresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Cache Refresh Failed',
        description:
          error.message || 'An unexpected error occurred. Check the console.',
      });
    } finally {
      setIsCaching(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Products</h1>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleCacheRefresh}
            disabled={isCaching}
            variant="outline"
          >
            {isCaching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {isCaching ? 'Refreshing...' : 'Refresh Cache'}
          </Button>
          <Button asChild>
            <Link href="/admin/dashboard/products/add">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Product
            </Link>
          </Button>
        </div>
      </div>
      <ProductTable />
    </div>
  );
}
