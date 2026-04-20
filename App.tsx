
import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { IterationProvider } from './contexts/IterationContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { useAuth } from './hooks/useAuth';
import ProductLandingPage from './pages/ProductLandingPage';
import ShopDashboardPage from './pages/ShopDashboardPage';
import ShopProductDetailsPage from './pages/ShopProductDetailsPage';
import CompanyDesignersPage from './pages/CompanyDesignersPage';
import NotFoundPage from './pages/NotFoundPage';
import PublicLayout from './components/PublicLayout';
import MainLayout from './components/MainLayout';
import DesignerRegistrationPage from './pages/DesignerRegistrationPage';
import DesignerProductsPage from './pages/DesignerProductsPage';
import DesignerProductDetailsPage from './pages/DesignerProductDetailsPage';
import AuthPage from './pages/AuthPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import HomePage from './pages/HomePage';
import CompanyQAPage from './pages/CompanyQAPage';
import DecisionPage from './pages/DecisionPage';
import CompanyDashboardPage from './pages/CompanyDashboardPage';
import AdminCompaniesPage from './pages/AdminCompaniesPage';
import AdminCompanyDetailsPage from './pages/AdminCompanyDetailsPage';
import { useTranslation } from './hooks/useTranslation';
import { UserProfilePage } from './pages/UserProfilePage';
import CompanySalesPage from './pages/CompanySalesPage';
import DesignerInvitePage from './pages/DesignerInvitePage';
import DesignerCatalogPage from './pages/DesignerCatalogPage';
import DesignerCompanyCatalogPage from './pages/DesignerCompanyCatalogPage';
import DesignerAffiliateLinkDetailPage from './pages/DesignerAffiliateLinkDetailPage';
import CompanyAnalyticsProductsPage from './pages/CompanyAnalyticsProductsPage';
import CompanyAnalyticsProductDesignersPage from './pages/CompanyAnalyticsProductDesignersPage';
import CompanyAnalyticsDesignersPage from './pages/CompanyAnalyticsDesignersPage';
import CompanyAnalyticsDesignerProductsPage from './pages/CompanyAnalyticsDesignerProductsPage';

const RedirectDesignerProduct: React.FC = () => {
  const { productId } = useParams();
  return <Navigate to={`/designers/products/${productId ?? ''}`} replace />;
};

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
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/designers/register" element={<DesignerRegistrationPage />} />
        <Route path="/designers/invites/:token" element={<DesignerInvitePage />} />
        <Route path="/products/:code" element={<PublicLayout><ProductLandingPage /></PublicLayout>} />

        <Route path="/blogger/products" element={<Navigate to="/designers/products" replace />} />
        <Route path="/blogger/products/:productId" element={<RedirectDesignerProduct />} />
        <Route path="/blogger/telegram" element={<Navigate to="/designers/products" replace />} />
        <Route path="/blogger/register" element={<Navigate to="/designers/register" replace />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<CompanyDashboardPage />} />

            <Route path="/company/catalog" element={<ShopDashboardPage />} />
            <Route path="/company/products/:productId" element={<ShopProductDetailsPage />} />
            <Route path="/company/designers" element={<CompanyDesignersPage />} />
            <Route path="/company/sales" element={<CompanySalesPage />} />
            <Route path="/company/analytics/products" element={<CompanyAnalyticsProductsPage />} />
            <Route path="/company/analytics/products/:productId" element={<CompanyAnalyticsProductDesignersPage />} />
            <Route path="/company/analytics/designers" element={<CompanyAnalyticsDesignersPage />} />
            <Route path="/company/analytics/designers/:designerId" element={<CompanyAnalyticsDesignerProductsPage />} />
            <Route path="/company/bloggers" element={<Navigate to="/company/designers" replace />} />
            <Route path="/company/telegram" element={<Navigate to="/dashboard" replace />} />

            <Route path="/tools/qa" element={<CompanyQAPage />} />
            <Route path="/tools/hypothesis-generator" element={<DecisionPage variant="hypothesis_generator" />} />
            <Route path="/tools/custdev-target-planner" element={<DecisionPage variant="custdev_target_planner" />} />
            <Route path="/tools/custdev-interview-designer" element={<DecisionPage variant="custdev_interview_designer" />} />
            <Route path="/tools/custdev-insights-analyzer" element={<DecisionPage variant="custdev_insights_analyzer" />} />

            <Route path="/designers/catalog" element={<DesignerCatalogPage />} />
            <Route path="/designers/catalog/:companyId" element={<DesignerCompanyCatalogPage />} />
            <Route path="/designers/products" element={<DesignerProductsPage />} />
            <Route path="/designers/products/:productId" element={<DesignerProductDetailsPage />} />
            <Route path="/designers/links/:linkId" element={<DesignerAffiliateLinkDetailPage />} />
            <Route path="/designers/telegram" element={<Navigate to="/designers/products" replace />} />

            <Route path="/admin/companies" element={<AdminCompaniesPage />} />
            <Route path="/admin/companies/:companyId" element={<AdminCompanyDetailsPage />} />

            <Route path="/profile" element={<UserProfilePage />} />
          </Route>
        </Route>

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
