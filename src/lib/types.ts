
import { Timestamp } from 'firebase/firestore';

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
  featured?: boolean;
  active?: boolean;
  sku?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  // This field is for placeholder images and not part of the Firestore schema
  imageHint?: string;
};

export type Category = {
    id: string;
    name: string;
    name_lowercase: string;
    slug: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

export type Banner = {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  deleteUrl: string;
  targetUrl?: string;
  cta?: string;
  active: boolean;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CartItem = {
  product: Product;
  quantity: number;
};

export type OrderItem = {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    imageUrl: string;
}

export type Order = {
    id: string;
    userId: string | null;
    items: OrderItem[];
    total: number; // Renamed from totalPrice
    name: string; // From shippingAddress.fullName
    email: string; // From shippingAddress.email
    email_lowercase: string;
    phone: string; // From shippingAddress.phone
    street: string; // From shippingAddress
    city: string; // From shippingAddress
    zip: string; // Renamed from postalCode
    country: string; // From shippingAddress
    affiliateId?: string | null;
    paymentMethod: 'card' | 'paypal' | 'cod';
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    createdAt: Timestamp;
}

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
