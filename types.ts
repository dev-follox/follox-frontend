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

export type UserRole = 'SHOP' | 'BLOGGER';

// Product types
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  shop_id: number;
  image_url?: string;
  blogger_task_description?: string;
  created_at: string;
  updated_at: string | null;
}

export interface ProductCreate {
  name: string;
  description?: string;
  price: number;
  shop_id: number;
  image_url?: string;
  blogger_task_description?: string;
}

// Order types
export enum OrderStatus {
  waiting_to_process = 'Ожидает обработки',
  processed = 'Обработан',
  cancelled = 'Отменен'
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
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  shop_id?: number | null;
  blogger_id?: number | null;
  name: string;
  email: string;
}

export interface BloggerProductDetailed {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  blogger_task_description?: string | null;
  affiliate_code: string;
}