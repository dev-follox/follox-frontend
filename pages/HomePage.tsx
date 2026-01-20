import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSwitcher from '../components/LanguageSwitcher';

const HomePage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="home-container">
      <div className="container container--lg">
        <div className="home-header">
          <div className="home-header__language-switcher">
            <LanguageSwitcher />
          </div>
          <h1 className="home-header__title">{t('home.title')}</h1>
          <p className="home-header__subtitle">{t('home.subtitle')}</p>
        </div>
        
        <div className="home-modules">
          <Card className="home-module-card">
            <div className="home-module-card__content">
              <h2 className="home-module-card__title">{t('home.affiliateSales.title')}</h2>
              <p className="home-module-card__description">
                {t('home.affiliateSales.description')}
              </p>
            </div>
            <div className="home-module-card__action">
              <Link 
                to="/login"
                onClick={() => localStorage.setItem('selectedModule', 'affiliateSales')}
              >
                <Button className="w-full">{t('home.goToModule')}</Button>
              </Link>
            </div>
          </Card>

          <Card className="home-module-card">
            <div className="home-module-card__content">
              <h2 className="home-module-card__title">{t('home.decisions.title')}</h2>
              <p className="home-module-card__description">
                {t('home.decisions.description')}
              </p>
            </div>
            <div className="home-module-card__action">
              <Link 
                to="/login"
                onClick={() => localStorage.setItem('selectedModule', 'decisions')}
              >
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
