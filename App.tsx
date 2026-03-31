
import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { IterationProvider } from './contexts/IterationContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { useAuth } from './hooks/useAuth';
import ProductLandingPage from './pages/ProductLandingPage';
import ShopRegistrationPage from './pages/ShopRegistrationPage';
import ShopDashboardPage from './pages/ShopDashboardPage';
import ShopProductDetailsPage from './pages/ShopProductDetailsPage';
import BloggersPage from './pages/BloggersPage';
import NotFoundPage from './pages/NotFoundPage';
import PublicLayout from './components/PublicLayout';
import MainLayout from './components/MainLayout';
import BloggerRegistrationPage from './pages/BloggerRegistrationPage';
import BloggerProductsDetailedPage from './pages/BloggerProductsDetailedPage';
import BloggerProductDetailsPage from './pages/BloggerProductDetailsPage';
import AuthPage from './pages/AuthPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import HomePage from './pages/HomePage';
import CompanyQAPage from './pages/CompanyQAPage';
import DecisionPage from './pages/DecisionPage';
import DashboardPage from './pages/DashboardPage';
import AdminCompaniesPage from './pages/AdminCompaniesPage';
import AdminCompanyDetailsPage from './pages/AdminCompanyDetailsPage';
import { useTranslation } from './hooks/useTranslation';
import { UserProfilePage } from './pages/UserProfilePage';

const ProtectedRoute: React.FC = () => {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  if (loading) {
    return <div>{t('common.loading')}</div>;
  }
  return isLoggedIn ? <Outlet /> : <Navigate to="/" replace state={{ from: location }} />;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/products/:code" element={<PublicLayout><ProductLandingPage /></PublicLayout>} />
        
        <Route path="/company/register" element={<ShopRegistrationPage />} />
        <Route path="/blogger/register" element={<BloggerRegistrationPage />} />

        {/* Protected Routes with Sidebar Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            {/* Dashboard - Company only */}
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* Company - Affiliate Sales Module */}
            <Route path="/company/dashboard" element={<ShopDashboardPage />} />
            <Route path="/company/products/:productId" element={<ShopProductDetailsPage />} />
            <Route path="/company/bloggers" element={<BloggersPage />} />
            
            {/* Tools Module - Company only */}
            <Route path="/tools/qa" element={<CompanyQAPage />} />
            <Route path="/tools/hypothesis-generator" element={<DecisionPage variant="hypothesis_generator" />} />
            <Route path="/tools/custdev-target-planner" element={<DecisionPage variant="custdev_target_planner" />} />
            <Route path="/tools/custdev-interview-designer" element={<DecisionPage variant="custdev_interview_designer" />} />
            <Route path="/tools/custdev-insights-analyzer" element={<DecisionPage variant="custdev_insights_analyzer" />} />
            
            {/* Blogger routes */}
            <Route path="/blogger/products" element={<BloggerProductsDetailedPage />} />
            <Route path="/blogger/products/:productId" element={<BloggerProductDetailsPage />} />
            
            {/* Admin routes */}
            <Route path="/admin/companies" element={<AdminCompaniesPage />} />
            <Route path="/admin/companies/:companyId" element={<AdminCompanyDetailsPage />} />

            {/* User profile routes */}
            <Route path="/profile" element={<UserProfilePage />} />
          </Route>
        </Route>

        {/* Not Found Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <IterationProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </IterationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
