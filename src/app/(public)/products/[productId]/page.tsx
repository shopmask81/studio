
'use client';

import { useParams } from 'next/navigation';
import { ProductDetails } from '@/components/products/product-details';

export default function ProductPage() {
  const params = useParams();
  const productId = params.productId as string;

  return <ProductDetails productId={productId} />;
}
