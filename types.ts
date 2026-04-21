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
  default_designer_bonus_percent: number;
  subscription_expires_at?: string | null;
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
  default_designer_bonus_percent: number;
}

export interface CompanyUpdate {
  full_name?: string | null;
  phone_number?: string | null;
  professional_profile_link?: string | null;
  company_name?: string | null;
  stage?: CompanyStage | null;
  description?: string | null;
  default_designer_bonus_percent?: number | null;
}

export interface CompanySubscriptionAdminUpdate {
  subscription_expires_at?: string | null;
  default_designer_bonus_percent?: number | null;
}

export interface PasswordUpdate {
  current_password: string;
  new_password: string;
}

/** Response from GET /companies/{id}/telegram/setup (shape varies by backend). */
export interface CompanyTelegramSetup {
  bot_link?: string;
  bot_url?: string;
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

export type UserRole = 'COMPANY' | 'DESIGNER' | 'ADMIN';

export type OrderStatusValue = 'waiting_to_process' | 'processed' | 'cancelled';

export type InviteStatus = 'pending' | 'accepted' | 'expired';

// Product types
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  company_id: number;
  /** Embedded shop info when API includes it (e.g. affiliate link payloads). */
  company?: { id: number; company_name: string } | null;
  image_url?: string;
  designer_task_description?: string;
  created_at: string;
  updated_at: string | null;
}

export interface ProductCreate {
  name: string;
  description?: string;
  price: number;
  company_id: number;
  image_url?: string;
  designer_task_description?: string;
}

export interface ProductUpdate {
  name?: string | null;
  description?: string | null;
  price?: number | null;
  image_url?: string | null;
  designer_task_description?: string | null;
}

// Order types
export interface Order {
  id: number;
  product_id: number;
  designer_id: number;
  quantity: number;
  price_per_item: number;
  client_phone: string;
  client_name?: string | null;
  note?: string | null;
  affiliate_link_id?: number | null;
  line_revenue: number;
  designer_bonus_amount: number;
  platform_fee_amount: number;
  attachment_url?: string | null;
  is_manual: boolean;
  status: OrderStatusValue;
  created_at: string;
  updated_at: string | null;
}

export interface OrderCreate {
  product_id: number;
  designer_id: number;
  quantity: number;
  price_per_item: number;
  client_phone: string;
  client_name?: string | null;
  note?: string | null;
  affiliate_link_id?: number | null;
  is_manual?: boolean;
}

// Analytics types
export interface Analytics {
  id: number;
  affiliate_link_id: number;
  product_id: number;
  company_id: number;
  designer_id: number;
  visit_count: number;
  order_count: number;
  items_sold: number;
  revenue?: number;
  designer_bonus_paid?: number;
  platform_fee_paid?: number;
  money_earned?: number;
  commission_paid?: number;
  created_at: string;
  updated_at: string | null;
  designer?: Designer | null;
  product?: Product | null;
}

export interface DesignerRanking {
  designer: Designer;
  total_visits: number;
  total_orders: number;
  total_items_sold: number;
  total_revenue: number;
  total_designer_bonus: number;
  total_platform_fee: number;
  conversion_rate: number;
}

export interface AnalyticsDashboard {
  total_visits: number;
  total_orders: number;
  total_items_sold: number;
  total_revenue: number;
  total_designer_bonus: number;
  total_platform_fee: number;
  designer_rankings: DesignerRanking[];
  per_link: Analytics[];
}

export type CompanyAnalyticsSort = 'revenue' | 'designer_bonus' | 'platform_fee';

export interface CompanyProductAnalyticsRow {
  product_id: number;
  product_name: string;
  items_sold: number;
  revenue: number;
  designer_bonus: number;
  platform_fee: number;
}

export interface CompanyProductDesignerBreakdownRow {
  designer_id: number;
  designer_name: string;
  designer_email: string;
  items_sold: number;
  revenue: number;
  designer_bonus: number;
  platform_fee: number;
}

export interface CompanyDesignerAnalyticsRow {
  designer_id: number;
  designer_name: string;
  designer_email: string;
  items_sold: number;
  revenue: number;
  designer_bonus: number;
  platform_fee: number;
}

export interface CompanyDesignerProductBreakdownRow {
  product_id: number;
  product_name: string;
  items_sold: number;
  revenue: number;
  designer_bonus: number;
  platform_fee: number;
}

export interface OrderWithDetails extends Order {
  product?: Product | null;
  designer?: Designer | null;
}

export interface AffiliateLink {
  id: number;
  product_id: number;
  designer_id: number;
  code: string;
  click_count?: number;
  created_at: string;
  updated_at: string | null;
}

export interface AffiliateLinkDetail extends AffiliateLink {
  product: Product;
  designer: Designer;
}

export interface AffiliateLinkWithRollup extends AffiliateLinkDetail {
  visit_count?: number;
  order_count?: number;
  items_sold?: number;
  revenue?: number;
  designer_bonus_paid?: number;
  platform_fee_paid?: number;
  effective_bonus_percent: number;
}

export interface AffiliateLinkCreate {
  product_id: number;
}

export interface Designer {
  id: number;
  name: string;
  email: string;
  bio?: string | null;
  telegram_chat_id?: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface DesignerCreate {
  name: string;
  email: string;
  bio?: string;
  password: string;
}

export interface DesignerUpdate {
  name?: string | null;
  bio?: string | null;
}

export interface DesignerCompany {
  id: number;
  designer_id: number;
  company_id: number;
  bonus_percent_override?: number | null;
  created_at: string;
}

export interface DesignerCompanyWithDesigner extends DesignerCompany {
  designer: Designer;
  effective_bonus_percent: number;
}

export interface DesignerInvite {
  id: number;
  company_id: number;
  designer_email: string;
  token: string;
  status: InviteStatus;
  expires_at: string;
  created_at: string;
}

export interface DesignerInviteCreate {
  designer_email: string;
}

export interface DesignerInviteAccept {
  token: string;
  name: string;
  password: string;
}

export interface DesignerBonusUpdate {
  bonus_percent_override: number | null;
}

export interface DesignerManualOrderCreate {
  product_id: number;
  quantity: number;
  price_per_item: number;
  client_phone: string;
  client_name?: string | null;
  note?: string | null;
  attachment_url?: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  company_id?: number | null;
  designer_id?: number | null;
  admin_id?: number | null;
  name: string;
  email: string;
  is_new_user?: boolean;
}

export interface DesignerProductDetailed {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  designer_task_description?: string | null;
  affiliate_code: string;
}