import axios from 'axios';
import { Shop, Product, ProductCreate, Order, Analytics, OrderStatus, AffiliateLink, AffiliateLinkCreate, Blogger, BloggerCreate } from '../types';

// In development, use the proxy URL, in production use the actual URL
const BASE_URL = import.meta.env.MODE === 'development' 
  ? '/api' 
  : 'https://deltahub-backend.onrender.com';

export const getImageUrl = (imageUrl: string) => {
  if (imageUrl.startsWith('http')) return imageUrl;
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
  const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint => {
    if (endpoint === '/products/') {
      // Only GET /products/{id} is public, not GET /products/ or any sub-endpoints
      return config.url?.startsWith(endpoint) && 
             config.method === 'get' && 
             config.url !== '/products/' &&
             !config.url?.includes('/orders/') &&
             !config.url?.includes('/analytics');
    }
    if (endpoint === '/orders/') {
      return config.url?.startsWith(endpoint) && config.method === 'post';
    }
    return config.url?.startsWith(endpoint);
  });

  if (token && !isPublicEndpoint) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Request headers:', config.headers);
    console.log('Request URL:', config.url);
  }
  return config;
});

// Log response errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('Response error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    }
    return Promise.reject(error);
  }
);

const api = {
  getImageUrl,
  // Auth endpoints
  login: async (email: string, password: string): Promise<{ shop: Shop; token: string }> => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    console.log('Login request payload:', { username: email, password: '***' });
    // Override axios instance for this specific request
    const response = await axios.post(`${BASE_URL}/token`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    console.log('Login response:', response.data);
    
    // Store the token
    const token = response.data.access_token;
    const shopId = response.data.shop_id;

    // Store token in localStorage so the interceptor can use it
    localStorage.setItem('access_token', token);

    // Get shop info using the token and shop_id
    const shopResponse = await axiosInstance.get(`/shops/me/${shopId}`);
    
    // Create shop object from response
    const shop: Shop = {
      id: shopId,
      name: response.data.name,
      email: response.data.email,
      description: null,
      created_at: new Date().toISOString(), // We'll get the real date from /shops/me/{shop_id}
      updated_at: null
    };

    return { shop: { ...shop, ...shopResponse.data }, token };
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
};

export default api;
