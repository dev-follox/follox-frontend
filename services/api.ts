import axios from 'axios';
import { Shop, Product, ProductCreate, ProductUpdate, Order, Analytics, OrderStatus, AffiliateLink, AffiliateLinkCreate, Blogger, BloggerCreate, TokenResponse, BloggerProductDetailed } from '../types';

// In development, use the proxy URL, in production use the actual URL
const BASE_URL = '/api';

export const getImageUrl = (imageUrl: string) => {
  // If it's already a full URL, check if it's the backend URL and rewrite it
  if (imageUrl.startsWith('http')) {
    // Rewrite backend URLs to use proxy
    if (imageUrl.includes('api.follox.kz')) {
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
  login: async (email: string, password: string): Promise<{ token: TokenResponse; shop?: Shop; blogger?: Blogger }> => {
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

    // Optionally fetch full entity data for shops
    if (response.data.role === 'SHOP' && response.data.shop_id != null) {
      const shopResponse = await axiosInstance.get(`/shops/me/${response.data.shop_id}`);
      return { token: response.data, shop: shopResponse.data };
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

    return { token: response.data };
  },

  register: async (shopData: { name: string; email: string; password: string; description?: string }): Promise<Shop> => {
    const response = await axiosInstance.post('/shops/', shopData);
    return response.data;
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

  // Shop endpoints
  getMyShop: async (shopId: number): Promise<Shop> => {
    const response = await axiosInstance.get(`/shops/me/${shopId}`);
    return response.data;
  },

  linkTelegram: async (shopId: number, telegramChatId: string): Promise<Shop> => {
    const response = await axiosInstance.post(`/shops/${shopId}/telegram`, {
      telegram_chat_id: telegramChatId,
    });
    return response.data;
  },

  getTelegramSetup: async (shopId: number): Promise<any> => {
    const response = await axiosInstance.get(`/shops/${shopId}/telegram/setup`);
    return response.data;
  },

  // OAuth endpoints (frontend-first flow)
  getGoogleAuthorizeUrl: async (userType: 'shop' | 'blogger'): Promise<{
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
    user_type: 'shop' | 'blogger';
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
};

export default api;
