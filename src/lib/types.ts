
import { Timestamp } from 'firebase/firestore';

export type VariantDetail = {
  id: string; // Combination of color and size, e.g., 'black-large'
  color: string;
  size: string;
  price: number;
  discountPrice: number | null; // Use null for consistency
  stock: number;
  sku: string | null; // Use null for consistency
};

export type Product = {
  id: string;
  name: string;
  description: string;
  name_ar?: string;
  description_ar?: string;
  price: number;
  discountPrice: number | null;
  shippingPrice?: number;
  mainImage: string;
  images: string[];
  category: string;
  stock: number;
  featured?: boolean;
  active?: boolean;
  sku?: string | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  // This field is for placeholder images and not part of the Firestore schema
  imageHint?: string;

  // New Variants Structure
  variantsEnabled?: boolean;
  variantOptions?: {
    colors: string[];
    sizes: string[];
  };
  variants?: VariantDetail[];
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
  title?: string;
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
  variant: {
    color: string | null;
    size: string | null;
  } | null;
};

export type OrderItem = {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    imageUrl: string;
    variant?: {
        color: string | null;
        size: string | null;
    }
}

export type Order = {
    id: string;
    userId: string | null;
    items: OrderItem[];
    total: number;
    name: string;
    email: string;
    email_lowercase: string;
    phone: string;
    street: string;
    city: string;
    zip: string;
    country: string;
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

export type Currency = "AED" | "MAD" | "USD" | "EUR";

export type SiteSettings = {
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  faviconUrl: string;
  contactEmail: string;
  contactPhone: string;
  storeAddress: string;
  defaultThemeMode: 'light' | 'dark';
  defaultCurrency: Currency;
  payments: {
    creditCard: boolean;
    paypal: boolean;
    cod: boolean;
  };
  imgbbApiKey: string;
};
