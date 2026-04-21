import axios from 'axios';
import {
  Product,
  ProductCreate,
  ProductUpdate,
  Order,
  Analytics,
  AnalyticsDashboard,
  CompanyAnalyticsSort,
  CompanyProductAnalyticsRow,
  CompanyProductDesignerBreakdownRow,
  CompanyDesignerAnalyticsRow,
  CompanyDesignerProductBreakdownRow,
  DesignerRanking,
  OrderStatusValue,
  AffiliateLink,
  AffiliateLinkDetail,
  AffiliateLinkCreate,
  AffiliateLinkWithRollup,
  Designer,
  DesignerCreate,
  DesignerUpdate,
  TokenResponse,
  DesignerProductDetailed,
  Company,
  CompanyCreate,
  CompanyUpdate,
  CompanySubscriptionAdminUpdate,
  CompanyAnswers,
  CompanyAnswersUpdate,
  PasswordUpdate,
  CompanyTelegramSetup,
  Iteration,
  ToolOutput,
  IterationContextSummary,
  ToolType,
  OrderWithDetails,
  OrderCreate,
  DesignerCompanyWithDesigner,
  DesignerInvite,
  DesignerInviteCreate,
  DesignerInviteAccept,
  DesignerBonusUpdate,
  DesignerManualOrderCreate,
  DesignerCompany,
} from '../types';

const BASE_URL = '/v1';

