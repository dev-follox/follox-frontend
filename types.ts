// Shop types (kept for backward compatibility with affiliate module)
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

// Company types
export type CompanyStage = 'idea' | 'pre-revenue' | 'post-PMF' | 'scaling';

export interface Company {
  id: number;
  full_name: string;
  email: string;
  phone_number?: string | null;
  professional_profile_link?: string | null;
  company_name: string;
  stage?: CompanyStage | null;
  description?: string | null;
  telegram_chat_id?: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CompanyCreate {
  full_name: string;
  email: string;
  phone_number?: string | null;
  professional_profile_link?: string | null;
  company_name: string;
  stage?: CompanyStage | null;
  description?: string | null;
  password: string;
}

export interface CompanyUpdate {
  full_name?: string | null;
  phone_number?: string | null;
  professional_profile_link?: string | null;
  company_name?: string | null;
  stage?: CompanyStage | null;
  description?: string | null;
}

export interface PasswordUpdate {
  current_password: string;
  new_password: string;
}

// Company Answers types (flat structure: name, product, client, problem, value_proposition, competitive_advantage, business_model)
export interface CompanyAnswers {
  id: number;
  company_id: number;
  answers: {
    name?: string;
    product?: string;
    client?: string;
    problem?: string;
    value_proposition?: string;
    competitive_advantage?: string;
    business_model?: string;
    interview_data?: string;
  };
  created_at: string;
  updated_at: string | null;
}

export interface CompanyAnswersUpdate {
  answers: CompanyAnswers['answers'];
}

// ─── Iterations & Tools ───────────────────────────────────────────────────────

export type ToolType =
  | 'hypothesis_generator'
  | 'custdev_target_planner'
  | 'custdev_interview_designer'
  | 'custdev_insights_analyzer';

export interface Iteration {
  id: number;
  company_id: number;
  user_id: number;
  name: string;
  status: string;
  is_current: boolean;
  is_past: boolean;
  created_at: string;
  updated_at: string | null;
  // Optional nested tool outputs if backend includes them on list endpoint
  tool_outputs?: ToolOutput[];
}

export interface ToolOutput {
  id: number;
  iteration_id: number;
  user_id: number;
  tool_type: ToolType;
  output_json: Record<string, unknown> | null;
  output_raw: string | null;
  generation_index: number;
  is_selected: boolean;
  tokens_used: number | null;
  created_at: string;
}

export interface IterationContextSummary {
  type: ToolType;
  answers: CompanyAnswers['answers'] | null;
  current_iteration: {
    id: number | null;
    hypotheses: unknown | null;
    custdev_target_plan: unknown | null;
    custdev_interview_design: unknown | null;
    custdev_insights_analysis: unknown | null;
  };
  past_iteration: {
    id: number | null;
    hypotheses: unknown | null;
    custdev_target_plan: unknown | null;
    custdev_interview_design: unknown | null;
    custdev_insights_analysis: unknown | null;
  };
  language: string | null;
}

export type UserRole = 'COMPANY' | 'BLOGGER' | 'ADMIN';

// Product types
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  company_id: number;
  image_url?: string;
  blogger_task_description?: string;
  created_at: string;
  updated_at: string | null;
}

export interface ProductCreate {
  name: string;
  description?: string;
  price: number;
  company_id: number;
  image_url?: string;
  blogger_task_description?: string;
}

export interface ProductUpdate {
  name?: string | null;
  description?: string | null;
  price?: number | null;
  image_url?: string | null;
  blogger_task_description?: string | null;
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
  click_count?: number;
  created_at: string;
  updated_at: string | null;
}

export interface AffiliateLinkDetail extends AffiliateLink {
  product: Product;
  blogger: Blogger;
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
  company_id?: number | null;
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