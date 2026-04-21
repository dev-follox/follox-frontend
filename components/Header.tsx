import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { LayoutDashboard, Package, Users, ShoppingCart, ChevronDown, User as UserIcon, BarChart2 } from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isCompany = user?.role === 'COMPANY';
  const isDesigner = user?.role === 'DESIGNER';
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const isActive = (paths: string[]) => paths.some((p) => location.pathname.startsWith(p));

  const displayName =
    user?.company?.full_name ||
    user?.company?.company_name ||
    user?.designer?.name ||
    (isAdmin ? t('sidebar.admin') : null) ||
    'User';

  const navItems = isCompany
    ? [
        { to: '/dashboard', label: t('sidebar.dashboard'), icon: LayoutDashboard, active: isActive(['/dashboard']) },
        {
          to: '/company/catalog',
          label: t('sidebar.catalog'),
          icon: Package,
          active: isActive(['/company/catalog', '/company/products']),
        },
        { to: '/company/designers', label: t('sidebar.designers'), icon: Users, active: isActive(['/company/designers']) },
        { to: '/company/sales', label: t('sidebar.sales'), icon: ShoppingCart, active: isActive(['/company/sales']) },
        {
          to: '/company/analytics/products',
          label: t('sidebar.analyticsProducts'),
          icon: BarChart2,
          active: isActive(['/company/analytics/products']),
        },
        {
          to: '/company/analytics/designers',
          label: t('sidebar.analyticsDesigners'),
          icon: BarChart2,
          active: isActive(['/company/analytics/designers']),
        },
      ]
    : isDesigner
      ? [
          {
            to: '/designers/catalog',
            label: t('sidebar.designerCatalog'),
            icon: Package,
            active: isActive(['/designers/catalog']),
          },
          {
              to: '/designers/dashboard',
            label: t('sidebar.designerMyLinks'),
            icon: LayoutDashboard,
            active: isActive(['/designers/dashboard', '/designers/links']),
          },
        ]
      : [{ to: '/admin/companies', label: t('sidebar.companies'), icon: Users, active: isActive(['/admin/companies']) }];

  return (
    <header className="landing-header landing-header--main">
      <div className="landing-header__inner">
        <Link
            to={isAdmin ? '/admin/companies' : isCompany ? '/dashboard' : '/designers/dashboard'}
          className="landing-header__logo"
        >
          <img src="/assets/logo.png" alt="Flipster" className="landing-header__logo-img" />
          Flipster
        </Link>

        <div className="landing-header__nav">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`landing-header__link inline-flex items-center gap-2 ${
                item.active ? 'landing-header__link--active' : ''
              }`}
            >
              <item.icon className="h-4 w-4" strokeWidth={1.5} />
              <span>{item.label}</span>
            </Link>
          ))}

          <div className="landing-header__language relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="landing-header__link inline-flex items-center gap-2"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <div className="flex h-8 w-8 items-center justify-center bg-primary/10 text-sm font-semibold text-primary">
                <UserIcon className="h-4 w-4" />
              </div>
              <ChevronDown className="h-4 w-4 text-secondary-alpha" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 min-w-[220px] border border-border bg-card py-1 shadow-lg z-50" role="menu">
                <div className="px-4 py-2 text-sm text-foreground border-b border-border">{displayName}</div>
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-secondary-alpha transition-colors hover:bg-foreground/5 hover:text-foreground"
                  onClick={() => setMenuOpen(false)}
                >
                  {t('sidebar.userProfile')}
                </Link>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-secondary-alpha transition-colors hover:bg-foreground/5 hover:text-foreground"
                  onClick={() => {
                    setLanguage(language === 'ru' ? 'en' : 'ru');
                    setMenuOpen(false);
                  }}
                >
                  {t('sidebar.switchLanguage')} ({language.toUpperCase()})
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-secondary-alpha transition-colors hover:bg-foreground/5 hover:text-foreground"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                >
                  {t('common.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
