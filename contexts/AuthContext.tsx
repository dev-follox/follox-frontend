
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Shop } from '../types';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  shop: Shop | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setShopData: (updated: Shop) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedShop = localStorage.getItem('shop');
      if (storedShop) {
        setShop(JSON.parse(storedShop));
      }
    } catch (error) {
      console.error('Failed to parse shop from localStorage', error);
      localStorage.removeItem('shop');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { shop: loggedInShop } = await api.login(email, password);
    setShop(loggedInShop);
    localStorage.setItem('shop', JSON.stringify(loggedInShop));
    navigate('/shop/dashboard', { replace: true });
  }, [navigate]);

  const logout = useCallback(() => {
    setShop(null);
    localStorage.removeItem('shop');
    localStorage.removeItem('access_token');
    navigate('/shop/login', { replace: true });
  }, [navigate]);

  const setShopData = useCallback((updated: Shop) => {
    setShop(updated);
    localStorage.setItem('shop', JSON.stringify(updated));
  }, []);

  const value = {
    shop,
    isLoggedIn: !!shop,
    loading,
    login,
    logout,
    setShopData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
