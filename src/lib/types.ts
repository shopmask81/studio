
import { Timestamp } from 'firebase/firestore';

export type ProductVariant = {
  enabled: boolean;
  colors?: string[];
  sizes?: string[];
}

export type Product = {
  id: string;
  name: string;
  description: string;
  name_ar?: string;
  description_ar?: string;
  price: number;
  discountPrice?: number;
  mainImage: string;
  images: string[];
  category: string;
  stock: number;
  variants?: ProductVariant;
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
  selectedColor?: string;
  selectedSize?: string;
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
