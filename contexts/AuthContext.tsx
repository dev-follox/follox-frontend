
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Designer, Company, UserRole, TokenResponse } from '../types';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

interface AuthUser {
  role: UserRole;
  company?: Company | null;
  designer?: Designer | null;
}

interface GoogleOAuthResponse {
  access_token: string;
  token_type: string;
  company_id?: number | null;
  designer_id?: number | null;
  admin_id?: number | null;
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
  loginFromInviteToken: (tokenResponse: TokenResponse) => Promise<void>;
  logout: () => void;
  setCompanyData: (updated: Company) => void;
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
    const { token, company, designer } = await api.login(email, password);

    if (token.role === 'COMPANY') {
      const authUser: AuthUser = { role: 'COMPANY', company: company || null };
      setUser(authUser);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
      navigate('/dashboard', { replace: true });
      return;
    }

    if (token.role === 'DESIGNER') {
      const authUser: AuthUser = { role: 'DESIGNER', designer: designer || null };
      setUser(authUser);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
      navigate('/designers/products', { replace: true });
      return;
    }

    if (token.role === 'ADMIN') {
      const authUser: AuthUser = { role: 'ADMIN' };
      setUser(authUser);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
      navigate('/admin/companies', { replace: true });
      return;
    }

    console.error('Unknown role in login response:', token.role);
    throw new Error(`Unknown role: ${token.role}`);
  }, [navigate]);

  const loginFromInviteToken = useCallback(
    async (tokenResponse: TokenResponse) => {
      localStorage.setItem('access_token', tokenResponse.access_token);
      localStorage.setItem('auth_token_payload', JSON.stringify(tokenResponse));
      let designer: Designer | null = null;
      try {
        designer = await api.getDesignerMe();
      } catch {
        designer = {
          id: tokenResponse.designer_id || 0,
          name: tokenResponse.name,
          email: tokenResponse.email,
          created_at: new Date().toISOString(),
          updated_at: null,
        };
      }
      const authUser: AuthUser = { role: 'DESIGNER', designer };
      setUser(authUser);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
      navigate('/designers/products', { replace: true });
    },
    [navigate]
  );

  const loginWithGoogle = useCallback(
    async (googleResponse: GoogleOAuthResponse) => {
      localStorage.setItem('access_token', googleResponse.access_token);
      localStorage.setItem('auth_token_payload', JSON.stringify(googleResponse));

      if (googleResponse.role === 'COMPANY' && googleResponse.company_id != null) {
        try {
          const companyResponse = await api.getMyCompany(googleResponse.company_id);
          const authUser: AuthUser = { role: 'COMPANY', company: companyResponse };
          setUser(authUser);
          localStorage.setItem('auth_user', JSON.stringify(authUser));
          navigate('/dashboard', { replace: true });
          return;
        } catch (err: unknown) {
          const e = err as { response?: { status?: number } };
          if (e?.response?.status === 403) {
            const minimalCompany: Company = {
              id: googleResponse.company_id,
              full_name: googleResponse.name,
              email: googleResponse.email,
              company_name: googleResponse.name,
              phone_number: null,
              professional_profile_link: null,
              stage: null,
              description: null,
              telegram_chat_id: null,
              default_designer_bonus_percent: 0,
              subscription_expires_at: null,
              created_at: new Date().toISOString(),
              updated_at: null,
            };
            const authUser: AuthUser = { role: 'COMPANY', company: minimalCompany };
            setUser(authUser);
            localStorage.setItem('auth_user', JSON.stringify(authUser));
            navigate('/dashboard', { replace: true });
            return;
          }
          throw new Error('Failed to fetch company data');
        }
      }

      if (googleResponse.role === 'DESIGNER') {
        let designer: Designer | null = null;
        try {
          designer = await api.getDesignerMe();
        } catch {
          designer = {
            id: googleResponse.designer_id || 0,
            name: googleResponse.name,
            email: googleResponse.email,
            created_at: new Date().toISOString(),
            updated_at: null,
          };
        }
        const authUser: AuthUser = { role: 'DESIGNER', designer };
        setUser(authUser);
        localStorage.setItem('auth_user', JSON.stringify(authUser));
        navigate('/designers/products', { replace: true });
        return;
      }

      if (googleResponse.role === 'ADMIN') {
        const authUser: AuthUser = { role: 'ADMIN' };
        setUser(authUser);
        localStorage.setItem('auth_user', JSON.stringify(authUser));
        navigate('/admin/companies', { replace: true });
        return;
      }

      console.error('Unknown role in Google OAuth response:', googleResponse.role);
      throw new Error(`Unknown role: ${googleResponse.role}`);
    },
    [navigate]
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_token_payload');
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('dashboard_chat_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => sessionStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear chat history from session storage:', error);
    }
    navigate('/login', { replace: true });
  }, [navigate]);

  const setCompanyData = useCallback((updated: Company) => {
    setUser((prev) => {
      if (!prev || prev.role !== 'COMPANY') return prev;
      const updatedUser: AuthUser = { ...prev, company: updated };
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
    loginFromInviteToken,
    logout,
    setCompanyData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
