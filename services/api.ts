import axios from 'axios';
import { Product, ProductCreate, ProductUpdate, Order, Analytics, OrderStatus, AffiliateLink, AffiliateLinkCreate, Blogger, BloggerCreate, TokenResponse, BloggerProductDetailed, Company, CompanyCreate, CompanyUpdate, CompanyAnswers, CompanyAnswersUpdate, GTMStrategy, Validation, Forecast } from '../types';

// In development, use the proxy URL, in production use the actual URL
const BASE_URL = '/v1';

export const getImageUrl = (imageUrl: string) => {
  // If it's already a full URL, check if it's the backend URL and rewrite it
  if (imageUrl.startsWith('http')) {
    // Rewrite backend URLs to use proxy
    if (imageUrl.includes('https://api.follox.co')) {
      return imageUrl.replace(/https?:\/\/api\.follox\.kz/g, BASE_URL);
    }
    // External URLs (like CDN) can stay as-is
    return imageUrl;
  }
  // Relative URL - extract filename and use proxy
  const filename = imageUrl.split('/').pop();
  return `${BASE_URL}/products/images/${filename}`;
};

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Public endpoints that don't need authentication
const PUBLIC_ENDPOINTS = [
  '/products/',  // GET /{id} only
  '/orders/',    // POST only
  '/analytics/visit',
];

// Add token to requests if it exists and endpoint requires auth
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');

  // Only GET /products/{id} is public
  const isProductsPublicGet = config.method === 'get' && /^\/products\/\d+(?:\?.*)?$/.test(config.url || '');

  const isPublicEndpoint = (
    isProductsPublicGet ||
    (config.url?.startsWith('/orders/') && config.method === 'post') ||
    (config.url?.startsWith('/analytics/visit'))
  );

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
        // Clear authentication data
        localStorage.removeItem('auth_user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_token_payload');
        
        // Redirect to auth landing page
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

