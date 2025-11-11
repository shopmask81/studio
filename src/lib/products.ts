import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase-placeholder';
import type { Product } from './types';
import { PlaceHolderImages } from './placeholder-images';

// This is a placeholder and will be replaced by the actual db instance
const firestore = db;

const sampleProducts: Product[] = [
  {
    id: PlaceHolderImages[0].id,
    name: 'Venetian Gold',
    description: PlaceHolderImages[0].description,
    price: 125.00,
    imageUrl: PlaceHolderImages[0].imageUrl,
    imageHint: PlaceHolderImages[0].imageHint,
  },
  {
    id: PlaceHolderImages[1].id,
    name: 'Forest Spirit',
    description: PlaceHolderImages[1].description,
    price: 85.50,
    imageUrl: PlaceHolderImages[1].imageUrl,
    imageHint: PlaceHolderImages[1].imageHint,
  },
  {
    id: PlaceHolderImages[2].id,
    name: 'Plague Doctor',
    description: PlaceHolderImages[2].description,
    price: 99.99,
    imageUrl: PlaceHolderImages[2].imageUrl,
    imageHint: PlaceHolderImages[2].imageHint,
  },
  {
    id: PlaceHolderImages[3].id,
    name: 'Cyber Punk V-2',
    description: PlaceHolderImages[3].description,
    price: 250.00,
    imageUrl: PlaceHolderImages[3].imageUrl,
    imageHint: PlaceHolderImages[3].imageHint,
  },
  {
    id: PlaceHolderImages[4].id,
    name: 'Moon Goddess',
    description: PlaceHolderImages[4].description,
    price: 150.75,
    imageUrl: PlaceHolderImages[4].imageUrl,
    imageHint: PlaceHolderImages[4].imageHint,
  },
  {
    id: PlaceHolderImages[5].id,
    name: 'Jester\'s Delight',
    description: PlaceHolderImages[5].description,
    price: 75.00,
    imageUrl: PlaceHolderImages[5].imageUrl,
    imageHint: PlaceHolderImages[5].imageHint,
  },
];


export async function getProducts(): Promise<Product[]> {
  try {
    const productsCollection = collection(firestore, 'products');
    const snapshot = await getDocs(productsCollection);
    
    if (snapshot.empty) {
        console.warn("No products found in Firestore. Returning sample data.");
        // Optional: You could seed the database here if it's empty
        return sampleProducts;
    }
    
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    return products;
  } catch (error) {
    console.error("Error fetching products from Firestore: ", error);
    // Fallback to sample data if Firestore fetch fails
    return sampleProducts;
  }
}

export async function getProductById(id: string): Promise<Product | undefined> {
    try {
        const productDoc = doc(firestore, 'products', id);
        const snapshot = await getDoc(productDoc);

        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() } as Product;
        } else {
            console.warn(`Product with id ${id} not found in Firestore.`);
            return undefined;
        }
    } catch (error) {
        console.error(`Error fetching product with id ${id} from Firestore: `, error);
        // Fallback to sample data
        return sampleProducts.find(p => p.id === id);
    }
}
