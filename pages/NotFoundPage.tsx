
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { useTranslation } from '../hooks/useTranslation';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="h-full w-full flex items-center justify-center p-4">
    <div className="text-center">
      <h1 className="text-6xl font-extrabold text-primary">404</h1>
      <p className="text-2xl font-semibold text-gray-800 mt-4">{t('notFound.title')}</p>
      <p className="text-gray-600 mt-2">
        {t('notFound.message')}
      </p>
      <div className="mt-6">
        <Link to="/">
          <Button>{t('notFound.goHome')}</Button>
        </Link>
      </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
