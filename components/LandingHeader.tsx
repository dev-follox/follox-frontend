import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSwitcher from './LanguageSwitcher';
import Button from './Button';
import { Play } from 'lucide-react';

interface LandingHeaderProps {
  onTryForFree: () => void;
  transparent?: boolean;
}

const LandingHeader: React.FC<LandingHeaderProps> = ({ onTryForFree, transparent = false }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const isHomePage = location.pathname === '/' || location.pathname === '/home';

  return (
    <header className={`landing-header ${transparent ? 'landing-header--transparent' : ''}`}>
      <div className="landing-header__inner">
        <Link to="/" className="landing-header__logo">
          <img src="/assets/logo.png" alt="Follox" className="landing-header__logo-img" />
          Flipster
        </Link>
        <nav className="landing-header__nav">
          {!transparent && (
            <>
          <Link 
            to="/" 
            className={`landing-header__link ${isHomePage ? 'landing-header__link--active' : ''}`}
          >
            {t('landing.header.home')}
          </Link>
          <Link to="/login" className="landing-header__link">
            {t('landing.header.logIn')}
          </Link>
          <Button
            type="button"
            variant="secondary"
            onClick={onTryForFree}
            className="landing-header__cta"
            icon={<Play className="h-4 w-4" />}
          >
            {t('landing.header.tryDemo')}
          </Button>
          </>)
          }
          <div className="landing-header__language">
            <LanguageSwitcher />
          </div>
        </nav>
      </div>
    </header>
  );
};

export default LandingHeader;
