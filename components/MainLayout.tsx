import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import { useAuth } from '../hooks/useAuth';
import { isCompanySubscriptionActive } from '../utils/companySubscription';
import { useTranslation } from '../hooks/useTranslation';

const MainLayout: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const company = user?.role === 'COMPANY' ? user.company : null;
  const showInactiveBanner = user?.role === 'COMPANY' && !isCompanySubscriptionActive(company);

  return (
    <div className="main-layout">
      <Header />
      {showInactiveBanner && (
        <div className="border-b border-warning/40 bg-warning/10 px-4 py-2 text-center text-sm text-foreground">
          {t('subscription.readOnlyNotice')}
        </div>
      )}
      <div className="main-layout__content">
        <main className="main-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