export const getImageUrl = (imageUrl: string) => {
  if (imageUrl.startsWith('http')) {
    if (imageUrl.includes('https://api.flipster.kz')) {
      return imageUrl.replace(/https?:\/\/api\.flipster\.kz/g, BASE_URL);
    }
    return imageUrl;
  }
  const filename = imageUrl.split('/').pop();
  return `${BASE_URL}/products/images/${filename}`;
};

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  const url = config.url || '';

  const isProductsPublicGet = config.method === 'get' && /^\/products\/\d+(?:\?.*)?$/.test(url);

  const isDesignerInvitePreview =
    config.method === 'get' && /^\/designers\/invites\/[^/]+$/.test(url);

  const isDesignerInviteAccept =
    config.method === 'post' && /^\/designers\/invites\/[^/]+\/accept$/.test(url);

  const isOrdersPublicCreate = config.method === 'post' && (url === '/orders/' || url === '/orders');

  const isPublicEndpoint =
    isProductsPublicGet ||
    isOrdersPublicCreate ||
    (url.startsWith('/analytics/visit') && config.method === 'post') ||
    isDesignerInvitePreview ||
    isDesignerInviteAccept;

  if (token && !isPublicEndpoint) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('Response error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });

      if (error.response.status === 401) {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_token_payload');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

const api = {
  getImageUrl,

  login: async (
    email: string,
    password: string
  ): Promise<{ token: TokenResponse; company?: Company; designer?: Designer }> => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await axios.post<TokenResponse>(`${BASE_URL}/token`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const token = response.data.access_token;
    localStorage.setItem('access_token', token);
    localStorage.setItem('auth_token_payload', JSON.stringify(response.data));

    if (response.data.role === 'COMPANY' && response.data.company_id != null) {
      try {
        const companyResponse = await axiosInstance.get(`/companies/me`);
        return { token: response.data, company: companyResponse.data };
      } catch (err) {
        console.error('Failed to fetch company data:', err);
        return { token: response.data };
      }
    }

    if (response.data.role === 'DESIGNER') {
      try {
        const designerResponse = await axiosInstance.get('/designers/me');
        return { token: response.data, designer: designerResponse.data };
      } catch {
        const designer: Designer = {
          id: response.data.designer_id || 0,
          name: response.data.name,
          email: response.data.email,
          created_at: new Date().toISOString(),
          updated_at: null,
        };
        return { token: response.data, designer };
      }
    }

    if (response.data.role === 'ADMIN') {
      return { token: response.data };
    }

    console.warn('Unknown role in login response:', response.data.role);
    return { token: response.data };
  },

  getProduct: async (productId: number): Promise<Product> => {
    const response = await axiosInstance.get(`/products/${productId}`);
    return response.data;
  },

  getProducts: async (skip = 0, limit = 100): Promise<Product[]> => {
    const response = await axiosInstance.get('/products/', { params: { skip, limit } });
    return response.data;
  },

  getProductsForMe: async (): Promise<Product[]> => {
    const response = await axiosInstance.get('/products/for-me');
    return response.data;
  },

  getProductsForMeDetailed: async (): Promise<DesignerProductDetailed[]> => {
    const response = await axiosInstance.get('/products/for-me/detailed');
    return response.data;
  },

  uploadProductImage: async (file: File): Promise<{ image_url: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await axiosInstance.post('/products/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  createProduct: async (productData: ProductCreate): Promise<Product> => {
    const response = await axiosInstance.post('/products/', productData);
    return response.data;
  },

  updateProduct: async (productId: number, productData: ProductUpdate): Promise<Product> => {
    const response = await axiosInstance.put(`/products/${productId}`, productData);
    return response.data;
  },

  deleteProduct: async (productId: number): Promise<void> => {
    await axiosInstance.delete(`/products/${productId}`);
  },

  createOrder: async (orderData: OrderCreate): Promise<Order> => {
    const response = await axiosInstance.post('/orders/', orderData);
    return response.data;
  },

  getProductOrders: async (productId: number): Promise<Order[]> => {
    const response = await axiosInstance.get(`/products/${productId}/orders`);
    return response.data;
  },

  getOrders: async (skip = 0, limit = 100): Promise<Order[]> => {
    const response = await axiosInstance.get('/orders/', { params: { skip, limit } });
    return response.data;
  },

  getOrderById: async (orderId: number): Promise<OrderWithDetails> => {
    const response = await axiosInstance.get(`/orders/${orderId}`);
    return response.data;
  },

  updateOrderStatus: async (orderId: number, status: OrderStatusValue): Promise<void> => {
    await axiosInstance.put(`/orders/${orderId}/status`, null, {
      params: { new_status: status },
    });
  },

  createAffiliateLink: async (data: AffiliateLinkCreate): Promise<AffiliateLink> => {
    const response = await axiosInstance.post('/affiliate-links/', data);
    return response.data;
  },

  getAffiliateLink: async (code: string): Promise<AffiliateLinkDetail> => {
    const response = await axiosInstance.get(`/affiliate-links/${encodeURIComponent(code)}`);
    return response.data;
  },

  getMyAffiliateLinks: async (): Promise<AffiliateLinkWithRollup[]> => {
    const response = await axiosInstance.get('/affiliate-links/my-links');
    return response.data;
  },

  deleteMyAffiliateLink: async (linkId: number): Promise<void> => {
    await axiosInstance.delete(`/affiliate-links/${linkId}`);
  },

  deleteCompanyAffiliateLink: async (linkId: number): Promise<void> => {
    await axiosInstance.delete(`/companies/me/affiliate-links/${linkId}`);
  },

  createDesigner: async (data: DesignerCreate): Promise<Designer> => {
    const response = await axiosInstance.post('/designers/', data);
    return response.data;
  },

  getDesignerMe: async (): Promise<Designer> => {
    const response = await axiosInstance.get('/designers/me');
    return response.data;
  },

  updateDesignerMe: async (data: DesignerUpdate): Promise<Designer> => {
    const response = await axiosInstance.put('/designers/me', data);
    return response.data;
  },

  updateDesignerPassword: async (data: PasswordUpdate): Promise<void> => {
    await axiosInstance.put('/designers/me/password', data);
  },

  linkDesignerTelegram: async (telegramChatId: string): Promise<Designer> => {
    const response = await axiosInstance.post('/designers/me/telegram', {
      telegram_chat_id: telegramChatId,
    });
    return response.data;
  },

  getDesignerCatalogCompanies: async (): Promise<Company[]> => {
    const response = await axiosInstance.get('/designers/catalog/companies');
    return response.data;
  },

  getDesignerCatalogProducts: async (companyId: number): Promise<Product[]> => {
    const response = await axiosInstance.get(`/designers/catalog/companies/${companyId}/products`);
    return response.data;
  },

  getMyDesignerCompanies: async (): Promise<Company[]> => {
    const response = await axiosInstance.get('/designers/me/companies');
    return response.data;
  },

  joinDesignerCompany: async (companyId: number): Promise<DesignerCompany> => {
    const response = await axiosInstance.post(`/designers/me/join-company/${companyId}`);
    return response.data;
  },

  createDesignerManualOrder: async (body: DesignerManualOrderCreate): Promise<Order> => {
    const response = await axiosInstance.post('/designers/me/manual-orders', body);
    return response.data;
  },

  getDesignerInvite: async (token: string): Promise<DesignerInvite> => {
    const response = await axios.get<DesignerInvite>(`${BASE_URL}/designers/invites/${encodeURIComponent(token)}`);
    return response.data;
  },

  acceptDesignerInvite: async (token: string, body: DesignerInviteAccept): Promise<TokenResponse> => {
    const response = await axios.post<TokenResponse>(
      `${BASE_URL}/designers/invites/${encodeURIComponent(token)}/accept`,
      body
    );
    return response.data;
  },

  getCompanyDesigners: async (): Promise<DesignerCompanyWithDesigner[]> => {
    const response = await axiosInstance.get('/companies/me/designers');
    return response.data;
  },

  createDesignerInvite: async (body: DesignerInviteCreate): Promise<DesignerInvite> => {
    const response = await axiosInstance.post('/companies/me/designer-invites', body);
    return response.data;
  },

  patchDesignerBonus: async (designerId: number, body: DesignerBonusUpdate): Promise<DesignerCompany> => {
    const response = await axiosInstance.patch(`/companies/me/designers/${designerId}/bonus`, body);
    return response.data;
  },

  recordAffiliateVisit: async (code: string): Promise<void> => {
    await axiosInstance.post('/analytics/visit', { code });
  },

  getAnalyticsDashboard: async (): Promise<AnalyticsDashboard> => {
    const response = await axiosInstance.get('/analytics/dashboard');
    return response.data;
  },

  getAnalyticsLeaderboard: async (): Promise<DesignerRanking[]> => {
    const response = await axiosInstance.get('/analytics/leaderboard');
    return response.data;
  },

  getDesignerAnalytics: async (designerId: number): Promise<Analytics[]> => {
    const response = await axiosInstance.get(`/analytics/designer/${designerId}`);
    return response.data;
  },

  getMyStats: async (): Promise<Analytics[]> => {
    const response = await axiosInstance.get('/analytics/my-stats');
    return response.data;
  },

  getCompanyProductOrderAnalytics: async (params?: {
    sort?: CompanyAnalyticsSort;
    from?: string | null;
    to?: string | null;
  }): Promise<CompanyProductAnalyticsRow[]> => {
    const response = await axiosInstance.get('/analytics/company/products', {
      params: {
        sort: params?.sort ?? 'revenue',
        from: params?.from ?? undefined,
        to: params?.to ?? undefined,
      },
    });
    return response.data;
  },

  getCompanyProductDesignerBreakdown: async (
    productId: number,
    params?: { sort?: CompanyAnalyticsSort; from?: string | null; to?: string | null }
  ): Promise<CompanyProductDesignerBreakdownRow[]> => {
    const response = await axiosInstance.get(`/analytics/company/products/${productId}/designers`, {
      params: {
        sort: params?.sort ?? 'revenue',
        from: params?.from ?? undefined,
        to: params?.to ?? undefined,
      },
    });
    return response.data;
  },

  getCompanyDesignerAnalytics: async (params?: {
    sort?: CompanyAnalyticsSort;
    from?: string | null;
    to?: string | null;
  }): Promise<CompanyDesignerAnalyticsRow[]> => {
    const response = await axiosInstance.get('/analytics/company/designers', {
      params: {
        sort: params?.sort ?? 'revenue',
        from: params?.from ?? undefined,
        to: params?.to ?? undefined,
      },
    });
    return response.data;
  },

  getCompanyDesignerProductBreakdown: async (
    designerId: number,
    params?: { sort?: CompanyAnalyticsSort; from?: string | null; to?: string | null }
  ): Promise<CompanyDesignerProductBreakdownRow[]> => {
    const response = await axiosInstance.get(`/analytics/company/designers/${designerId}/products`, {
      params: {
        sort: params?.sort ?? 'revenue',
        from: params?.from ?? undefined,
        to: params?.to ?? undefined,
      },
    });
    return response.data;
  },

  getMyOrders: async (skip = 0, limit = 100): Promise<OrderWithDetails[]> => {
    const response = await axiosInstance.get('/orders/my-orders', { params: { skip, limit } });
    return response.data;
  },

  getProductAnalytics: async (productId: number): Promise<Analytics[]> => {
    const response = await axiosInstance.get(`/products/${productId}/analytics`);
    return response.data;
  },

  linkTelegram: async (companyId: number, telegramChatId: string): Promise<Company> => {
    const response = await axiosInstance.post(`/companies/${companyId}/telegram`, {
      telegram_chat_id: telegramChatId,
    });
    return response.data;
  },

  getTelegramSetup: async (companyId: number): Promise<CompanyTelegramSetup> => {
    const response = await axiosInstance.get(`/companies/${companyId}/telegram/setup`);
    return response.data as CompanyTelegramSetup;
  },

  getCompanyAnalytics: async (companyId: number): Promise<Analytics[]> => {
    const response = await axiosInstance.get(`/companies/${companyId}/analytics`);
    return response.data;
  },

  getGoogleAuthorizeUrl: async (
    userType: 'company' | 'designer'
  ): Promise<{
    authorization_url: string;
    state: string;
    redirect_uri: string;
  }> => {
    const response = await axiosInstance.get('/auth/google/authorize-url', {
      params: { user_type: userType },
    });
    return response.data;
  },

  exchangeGoogleCode: async (data: {
    code: string;
    state: string;
    redirect_uri: string;
    user_type: 'company' | 'designer';
  }): Promise<TokenResponse> => {
    const response = await axiosInstance.post('/auth/google/exchange', data);
    return response.data;
  },

  createCompany: async (companyData: CompanyCreate): Promise<Company> => {
    const response = await axiosInstance.post('/companies/', companyData);
    return response.data;
  },

  getCompany: async (companyId: number): Promise<Company> => {
    const response = await axiosInstance.get(`/companies/${companyId}`);
    return response.data;
  },

  getMyCompany: async (_companyId: number): Promise<Company> => {
    const response = await axiosInstance.get(`/companies/me`);
    return response.data;
  },

  getCompanyMe: async (): Promise<Company> => {
    const response = await axiosInstance.get('/companies/me');
    return response.data;
  },

  updateCompanyMe: async (companyData: CompanyUpdate): Promise<Company> => {
    const response = await axiosInstance.put('/companies/me', companyData);
    return response.data;
  },

  updateCompanyPassword: async (data: PasswordUpdate): Promise<void> => {
    await axiosInstance.put('/companies/me/password', data);
  },

  deleteCompanyMe: async (): Promise<void> => {
    await axiosInstance.delete('/companies/me');
  },

  updateCompany: async (companyId: number, companyData: CompanyUpdate): Promise<Company> => {
    const response = await axiosInstance.put(`/companies/${companyId}`, companyData);
    return response.data;
  },

  getCompanyAnswers: async (companyId: number): Promise<CompanyAnswers> => {
    const response = await axiosInstance.get(`/companies/${companyId}/answers`);
    return response.data;
  },

  updateCompanyAnswers: async (companyId: number, answers: CompanyAnswersUpdate): Promise<CompanyAnswers> => {
    const response = await axiosInstance.put(`/companies/${companyId}/answers`, answers);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('company-answers-updated'));
    }
    return response.data;
  },

  generateHypothesisGenerator: async (
    companyId: number,
    body?: { answers?: Record<string, unknown>; language?: string }
  ): Promise<ToolOutput> => {
    const response = await axiosInstance.post(`/companies/${companyId}/hypothesis-generator/generate`, body ?? {});
    return response.data;
  },

  getHypothesisGeneratorHistory: async (companyId: number): Promise<ToolOutput[]> => {
    const response = await axiosInstance.get(`/companies/${companyId}/hypothesis-generator/history`);
    return response.data;
  },

  generateCustdevTargetPlanner: async (
    companyId: number,
    body?: { answers?: Record<string, unknown>; language?: string }
  ): Promise<ToolOutput> => {
    const response = await axiosInstance.post(`/companies/${companyId}/cusdev-target-planner/generate`, body ?? {});
    return response.data;
  },

  getCustdevTargetPlannerHistory: async (companyId: number): Promise<ToolOutput[]> => {
    const response = await axiosInstance.get(`/companies/${companyId}/cusdev-target-planner/history`);
    return response.data;
  },

  generateCustdevInterviewDesigner: async (
    companyId: number,
    body?: { answers?: Record<string, unknown>; language?: string }
  ): Promise<ToolOutput> => {
    const response = await axiosInstance.post(`/companies/${companyId}/custdev-interview-designer/generate`, body ?? {});
    return response.data;
  },

  getCustdevInterviewDesignerHistory: async (companyId: number): Promise<ToolOutput[]> => {
    const response = await axiosInstance.get(`/companies/${companyId}/custdev-interview-designer/history`);
    return response.data;
  },

  generateCustdevInsightsAnalyzer: async (
    companyId: number,
    body?: { answers?: Record<string, unknown>; language?: string }
  ): Promise<ToolOutput> => {
    const response = await axiosInstance.post(`/companies/${companyId}/custdev-insights-analyzer/generate`, body ?? {});
    return response.data;
  },

  getIterations: async (companyId: number): Promise<{ iterations: Iteration[] }> => {
    const response = await axiosInstance.get(`/api/iterations/${companyId}`);
    return response.data;
  },

  startNewIteration: async (companyId: number): Promise<Iteration> => {
    const response = await axiosInstance.post('/api/iterations/start-new', { company_id: companyId });
    return response.data;
  },

  renameIteration: async (iterationId: number, name: string): Promise<Iteration> => {
    const response = await axiosInstance.patch(`/api/iterations/${iterationId}/rename`, { name });
    return response.data;
  },

  getIterationContext: async (companyId: number, toolType: ToolType): Promise<IterationContextSummary> => {
    const response = await axiosInstance.get(`/api/iterations/${companyId}/current-context/${toolType}`);
    return response.data;
  },

  getToolOutputs: async (iterationId: number, toolType: ToolType): Promise<ToolOutput[]> => {
    const response = await axiosInstance.get(`/api/tool-outputs/${iterationId}/${toolType}`);
    return response.data;
  },

  selectToolOutput: async (outputId: number): Promise<ToolOutput> => {
    const response = await axiosInstance.patch(`/api/tool-outputs/${outputId}/select`);
    return response.data;
  },

  getCustdevInsightsAnalyzerHistory: async (companyId: number): Promise<ToolOutput[]> => {
    const response = await axiosInstance.get(`/companies/${companyId}/custdev-insights-analyzer/history`);
    return response.data;
  },

  getAllCompanies: async (skip = 0, limit = 100): Promise<Company[]> => {
    const response = await axiosInstance.get('/admin/companies', {
      params: { skip, limit },
    });
    return response.data;
  },

  getCompanyById: async (companyId: number): Promise<Company> => {
    const response = await axiosInstance.get(`/admin/companies/${companyId}`);
    return response.data;
  },

  patchAdminCompany: async (companyId: number, body: CompanySubscriptionAdminUpdate): Promise<Company> => {
    const response = await axiosInstance.patch(`/admin/companies/${companyId}`, body);
    return response.data;
  },

  getCompanyAnswersAdmin: async (companyId: number): Promise<CompanyAnswers> => {
    const response = await axiosInstance.get(`/admin/companies/${companyId}/answers`);
    return response.data;
  },
};

export default api;
