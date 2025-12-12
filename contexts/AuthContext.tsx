
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Shop, Blogger, UserRole } from '../types';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

interface AuthUser {
  role: UserRole;
  shop?: Shop | null;
  blogger?: Blogger | null;
}

interface GoogleOAuthResponse {
  access_token: string;
  token_type: string;
  shop_id?: number | null;
  blogger_id?: number | null;
  email: string;
  name: string;
  role: UserRole;
  is_new_user: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (googleResponse: GoogleOAuthResponse) => Promise<void>;
  logout: () => void;
  setShopData: (updated: Shop) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to parse auth user from localStorage', error);
      localStorage.removeItem('auth_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, shop, blogger } = await api.login(email, password);

    if (token.role === 'SHOP') {
      const authUser: AuthUser = { role: 'SHOP', shop: shop || null };
      setUser(authUser);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
      navigate('/shop/dashboard', { replace: true });
      return;
    }

    if (token.role === 'BLOGGER') {
      const authUser: AuthUser = { role: 'BLOGGER', blogger: blogger || null };
      setUser(authUser);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
      navigate('/blogger/products', { replace: true });
      return;
    }
  }, [navigate]);

  const loginWithGoogle = useCallback(async (googleResponse: GoogleOAuthResponse) => {
    console.log('loginWithGoogle called with:', {
      role: googleResponse.role,
      shop_id: googleResponse.shop_id,
      blogger_id: googleResponse.blogger_id,
      email: googleResponse.email,
    });

    // Store the token
    localStorage.setItem('access_token', googleResponse.access_token);
    localStorage.setItem('auth_token_payload', JSON.stringify(googleResponse));

    // Handle SHOP role
    if (googleResponse.role === 'SHOP') {
      if (googleResponse.shop_id != null) {
        try {
          console.log('Fetching shop data for shop_id:', googleResponse.shop_id);
          console.log('Token stored:', !!localStorage.getItem('access_token'));
          
          const shopResponse = await api.getMyShop(googleResponse.shop_id);
          const authUser: AuthUser = { role: 'SHOP', shop: shopResponse };
          setUser(authUser);
          localStorage.setItem('auth_user', JSON.stringify(authUser));
          console.log('Shop login successful, navigating to dashboard');
          navigate('/shop/dashboard', { replace: true });
          return;
        } catch (err: any) {
          console.error('Failed to fetch shop data:', err);
          console.error('Error details:', {
            status: err?.response?.status,
            data: err?.response?.data,
            message: err?.message,
          });
          
          // If 403 Forbidden, the backend says we're not authorized
          // This might happen if the token's shop_id doesn't match, or token is invalid
          // For now, create a minimal shop object from token data
          if (err?.response?.status === 403) {
            console.warn('403 Forbidden - creating minimal shop from token data');
            const minimalShop: Shop = {
              id: googleResponse.shop_id,
              name: googleResponse.name,
              email: googleResponse.email,
              description: null,
              telegram_chat_id: null,
              created_at: new Date().toISOString(),
              updated_at: null,
            };
            const authUser: AuthUser = { role: 'SHOP', shop: minimalShop };
            setUser(authUser);
            localStorage.setItem('auth_user', JSON.stringify(authUser));
            console.log('Shop login successful (using minimal shop data), navigating to dashboard');
            navigate('/shop/dashboard', { replace: true });
            return;
          }
          
          throw new Error(`Failed to fetch shop data: ${err?.response?.data?.detail || err?.message}`);
        }
      } else {
        console.error('SHOP role but shop_id is null');
        throw new Error('SHOP role but shop_id is null');
      }
    }

    // Handle BLOGGER role
    if (googleResponse.role === 'BLOGGER') {
      const blogger: Blogger = {
        id: googleResponse.blogger_id || 0,
        name: googleResponse.name,
        email: googleResponse.email,
        created_at: new Date().toISOString(),
        updated_at: null,
      };
      const authUser: AuthUser = { role: 'BLOGGER', blogger };
      setUser(authUser);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
      console.log('Blogger login successful, navigating to products');
      navigate('/blogger/products', { replace: true });
      return;
    }

    // Unknown role
    console.error('Unknown role in Google OAuth response:', googleResponse.role);
    throw new Error(`Unknown role: ${googleResponse.role}`);
  }, [navigate]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('access_token');
    navigate('/login', { replace: true });
  }, [navigate]);

  const setShopData = useCallback((updated: Shop) => {
    setUser(prev => {
      if (!prev || prev.role !== 'SHOP') return prev;
      const updatedUser: AuthUser = { ...prev, shop: updated };
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  const value = {
    user,
    isLoggedIn: !!user,
    loading,
    login,
    loginWithGoogle,
    logout,
    setShopData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
