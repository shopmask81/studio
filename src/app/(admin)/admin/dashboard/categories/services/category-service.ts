
import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
  setDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import type { Category } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with a single one
}

export async function addCategory(
  firestore: Firestore,
  name: string,
  existingCategories: Category[]
): Promise<void> {
  const name_lowercase = name.toLowerCase();

  // Check for duplicates
  if (existingCategories.some((cat) => cat.name_lowercase === name_lowercase)) {
    throw new Error(`Category "${name}" already exists.`);
  }

  const slug = generateSlug(name);
  const collectionRef = collection(firestore, 'categories');
  const dataToCreate = {
    name,
    name_lowercase,
    slug,
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
        throw new Error('You do not have permission to create categories.');
    });
}

export async function updateCategory(
  firestore: Firestore,
  categoryId: string,
  newName: string,
  existingCategories: Category[]
): Promise<void> {
  const new_name_lowercase = newName.toLowerCase();

  // Check for duplicates, excluding the category being edited
  if (
    existingCategories.some(
      (cat) => cat.id !== categoryId && cat.name_lowercase === new_name_lowercase
    )
  ) {
    throw new Error(`Another category with the name "${newName}" already exists.`);
  }

  const categoryRef = doc(firestore, 'categories', categoryId);
  const newSlug = generateSlug(newName);
  const dataToUpdate = {
    name: newName,
    name_lowercase: new_name_lowercase,
    slug: newSlug,
    updatedAt: serverTimestamp(),
  };

  updateDoc(categoryRef, dataToUpdate)
    .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
        path: categoryRef.path,
        operation: 'update',
        requestResourceData: dataToUpdate,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw new Error('You do not have permission to update categories.');
    });
}

export async function deleteCategory(
  firestore: Firestore,
  categoryId: string
): Promise<void> {
  const categoryRef = doc(firestore, 'categories', categoryId);
  deleteDoc(categoryRef)
    .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
        path: categoryRef.path,
        operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw new Error('You do not have permission to delete categories.');
    });
}

/**
 * Fetches all categories, transforms them, and saves them to a single
 * cache document in Firestore.
 * @param firestore The Firestore database instance.
 * @returns The number of categories that were cached.
 */
export async function updateCategoryCache(firestore: Firestore): Promise<number> {
    try {
        // 1. Fetch all categories, ordered by name
        const categoriesRef = collection(firestore, 'categories');
        const q = query(categoriesRef, orderBy('name'));
        const querySnapshot = await getDocs(q);

        const allCategories = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Category[];

        // 2. Prepare the data for the cache document
        const dataToSet = {
            lastUpdated: new Date().toISOString(),
            categories: allCategories,
        };

        // 3. Get a reference to the target cache document and save the data
        const cacheDocRef = doc(firestore, 'cachedData', 'allCategories');
        await setDoc(cacheDocRef, dataToSet, { merge: true });

        // 4. Return the number of cached categories
        return allCategories.length;

    } catch (error) {
        console.error("Error updating category cache:", error);
        if ((error as any).code === 'permission-denied') {
             const permissionError = new FirestorePermissionError({
                path: 'cachedData/allCategories',
                operation: 'write',
            });
            errorEmitter.emit('permission-error', permissionError);
            throw new Error('You do not have permission to update the cache.');
        }
        // Re-throw other errors to be caught by the calling component
        throw error;
    }
}
