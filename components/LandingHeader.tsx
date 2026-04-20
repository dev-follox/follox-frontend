import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSwitcher from './LanguageSwitcher';
import { Play } from 'lucide-react';

interface LandingHeaderProps {
  transparent?: boolean;
  /** Opens the interactive demo modal (e.g. from HomePage). */
  onTryDemo?: () => void;
}

const LandingHeader: React.FC<LandingHeaderProps> = ({ transparent = false, onTryDemo }) => {
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
              {onTryDemo ? (
                <button
                  type="button"
                  onClick={onTryDemo}
                  className="landing-header__link landing-header__cta inline-flex items-center gap-2 rounded-lg"
                >
                  <Play className="h-4 w-4" />
                  {t('landing.header.tryDemo')}
                </button>
              ) : (
                <Link
                  to="/login"
                  className="landing-header__link landing-header__cta inline-flex items-center gap-2 rounded-lg"
                >
                  <Play className="h-4 w-4" />
                  {t('landing.header.tryDemo')}
                </Link>
              )}
            </>
          )}
          <div className="landing-header__language">
            <LanguageSwitcher />
          </div>
        </nav>
      </div>
    </header>
  );
};

export default LandingHeader;