const api = {
  getImageUrl,
  // Auth endpoints
  login: async (email: string, password: string): Promise<{ token: TokenResponse; company?: Company; blogger?: Blogger }> => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    console.log('Login request payload:', { username: email, password: '***' });
    // Override axios instance for this specific request
    const response = await axios.post<TokenResponse>(`${BASE_URL}/token`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    console.log('Login response:', response.data);
    
    // Store the token
    const token = response.data.access_token;

    // Store token in localStorage so the interceptor can use it
    localStorage.setItem('access_token', token);
    localStorage.setItem('auth_token_payload', JSON.stringify(response.data));

    // For companies, fetch full company data
    if (response.data.role === 'COMPANY' && response.data.company_id != null) {
      try {
        const companyResponse = await axiosInstance.get(`/companies/me/${response.data.company_id}`);
        return { token: response.data, company: companyResponse.data };
      } catch (err) {
        console.error('Failed to fetch company data:', err);
        // Return token without company data if fetch fails
        return { token: response.data };
      }
    }

    // For bloggers, token already includes name/email; we may not have a dedicated profile endpoint
    if (response.data.role === 'BLOGGER') {
      const blogger: Blogger = {
        id: response.data.blogger_id || 0,
        name: response.data.name,
        email: response.data.email,
        created_at: new Date().toISOString(),
        updated_at: null,
      };
      return { token: response.data, blogger };
    }

    // For admin, just return the token (no additional data needed)
    if (response.data.role === 'ADMIN') {
      return { token: response.data };
    }

    // Unknown role - still return token but log warning
    console.warn('Unknown role in login response:', response.data.role);
    return { token: response.data };
  },

  // Products endpoints
  getProduct: async (productId: number, bloggerId?: number): Promise<Product> => {
    const response = await axiosInstance.get(`/products/${productId}`, {
      params: bloggerId ? { blogger_id: bloggerId } : undefined
    });
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

  getProductsForMeDetailed: async (): Promise<BloggerProductDetailed[]> => {
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

  // Orders endpoints
  createOrder: async (orderData: {
    product_id: number;
    blogger_id: number;
    quantity: number;
    price_per_item: number;
    client_phone: string;
  }): Promise<Order> => {
    const response = await axiosInstance.post('/orders/', orderData);
    return response.data;
  },

  getProductOrders: async (productId: number): Promise<Order[]> => {
    const response = await axiosInstance.get(`/products/${productId}/orders/`);
    return response.data;
  },

  updateOrderStatus: async (orderId: number, status: keyof typeof OrderStatus): Promise<void> => {
    await axiosInstance.put(`/orders/${orderId}/status`, null, {
      params: { status },
    });
  },

  // Affiliate link endpoints
  createAffiliateLink: async (data: AffiliateLinkCreate): Promise<AffiliateLink> => {
    const response = await axiosInstance.post('/affiliate-links/', data);
    return response.data;
  },

  getAffiliateLink: async (code: string): Promise<AffiliateLink> => {
    const response = await axiosInstance.get(`/affiliate-links/${code}`);
    return response.data;
  },

  // Blogger endpoints
  getBloggers: async (): Promise<Blogger[]> => {
    const response = await axiosInstance.get('/bloggers/');
    return response.data;
  },

  createBlogger: async (data: BloggerCreate): Promise<Blogger> => {
    const response = await axiosInstance.post('/bloggers/', data);
    return response.data;
  },

  // Analytics endpoints
  getProductAnalytics: async (productId: number): Promise<Analytics[]> => {
    const response = await axiosInstance.get(`/products/${productId}/analytics`);
    return response.data;
  },

  // Company endpoints (for Telegram linking - part of affiliate module)
  linkTelegram: async (companyId: number, telegramChatId: string): Promise<Company> => {
    const response = await axiosInstance.post(`/companies/${companyId}/telegram`, {
      telegram_chat_id: telegramChatId,
    });
    return response.data;
  },

  getTelegramSetup: async (companyId: number): Promise<any> => {
    const response = await axiosInstance.get(`/companies/${companyId}/telegram/setup`);
    return response.data;
  },

  getCompanyAnalytics: async (companyId: number): Promise<Analytics[]> => {
    const response = await axiosInstance.get(`/companies/${companyId}/analytics`);
    return response.data;
  },

  // OAuth endpoints (frontend-first flow)
  getGoogleAuthorizeUrl: async (userType: 'company' | 'blogger'): Promise<{
    authorization_url: string;
    state: string;
    redirect_uri: string;
  }> => {
    // Backend uses FRONTEND_URL env var to construct redirect_uri
    // Make sure FRONTEND_URL matches what's registered in Google OAuth Console
    const response = await axiosInstance.get('/auth/google/authorize-url', {
      params: { 
        user_type: userType,
      },
    });
    return response.data;
  },

  exchangeGoogleCode: async (data: {
    code: string;
    state: string;
    redirect_uri: string;
    user_type: 'company' | 'blogger';
  }): Promise<TokenResponse> => {
    try {
      const response = await axiosInstance.post('/auth/google/exchange', data);
      return response.data;
    } catch (error: any) {
      console.error('exchangeGoogleCode error:', {
        status: error.response?.status,
        data: error.response?.data,
        requestData: {
          ...data,
          code: data.code?.substring(0, 20) + '...', // Log partial code
        },
      });
      throw error;
    }
  },

  // Company endpoints
  createCompany: async (companyData: CompanyCreate): Promise<Company> => {
    const response = await axiosInstance.post('/companies/', companyData);
    return response.data;
  },

  getCompany: async (companyId: number): Promise<Company> => {
    const response = await axiosInstance.get(`/companies/${companyId}`);
    return response.data;
  },

  getMyCompany: async (companyId: number): Promise<Company> => {
    const response = await axiosInstance.get(`/companies/me/${companyId}`);
    return response.data;
  },

  updateCompany: async (companyId: number, companyData: CompanyUpdate): Promise<Company> => {
    const response = await axiosInstance.put(`/companies/${companyId}`, companyData);
    return response.data;
  },

  // Company Answers endpoints
  getCompanyAnswers: async (companyId: number): Promise<CompanyAnswers> => {
    const response = await axiosInstance.get(`/companies/${companyId}/answers`);
    return response.data;
  },

  updateCompanyAnswers: async (companyId: number, answers: CompanyAnswersUpdate): Promise<CompanyAnswers> => {
    const response = await axiosInstance.put(`/companies/${companyId}/answers`, answers);
    return response.data;
  },

  // GTM Strategy endpoints
  generateGTMStrategy: async (companyId: number, language: string = 'ru'): Promise<GTMStrategy> => {
    const response = await axiosInstance.post(`/companies/${companyId}/gtm-strategy/generate`, {
      language,
    });
    return response.data;
  },

  getGTMStrategyHistory: async (companyId: number): Promise<GTMStrategy[]> => {
    const response = await axiosInstance.get(`/companies/${companyId}/gtm-strategy/history`);
    return response.data;
  },

  // Validation endpoints
  generateValidation: async (companyId: number, language: string = 'ru'): Promise<Validation> => {
    const response = await axiosInstance.post(`/companies/${companyId}/validation/generate`, {
      language,
    });
    return response.data;
  },

  getValidationHistory: async (companyId: number): Promise<Validation[]> => {
    const response = await axiosInstance.get(`/companies/${companyId}/validation/history`);
    return response.data;
  },

  // Forecast endpoints
  generateForecast: async (companyId: number, language: string = 'ru'): Promise<Forecast> => {
    const response = await axiosInstance.post(`/companies/${companyId}/forecast/generate`, {
      language,
    });
    return response.data;
  },

  getForecastHistory: async (companyId: number): Promise<Forecast[]> => {
    const response = await axiosInstance.get(`/companies/${companyId}/forecast/history`);
    return response.data;
  },

  // Admin endpoints
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

  // Admin endpoints - get company data as admin
  getCompanyAnswersAdmin: async (companyId: number): Promise<CompanyAnswers> => {
    const response = await axiosInstance.get(`/admin/companies/${companyId}/answers`);
    return response.data;
  },

  getCompanyGTMStrategiesAdmin: async (companyId: number): Promise<GTMStrategy[]> => {
    const response = await axiosInstance.get(`/admin/companies/${companyId}/gtm-strategies`);
    return response.data;
  },

  getCompanyValidationsAdmin: async (companyId: number): Promise<Validation[]> => {
    const response = await axiosInstance.get(`/admin/companies/${companyId}/validations`);
    return response.data;
  },

  getCompanyForecastsAdmin: async (companyId: number): Promise<Forecast[]> => {
    const response = await axiosInstance.get(`/admin/companies/${companyId}/forecasts`);
    return response.data;
  },
};

export default api;
