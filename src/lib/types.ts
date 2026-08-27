export interface ProductImage {
  url: string;
  alt?: string;
}

export interface ProductVariant {
  name: string;
  options: string[];
}

export interface SpecGroup {
  label: string;
  items: { k: string; v: string }[];
}

export interface Product {
  id: number;
  cj_product_id: string;
  title: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  images: ProductImage[];
  category: string;
  specs: SpecGroup[];
  variants: ProductVariant[];
  compatibility: string[];
  warranty: string;
  rating_avg: number;
  rating_count: number;
  created_at: string;
}

export interface Review {
  id: number;
  user_id: string;
  product_id: number;
  rating: number;
  comment: string;
  author_name: string;
  is_verified_delivery: boolean;
  status: string;
  created_at: string;
  product_title?: string;
  message?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_title: string;
  quantity: number;
  price: number;
  variant: string | null;
  image: string | null;
}

export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

export interface Order {
  id: number;
  user_id: string | null;
  customer_email: string;
  shipping_address: ShippingAddress;
  subtotal: number;
  shipping: number;
  tax: number;
  total_paid: number;
  payment_status: string;
  cj_order_id: string | null;
  delivery_status: string;
  tracking_number: string | null;
  created_at: string;
  items?: OrderItem[];
}

export type DeliveryStatus = 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
