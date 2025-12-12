
import {
  Firestore,
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

type UploadedImage = {
  id: string;
  url: string;
  deleteUrl: string;
};

export async function addProduct(
    firestore: Firestore,
    productData: Partial<Product>,
    uploadedImages: UploadedImage[],
    mainImageIndex: number | null
): Promise<void> {
    const mainImage = mainImageIndex !== null ? uploadedImages[mainImageIndex].url : '';
    const additionalImages = uploadedImages.filter((_, index) => index !== mainImageIndex).map(img => img.url);

    const dataToCreate = {
        ...productData,
        mainImage,
        images: additionalImages,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const collectionRef = collection(firestore, 'products');

    await addDoc(collectionRef, dataToCreate).catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'products',
            operation: 'create',
            requestResourceData: dataToCreate
        }));
        throw error;
    });
}

export async function updateProduct(
    firestore: Firestore,
    productId: string,
    productData: Partial<Product>,
    uploadedImages: UploadedImage[],
    mainImageIndex: number | null
): Promise<void> {
    const mainImage = mainImageIndex !== null ? uploadedImages[mainImageIndex].url : '';
    const additionalImages = uploadedImages.filter((_, index) => index !== mainImageIndex).map(img => img.url);

    const dataToUpdate = {
        ...productData,
        mainImage,
        images: additionalImages,
        updatedAt: serverTimestamp(),
    };

    const productRef = doc(firestore, 'products', productId);
    await updateDoc(productRef, dataToUpdate).catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `products/${productId}`,
            operation: 'update',
            requestResourceData: dataToUpdate
        }));
        throw error;
    });
}

export async function updateAllProductSortOrders(
  firestore: Firestore,
  productsToUpdate: { id: string; sortOrder: number }[]
): Promise<void> {
  const batch = writeBatch(firestore);

  productsToUpdate.forEach(product => {
    const productRef = doc(firestore, 'products', product.id);
    batch.update(productRef, { sortOrder: product.sortOrder });
  });

  await batch.commit().catch((error) => {
    console.error("Batch update for sort order failed:", error);
    // Emitting a generic error as it involves multiple documents.
    errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'products',
        operation: 'write', // Represents a multi-document write
    }));
    throw new Error('Failed to update product display order. You may not have the required permissions.');
  });
}
