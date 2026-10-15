export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  description: string | null;
  price: number;
  original_price: number | null;
  images: string[];
  movement_type: string;
  case_material: string;
  case_size: string | null;
  dial_color: string | null;
  water_resistance: string | null;
  style: string;
  stock: number;
  sku: string | null;
  featured: boolean;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  categories?: Category;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  status: string;
  total: number;
  shipping_name: string;
  shipping_email: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string | null;
  shipping_postal_code: string;
  shipping_country: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_brand: string;
  quantity: number;
  price: number;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  products?: Product;
}

export interface ShippingInfo {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
