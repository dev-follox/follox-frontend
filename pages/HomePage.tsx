import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSwitcher from '../components/LanguageSwitcher';

const HomePage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="auth-landing-container">
      <div className="max-w-4xl w-full">
        <div className="mb-8 text-center">
          <div className="flex justify-end mb-4">
            <LanguageSwitcher />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('home.title')}</h1>
          <p className="text-lg text-gray-600">{t('home.subtitle')}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-8 flex flex-col hover:shadow-xl transition-shadow">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">{t('home.affiliateSales.title')}</h2>
              <p className="text-gray-600">
                {t('home.affiliateSales.description')}
              </p>
            </div>
            <div className="mt-auto pt-4">
              <Link to="/login">
                <Button className="w-full">{t('home.goToModule')}</Button>
              </Link>
            </div>
          </Card>

          <Card className="p-8 flex flex-col hover:shadow-xl transition-shadow">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">{t('home.gtmStrategy.title')}</h2>
              <p className="text-gray-600">
                {t('home.gtmStrategy.description')}
              </p>
            </div>
            <div className="mt-auto pt-4">
              <Link to="/login">
                <Button className="w-full">{t('home.goToModule')}</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
