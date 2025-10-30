
import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
// FIX: The useAuth hook is exported from './hooks/useAuth', not from './contexts/AuthContext'.
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import ProductLandingPage from './pages/ProductLandingPage';
import ShopLoginPage from './pages/ShopLoginPage';
import ShopRegistrationPage from './pages/ShopRegistrationPage';
import ShopDashboardPage from './pages/ShopDashboardPage';
import ShopProductDetailsPage from './pages/ShopProductDetailsPage';
import BloggersPage from './pages/BloggersPage';
import NotFoundPage from './pages/NotFoundPage';
import Header from './components/Header';
import PublicLayout from './components/PublicLayout';
import BloggerRegistrationPage from './pages/BloggerRegistrationPage';
import BloggerProductsDetailedPage from './pages/BloggerProductsDetailedPage';
import AuthLandingPage from './pages/AuthLandingPage';

const ProtectedRoute: React.FC = () => {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto p-4 md:p-8">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<AuthLandingPage />} />
            <Route path="/products/:code" element={<PublicLayout><ProductLandingPage /></PublicLayout>} />
            
            <Route path="/login" element={<ShopLoginPage />} />
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
            </Route>

            {/* Not Found Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
};

export default App;
