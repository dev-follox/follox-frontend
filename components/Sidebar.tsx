import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import Button from './Button';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
	const { isLoggedIn, user, logout } = useAuth();
	const { t, language, setLanguage } = useTranslation();
	const location = useLocation();
	const navigate = useNavigate();

	const toggleLanguage = () => {
		setLanguage(language === 'ru' ? 'en' : 'ru');
	};

	const handleLinkClick = () => {
		if (onClose) {
			onClose();
		}
	};

	if (!isLoggedIn || (user?.role !== 'COMPANY' && user?.role !== 'BLOGGER')) {
		return null;
	}

	const isActive = (path: string) => {
		return location.pathname.startsWith(path);
	};

	const isCompany = user?.role === 'COMPANY';
	const isBlogger = user?.role === 'BLOGGER';

	return (
    <>
      {/* Mobile overlay - only show on mobile when menu is open */}
      <div
        className={`sidebar-overlay ${isOpen ? 'sidebar-overlay--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={`sidebar ${isOpen ? 'sidebar--open' : 'sidebar--closed'}`}>
			{/* Follox Logo/Name */}
			<div className="p-6 border-b border-gray-200">
				<Link
					to={isCompany ? '/dashboard' : '/blogger/products'}
					className="text-2xl font-bold text-gray-800 hover:text-primary"
				>
					Follox
				</Link>
			</div>
			<div className="px-6 pt-4 flex items-center space-x-4">
				{isLoggedIn && user?.role === 'COMPANY' && user.company && (
					<span className="text-primary-text hidden sm:block">
						{t('common.welcome')}, {user.company.company_name}
					</span>
				)}
			</div>

			{/* Navigation */}
			<div className="flex-1 overflow-y-auto py-4">
				{/* Dashboard - Only for COMPANY */}
				{isCompany && (
					<div className="px-4 mb-4">
						<Link
							to="/dashboard"
							onClick={handleLinkClick}
							className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
								location.pathname === '/dashboard'
									? 'bg-primary text-primary-text'
									: 'text-gray-700 hover:bg-gray-100'
							}`}
						>
							{t('sidebar.dashboard')}
						</Link>
					</div>
				)}

				{/* GTM Strategy Generation Module - Only for COMPANY */}
				{isCompany && (
					<div className="px-4 mb-4">
						<div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-4">
							{t('sidebar.gtmStrategy')}
						</div>
						<div className="space-y-0.5 ml-2 border-l-2 border-gray-200 pl-2">
							{/* Answers Tab - Nested */}
							<Link
								to="/gtm/qa"
								onClick={handleLinkClick}
								className={`flex items-center pl-6 pr-4 py-2 rounded-md text-sm transition-colors ${
									isActive('/gtm/qa') ? 'bg-primary text-primary-text' : 'text-gray-700 hover:bg-gray-100'
								}`}
							>
								<span className={`mr-2 ${isActive('/gtm/qa') ? 'text-primary-text' : 'text-gray-400'}`}>
									└
								</span>
								<span>{t('sidebar.answers')}</span>
							</Link>

							{/* Strategy Generation Tab - Nested */}
							<Link
								to="/gtm/strategy"
								onClick={handleLinkClick}
								className={`flex items-center pl-6 pr-4 py-2 rounded-md text-sm transition-colors ${
									isActive('/gtm/strategy')
										? 'bg-primary text-primary-text'
										: 'text-gray-700 hover:bg-gray-100'
								}`}
							>
								<span className={`mr-2 ${isActive('/gtm/strategy') ? 'text-primary-text' : 'text-gray-400'}`}>
									└
								</span>
								<span>{t('sidebar.strategyGeneration')}</span>
							</Link>
						</div>
					</div>
				)}

				{/* Affiliate Sales Module */}
				<div className="px-4 mb-4">
					<div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-4">
						{t('sidebar.affiliateSales')}
					</div>
					<div className="space-y-0.5 ml-2 border-l-2 border-gray-200 pl-2">
						{/* Products Tab - Nested */}
						<Link
							to={isCompany ? '/company/dashboard' : '/blogger/products'}
							onClick={handleLinkClick}
							className={`flex items-center pl-6 pr-4 py-2 rounded-md text-sm transition-colors ${
								(isCompany && (isActive('/company/dashboard') || isActive('/company/products'))) ||
								(isBlogger && isActive('/blogger/products'))
									? 'bg-primary text-primary-text'
									: 'text-gray-700 hover:bg-gray-100'
							}`}
						>
							<span
								className={`mr-2 ${
									(isCompany && (isActive('/company/dashboard') || isActive('/company/products'))) ||
									(isBlogger && isActive('/blogger/products'))
										? 'text-primary-text'
										: 'text-gray-400'
								}`}
							>
								└
							</span>
							<span>{t('sidebar.products')}</span>
						</Link>

						{/* Bloggers Tab - Only for COMPANY, Nested */}
						{isCompany && (
							<Link
								to="/company/bloggers"
								onClick={handleLinkClick}
								className={`flex items-center pl-6 pr-4 py-2 rounded-md text-sm transition-colors ${
									isActive('/company/bloggers')
										? 'bg-primary text-primary-text'
										: 'text-gray-700 hover:bg-gray-100'
								}`}
							>
								<span
									className={`mr-2 ${isActive('/company/bloggers') ? 'text-primary-text' : 'text-gray-400'}`}
								>
									└
								</span>
								<span>{t('sidebar.bloggers')}</span>
							</Link>
						)}
					</div>
				</div>
			</div>

			{/* Bottom Section */}
			<div className="border-t border-gray-200 p-4 space-y-2">
				{/* Language Switcher */}
				<button
					onClick={toggleLanguage}
					className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
					title={t('sidebar.switchLanguage')}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span>{language.toUpperCase()}</span>
				</button>

				{/* Logout */}
				<Button onClick={logout} variant="secondary" className="w-full">
					{t('common.logout')}
				</Button>
			</div>
		</div>
    </>
	);
};

export default Sidebar;
