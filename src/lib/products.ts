import type { Product } from './types';
import { PlaceHolderImages } from './placeholder-images';

const products: Product[] = [
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

// Simulate fetching data from Firestore
export async function getProducts(): Promise<Product[]> {
  // In a real app, you would fetch from Firestore here.
  // e.g., const snapshot = await getDocs(collection(db, 'products'));
  // return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(products);
    }, 500); // Simulate network delay
  });
}

export async function getProductById(id: string): Promise<Product | undefined> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(products.find(p => p.id === id));
        }, 300);
    });
}
