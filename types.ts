// Shop types
export interface Shop {
  id: number;
  name: string;
  description?: string;
  email: string;
  telegram_chat_id?: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ShopCreate {
  name: string;
  description?: string;
  email: string;
  password: string;
}

// Product types
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  shop_id: number;
  image_url?: string;
  created_at: string;
  updated_at: string | null;
}

export interface ProductCreate {
  name: string;
  description?: string;
  price: number;
  shop_id: number;
  image_url?: string;
}

// Order types
export enum OrderStatus {
  WaitingToProcess = 'waiting_to_process',
  Processed = 'processed',
  Cancelled = 'cancelled'
}

export interface Order {
  id: number;
  product_id: number;
  blogger_id: number;
  quantity: number;
  price_per_item: number;
  client_phone: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string | null;
}

export interface OrderCreate {
  product_id: number;
  blogger_id: number;
  quantity: number;
  price_per_item: number;
  client_phone: string;
}

// Analytics types
export interface Analytics {
  id: number;
  product_id: number;
  blogger_id: number;
  visit_count: number;
  order_count: number;
  items_sold: number;
  money_earned: number;
  created_at: string;
  updated_at: string | null;
  blogger?: Blogger | null;
}

export interface AffiliateLink {
  id: number;
  product_id: number;
  blogger_id: number;
  code: string;
  created_at: string;
  updated_at: string | null;
}

export interface AffiliateLinkCreate {
  product_id: number;
  blogger_id: number;
}

export interface Blogger {
  id: number;
  name: string;
  email: string;
  bio?: string;
  created_at: string;
  updated_at: string | null;
}

export interface BloggerCreate {
  name: string;
  email: string;
  bio?: string;
}