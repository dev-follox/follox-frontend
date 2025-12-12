
import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
// FIX: The useAuth hook is exported from './hooks/useAuth', not from './contexts/AuthContext'.
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import ProductLandingPage from './pages/ProductLandingPage';
import ShopRegistrationPage from './pages/ShopRegistrationPage';
import ShopDashboardPage from './pages/ShopDashboardPage';
import ShopProductDetailsPage from './pages/ShopProductDetailsPage';
import BloggersPage from './pages/BloggersPage';
import NotFoundPage from './pages/NotFoundPage';
import Header from './components/Header';
import PublicLayout from './components/PublicLayout';
import BloggerRegistrationPage from './pages/BloggerRegistrationPage';
import BloggerProductsDetailedPage from './pages/BloggerProductsDetailedPage';
import BloggerProductDetailsPage from './pages/BloggerProductDetailsPage';
import AuthPage from './pages/AuthPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import OAuthRedirectHandler from './components/OAuthRedirectHandler';

const ProtectedRoute: React.FC = () => {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }
  return isLoggedIn ? <Outlet /> : <Navigate to="/" replace state={{ from: location }} />;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const hideHeader = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/auth/callback';
  
  return (
    <>
      <OAuthRedirectHandler />
      {!hideHeader && <Header />}
      <Routes>
            {/* Public Routes */}
            <Route path="/" element={<AuthPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/products/:code" element={<PublicLayout><ProductLandingPage /></PublicLayout>} />
            
            <Route path="/shop/register" element={<ShopRegistrationPage />} />
            <Route path="/blogger/register" element={<BloggerRegistrationPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              {/* Shop */}
              <Route path="/shop/dashboard" element={<ShopDashboardPage />} />
              <Route path="/shop/products/:productId" element={<ShopProductDetailsPage />} />
              <Route path="/shop/bloggers" element={<BloggersPage />} />
              {/* Blogger */}
              <Route path="/blogger/products" element={<BloggerProductsDetailedPage />} />
              <Route path="/blogger/products/:productId" element={<BloggerProductDetailsPage />} />
            </Route>

            {/* Not Found Route */}
            <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
