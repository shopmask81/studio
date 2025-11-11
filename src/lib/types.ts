import { Timestamp } from 'firebase/firestore';

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  mainImage: string;
  images: string[];
  category: string;
  stock: number;
  featured?: boolean;
  active?: boolean;
  sku?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  // This field is for placeholder images and not part of the Firestore schema
  imageHint?: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type WishlistItem = {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  addedAt: Timestamp;
};

export type Address = {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
  createdAt?: Timestamp;
};

export type UserProfile = {
    uid: string;
    name: string;
    email: string;
    role: 'customer' | 'affiliate' | 'admin';
    createdAt: Timestamp;
    emailVerified: boolean;
};
