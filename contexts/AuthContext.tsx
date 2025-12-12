
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
    // Store the token
    localStorage.setItem('access_token', googleResponse.access_token);
    localStorage.setItem('auth_token_payload', JSON.stringify(googleResponse));

    // Fetch full entity data if needed
    if (googleResponse.role === 'SHOP' && googleResponse.shop_id != null) {
      try {
        const shopResponse = await api.getMyShop(googleResponse.shop_id);
        const authUser: AuthUser = { role: 'SHOP', shop: shopResponse };
        setUser(authUser);
        localStorage.setItem('auth_user', JSON.stringify(authUser));
        navigate('/shop/dashboard', { replace: true });
        return;
      } catch (err) {
        console.error('Failed to fetch shop data:', err);
      }
    }

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
      navigate('/blogger/products', { replace: true });
      return;
    }
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
