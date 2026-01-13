import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  onMenuClick: () => void;
  isMenuOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, isMenuOpen }) => {
  const { user } = useAuth();
  const isCompany = user?.role === 'COMPANY';
  const isBlogger = user?.role === 'BLOGGER';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="mobile-header">
      <div className="mobile-header__content">
        <Link
          to={isAdmin ? '/admin/companies' : isCompany ? '/dashboard' : '/blogger/products'}
          className="mobile-header__logo"
        >
          Follox
        </Link>
        <button
          onClick={onMenuClick}
          className="mobile-header__menu-button"
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMenuOpen ? (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
