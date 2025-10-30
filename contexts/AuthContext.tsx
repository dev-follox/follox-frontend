
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Shop, Blogger, UserRole } from '../types';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

interface AuthUser {
  role: UserRole;
  shop?: Shop | null;
  blogger?: Blogger | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
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
    logout,
    setShopData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
