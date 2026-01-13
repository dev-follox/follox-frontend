
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { useTranslation } from '../hooks/useTranslation';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1 className="not-found-content__code">404</h1>
        <p className="not-found-content__title">{t('notFound.title')}</p>
        <p className="not-found-content__message">
          {t('notFound.message')}
        </p>
        <div className="not-found-content__action">
          <Link to="/">
            <Button>{t('notFound.goHome')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
