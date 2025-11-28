
'use client';

import { ProductForm } from "../components/product-form";
import { useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { addProduct } from "../services/product-service";
import { updateProductCache } from "../cache-service";
import { useState } from "react";

export default function AddProductPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddProduct = async (productData: any, uploadedImages: any, mainImageIndex: number | null) => {
    if (!firestore) return;
    setIsSubmitting(true);
    try {
      await addProduct(firestore, productData, uploadedImages, mainImageIndex);
      toast({ title: 'Product Created', description: 'The new product has been added.' });
      
      toast({ title: 'Refreshing Cache...', description: 'Please wait while the product cache is updated.' });
      await updateProductCache(firestore);
      toast({ title: 'Cache Refreshed', description: 'The product cache is now up to date.' });

      router.push('/admin/dashboard/products');
      router.refresh(); // Ensures the page using the cache re-fetches
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Save Failed', description: error.message || 'An unexpected error occurred.' });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Add New Product</h1>
      <ProductForm 
        onSubmit={handleAddProduct} 
        isSubmitting={isSubmitting} 
      />
    </div>
  );
}
