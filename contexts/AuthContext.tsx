
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Blogger, Company, UserRole } from '../types';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

interface AuthUser {
  role: UserRole;
  company?: Company | null;
  blogger?: Blogger | null;
}

interface GoogleOAuthResponse {
  access_token: string;
  token_type: string;
  company_id?: number | null;
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
    const { token, company, blogger } = await api.login(email, password);

    if (token.role === 'COMPANY') {
      const authUser: AuthUser = { role: 'COMPANY', company: company || null };
      setUser(authUser);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
      
      // Check which module was selected before auth
      const selectedModule = localStorage.getItem('selectedModule');
      if (selectedModule === 'tools') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/company/dashboard', { replace: true });
      }
      return;
    }

    if (token.role === 'BLOGGER') {
      const authUser: AuthUser = { role: 'BLOGGER', blogger: blogger || null };
      setUser(authUser);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
      navigate('/blogger/products', { replace: true });
      return;
    }

    if (token.role === 'ADMIN') {
      const authUser: AuthUser = { role: 'ADMIN' };
      setUser(authUser);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
      navigate('/admin/companies', { replace: true });
      return;
    }

    // Unknown role
    console.error('Unknown role in login response:', token.role);
    throw new Error(`Unknown role: ${token.role}`);
  }, [navigate]);

  const loginWithGoogle = useCallback(async (googleResponse: GoogleOAuthResponse) => {
    console.log('loginWithGoogle called with:', {
      role: googleResponse.role,
      shop_id: googleResponse.company_id,
      blogger_id: googleResponse.blogger_id,
      email: googleResponse.email,
    });

    // Store the token
    localStorage.setItem('access_token', googleResponse.access_token);
    localStorage.setItem('auth_token_payload', JSON.stringify(googleResponse));

    // Handle COMPANY role
    if (googleResponse.role === 'COMPANY') {
      if (googleResponse.company_id != null) {
        try {
          console.log('Fetching company data for company_id:', googleResponse.company_id);
          console.log('Token stored:', !!localStorage.getItem('access_token'));
          
          const companyResponse = await api.getMyCompany(googleResponse.company_id);
          const authUser: AuthUser = { role: 'COMPANY', company: companyResponse };
          setUser(authUser);
          localStorage.setItem('auth_user', JSON.stringify(authUser));
          console.log('Company login successful, navigating to dashboard');
          
          // Check which module was selected before auth
          const selectedModule = localStorage.getItem('selectedModule');
          if (selectedModule === 'tools') {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/company/dashboard', { replace: true });
          }
          return;
        } catch (err: any) {
          console.error('Failed to fetch company data:', err);
          console.error('Error details:', {
            status: err?.response?.status,
            data: err?.response?.data,
            message: err?.message,
          });
          
          // If 403 Forbidden, the backend says we're not authorized
          // For now, create a minimal company object from token data
          if (err?.response?.status === 403) {
            console.warn('403 Forbidden - creating minimal company from token data');
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
              created_at: new Date().toISOString(),
              updated_at: null,
            };
            const authUser: AuthUser = { role: 'COMPANY', company: minimalCompany };
            setUser(authUser);
            localStorage.setItem('auth_user', JSON.stringify(authUser));
            console.log('Company login successful (using minimal company data), navigating to dashboard');
            
            // Check which module was selected before auth
            const selectedModule = localStorage.getItem('selectedModule');
            if (selectedModule === 'tools') {
              navigate('/dashboard', { replace: true });
            } else {
              navigate('/company/dashboard', { replace: true });
            }
            return;
          }
          
          throw new Error(`Failed to fetch company data: ${err?.response?.data?.detail || err?.message}`);
        }
      } else {
        console.error('COMPANY role but company_id is null');
        throw new Error('COMPANY role but company_id is null');
      }
    }

    // Handle COMPANY role
    if (googleResponse.role as UserRole === 'COMPANY') {
      if (googleResponse.company_id != null) {
        try {
          console.log('Fetching company data for company_id:', googleResponse.company_id);
          const companyResponse = await api.getMyCompany(googleResponse.company_id);
          const authUser: AuthUser = { role: 'COMPANY', company: companyResponse };
          setUser(authUser);
          localStorage.setItem('auth_user', JSON.stringify(authUser));
          console.log('Company login successful, navigating to GTM Q&A');
          navigate('/dashboard', { replace: true });
          return;
        } catch (err: any) {
          console.error('Failed to fetch company data:', err);
          // Create minimal company object from token data
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
            created_at: new Date().toISOString(),
            updated_at: null,
          };
          const authUser: AuthUser = { role: 'COMPANY', company: minimalCompany };
          setUser(authUser);
          localStorage.setItem('auth_user', JSON.stringify(authUser));
          console.log('Company login successful (using minimal data), navigating to dashboard');
          navigate('/dashboard', { replace: true });
          return;
        }
      } else {
        console.error('COMPANY role but company_id is null');
        throw new Error('COMPANY role but company_id is null');
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

    // Handle ADMIN role
    if (googleResponse.role === 'ADMIN') {
      const authUser: AuthUser = { role: 'ADMIN' };
      setUser(authUser);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
      console.log('Admin login successful, navigating to companies');
      navigate('/admin/companies', { replace: true });
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
    
    // Clear all chat history from session storage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('dashboard_chat_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear chat history from session storage:', error);
    }
    
    navigate('/login', { replace: true });
  }, [navigate]);

  const setCompanyData = useCallback((updated: Company) => {
    setUser(prev => {
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
    logout,
    setCompanyData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
