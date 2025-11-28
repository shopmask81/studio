
'use client';

import { useParams, useRouter } from "next/navigation";
import { useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Product } from "@/lib/types";
import { useMemo, useState } from "react";
import { ProductForm } from "../../components/product-form";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateProduct } from "../../services/product-service";
import { updateProductCache } from "../../cache-service";

export default function EditProductPage() {
  const params = useParams();
  const productId = params.productId as string;
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const productRef = useMemo(() => {
    if (!firestore || !productId) return null;
    return doc(firestore, 'products', productId);
  }, [firestore, productId]);

  const { data: product, isLoading } = useDoc<Product>(productRef);

  const handleUpdateProduct = async (productData: any, uploadedImages: any, mainImageIndex: number | null) => {
    if (!firestore || !product) return;
    setIsSubmitting(true);
    try {
      await updateProduct(firestore, product.id, productData, uploadedImages, mainImageIndex);
      toast({ title: 'Product Updated', description: 'The product has been successfully updated.' });

      toast({ title: 'Refreshing Cache...', description: 'Please wait while the product cache is updated.' });
      await updateProductCache(firestore);
      toast({ title: 'Cache Refreshed', description: 'The product cache is now up to date.' });
      
      router.push('/admin/dashboard/products');
      router.refresh();
    } catch (error: any) {
       toast({ variant: 'destructive', title: 'Update Failed', description: error.message || 'An unexpected error occurred.' });
    } finally {
        setIsSubmitting(false);
    }
  }


  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin"/></div>;
  }

  if (!product) {
    return <div>Product not found.</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Edit Product</h1>
      <ProductForm 
        productToEdit={product}
        onSubmit={handleUpdateProduct}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
