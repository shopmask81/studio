
'use client';

import {
  Firestore,
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { Product } from '@/lib/types';

/**
 * Fetches all products, transforms them, and saves them to a single
 * cache document in Firestore. This operation runs entirely on the client.
 * @param firestore The Firestore database instance.
 * @returns The number of products that were cached.
 */
export async function updateProductCache(
  firestore: Firestore
): Promise<number> {
  // 1. Fetch all products from the 'products' collection
  const productsCollectionRef = collection(firestore, 'products');
  const productSnapshot = await getDocs(productsCollectionRef);
  const allProducts = productSnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as Product)
  );

  // 2. Convert each product to a clean JSON object for caching
  const productsForCache = allProducts.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    name_ar: product.name_ar,
    description_ar: product.description_ar,
    price: product.price,
    discountPrice: product.discountPrice ?? null,
    shippingPrice: product.shippingPrice ?? 0,
    category: product.category,
    featured: product.featured ?? false,
    active: product.active ?? true,
    sku: product.sku ?? null,
    mainImage: product.mainImage,
    images: product.images ?? [],
    variantsEnabled: product.variantsEnabled ?? false,
    variantOptions: product.variantOptions ?? { colors: [], sizes: [] },
    variants: product.variants ?? [],
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }));

  // 3. Get a reference to the target cache document
  const cacheDocRef = doc(firestore, 'cachedData', 'allProducts');

  // 4. Save the data, overwriting any existing content
  await setDoc(cacheDocRef, {
    products: productsForCache,
    updatedAt: serverTimestamp(),
  });

  return productsForCache.length;
}
