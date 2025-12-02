
import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch,
  getDocs,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import type { Banner } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { getAllBanners } from '@/firebase/queries/getBanners';

type BannerData = Partial<Omit<Banner, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'imageUrl' | 'deleteUrl' | 'active'>>

// This is a simplified upload function. In a real app, you'd use Firebase Storage.
async function uploadImage(imageFile: File): Promise<{ url: string, delete_url: string }> {
  const apiKey = '518d3cdcaedf3c5ade143a41de38c554';
  if (!apiKey) {
    throw new Error('ImgBB API key is not configured.');
  }

  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Image upload failed with status: ${response.status}`);
  }

  const result = await response.json();
  if (!result.data || !result.data.url || !result.data.delete_url) {
    throw new Error('Invalid response from image upload service.');
  }
  
  return { url: result.data.url, delete_url: result.data.delete_url };
}

async function deleteImage(deleteUrl: string) {
    // We use a server-side proxy to avoid exposing the deletion mechanism to the client
    try {
        const response = await fetch('/api/delete-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deleteUrl }),
        });
        if (!response.ok) {
            console.warn(`Failed to delete image from ImgBB via proxy. URL: ${deleteUrl}`);
        }
    } catch (error) {
        console.error('Error in proxy call to delete image:', error);
    }
}


export async function addBanner(
  firestore: Firestore,
  values: BannerData,
  imageFile: File,
  order: number,
): Promise<void> {
  const { url, delete_url } = await uploadImage(imageFile);
  const collectionRef = collection(firestore, 'banners');
  const dataToCreate = {
    ...values,
    imageUrl: url,
    deleteUrl: delete_url,
    active: true,
    order,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  addDoc(collectionRef, dataToCreate)
    .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
        path: collectionRef.path,
        operation: 'create',
        requestResourceData: dataToCreate,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw new Error('You do not have permission to create banners.');
    });
}

export async function updateBanner(
  firestore: Firestore,
  bannerId: string,
  values: Partial<BannerData & { active?: boolean }>,
  newImageFileOrUrl?: File | string,
  oldDeleteUrl?: string
): Promise<void> {
  const bannerRef = doc(firestore, 'banners', bannerId);
  const dataToUpdate: any = { ...values, updatedAt: serverTimestamp() };

  if (newImageFileOrUrl && typeof newImageFileOrUrl !== 'string') {
      const { url, delete_url } = await uploadImage(newImageFileOrUrl);
      dataToUpdate.imageUrl = url;
      dataToUpdate.deleteUrl = delete_url;
      // If a new image is uploaded, delete the old one.
      if (oldDeleteUrl) {
        await deleteImage(oldDeleteUrl);
      }
  }
  
  updateDoc(bannerRef, dataToUpdate)
    .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
        path: bannerRef.path,
        operation: 'update',
        requestResourceData: dataToUpdate,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw new Error('You do not have permission to update banners.');
    });
}

export async function deleteBanner(
  firestore: Firestore,
  banner: Banner
): Promise<void> {
  const bannerRef = doc(firestore, 'banners', banner.id);
  
  // First, optimistically try to delete the image from ImgBB
  if (banner.deleteUrl) {
    await deleteImage(banner.deleteUrl);
  }

  // Then, attempt to delete the Firestore document
  deleteDoc(bannerRef)
    .catch((serverError) => {
      const permissionError = new FirestorePermissionError({
        path: bannerRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
      throw new Error('You do not have permission to delete this banner.');
    });
}

export async function updateBannerOrder(
  firestore: Firestore,
  banners: Banner[]
): Promise<void> {
  const batch = writeBatch(firestore);
  banners.forEach((banner, index) => {
    const bannerRef = doc(firestore, 'banners', banner.id);
    batch.update(bannerRef, { order: index });
  });

  batch.commit()
    .catch((serverError) => {
        // This is a complex operation to represent in a single permission error,
        // so we log it and throw a generic error for the UI.
        console.error("Batch update error:", serverError);
        // A generic error is acceptable here as batch writes are admin-only
        // and harder to represent in a single contextual error.
        throw new Error('Failed to update banner order. You may not have permission for one or more banners.');
    });
}


/**
 * Fetches all banners from the 'banners' collection (admin-only),
 * writes them to the public `cachedData/allBanners` document, and also
 * updates the admin's local storage to trigger immediate updates for all users.
 * @param firestore The Firestore database instance.
 * @returns The number of banners that were cached.
 */
export async function updateBannerCache(firestore: Firestore): Promise<number> {
    try {
        // 1. Fetch all banners from the 'banners' collection using the admin query
        const allBanners = await getAllBanners(firestore);

        // 2. We don't need to transform them if the types are already correct.
        const bannersForCache = allBanners.map(banner => ({
            ...banner,
            // Convert Timestamps to a serializable format for JSON, if they are not already.
            // Firestore SDK handles Timestamps, but direct objects might not.
            createdAt: banner.createdAt instanceof Timestamp ? banner.createdAt.toDate().toISOString() : banner.createdAt,
            updatedAt: banner.updatedAt instanceof Timestamp ? banner.updatedAt.toDate().toISOString() : banner.updatedAt,
        }));
        
        // 3. Get a reference to the target cache document
        const cacheDocRef = doc(firestore, 'cachedData', 'allBanners');

        // 4. Save the data to Firestore, overwriting any existing content
        const dataToSet = {
            banners: bannersForCache,
            updatedAt: serverTimestamp(),
        };

        await setDoc(cacheDocRef, dataToSet);
        
        // 5. Update local storage for real-time updates across tabs/users
        localStorage.setItem('bannersCache', JSON.stringify(bannersForCache));
        localStorage.setItem('bannersCacheTimestamp', Date.now().toString());
        // This item is what other tabs will listen for. Its value triggers the event.
        localStorage.setItem('banners-version', Date.now().toString());


        return bannersForCache.length;
    } catch (error) {
        console.error("Error updating banner cache:", error);
        // This makes the error message available to the calling component's catch block
        throw error; 
    }
}
