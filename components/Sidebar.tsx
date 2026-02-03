import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import api from '../services/api';
import type { CompanyAnswers } from '../types';

// QnA fields used for progress (must match dashboard/company QA)
const QNA_FIELDS: { section: keyof CompanyAnswers['answers']; field: string }[] = [
  { section: 'product', field: 'name' }, { section: 'product', field: 'description' }, { section: 'product', field: 'category' }, { section: 'product', field: 'stage' },
  { section: 'market', field: 'target_market' }, { section: 'market', field: 'geography' }, { section: 'market', field: 'alternatives' },
  { section: 'customer', field: 'role' }, { section: 'customer', field: 'company_stage' }, { section: 'customer', field: 'team_size' },
  { section: 'problem', field: 'main_pain' }, { section: 'problem', field: 'frequency' }, { section: 'problem', field: 'current_solution' },
  { section: 'solution', field: 'core_value' }, { section: 'solution', field: 'differentiator' },
  { section: 'distribution', field: 'known_channels' }, { section: 'distribution', field: 'preferred_channel' },
  { section: 'pricing', field: 'model' }, { section: 'pricing', field: 'expected_price' },
  { section: 'traction', field: 'users' }, { section: 'traction', field: 'revenue' }, { section: 'traction', field: 'signals' },
  { section: 'constraints', field: 'budget' }, { section: 'constraints', field: 'time' }, { section: 'constraints', field: 'team' },
];

function getQnaFilledPercent(answers: CompanyAnswers['answers']): number {
  let filled = 0;
  for (const { section, field } of QNA_FIELDS) {
    const sectionData = answers[section];
    if (!sectionData) continue;
    const value = (sectionData as Record<string, unknown>)[field];
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && value.trim().length > 0) filled++;
    else if (Array.isArray(value) && value.length > 0) filled++;
    else if (typeof value === 'number' && !Number.isNaN(value)) filled++;
  }
  return QNA_FIELDS.length === 0 ? 0 : Math.round((filled / QNA_FIELDS.length) * 100);
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
	const { isLoggedIn, user, logout } = useAuth();
	const { t, language, setLanguage } = useTranslation();
	const location = useLocation();
	const navigate = useNavigate();
	const [userMenuOpen, setUserMenuOpen] = useState(false);
	const userMenuRef = useRef<HTMLDivElement>(null);
	const [qnaPercent, setQnaPercent] = useState<number | null>(null);

	const fetchQnaPercent = React.useCallback(() => {
		if (user?.role !== 'COMPANY' || !user?.company?.id) return;
		api.getCompanyAnswers(user.company.id).then((data) => {
			if (data?.answers) setQnaPercent(getQnaFilledPercent(data.answers));
		}).catch(() => setQnaPercent(null));
	}, [user?.role, user?.company?.id]);

	useEffect(() => {
		if (user?.role !== 'COMPANY' || !user?.company?.id) {
			setQnaPercent(null);
			return;
		}
		let cancelled = false;
		api.getCompanyAnswers(user.company.id).then((data) => {
			if (!cancelled && data?.answers) setQnaPercent(getQnaFilledPercent(data.answers));
		}).catch(() => {
			if (!cancelled) setQnaPercent(null);
		});
		return () => { cancelled = true; };
	}, [user?.role, user?.company?.id]);

	useEffect(() => {
		const onAnswersUpdated = () => fetchQnaPercent();
		window.addEventListener('company-answers-updated', onAnswersUpdated);
		return () => window.removeEventListener('company-answers-updated', onAnswersUpdated);
	}, [fetchQnaPercent]);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
				setUserMenuOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const toggleLanguage = () => {
		setLanguage(language === 'ru' ? 'en' : 'ru');
	};

	const handleLinkClick = () => {
		if (onClose) {
			onClose();
		}
	};

	if (!isLoggedIn || (user?.role !== 'COMPANY' && user?.role !== 'BLOGGER' && user?.role !== 'ADMIN')) {
		return null;
	}

	const isActive = (path: string) => {
		return location.pathname.startsWith(path);
	};

	const isCompany = user?.role === 'COMPANY';
	const isBlogger = user?.role === 'BLOGGER';
	const isAdmin = user?.role === 'ADMIN';

	const displayName =
		user?.company?.full_name ||
		user?.company?.company_name ||
		user?.blogger?.name ||
		(isAdmin ? t('sidebar.admin') : null) ||
		'User';

	const profilePath = '/profile';

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
					to={isAdmin ? '/admin/companies' : isCompany ? '/dashboard' : '/blogger/products'}
					className="sidebar__logo flex items-center gap-2 text-2xl font-bold text-gray-800 hover:text-primary-text"
				>
					<img src="/assets/logo.png" alt="Follox" className="sidebar__logo-img" />
					Follox
				</Link>
			</div>

			{/* Navigation */}
			<div className="flex-1 overflow-y-auto py-4">
				{/* Admin Module - Only for ADMIN */}
				{isAdmin && (
					<div className="px-4 mb-4">
						<div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-4">
							{t('sidebar.admin')}
						</div>
						<div className="space-y-0.5 ml-2 border-l-2 border-gray-200 pl-2">
							<Link
								to="/admin/companies"
								onClick={handleLinkClick}
								className={`flex items-center pl-6 pr-4 py-2 rounded-md text-sm transition-colors ${
									isActive('/admin/companies')
										? 'bg-primary text-primary-text'
										: 'text-gray-700 hover:bg-gray-100'
								}`}
							>
								<span className={`mr-2 ${isActive('/admin/companies') ? 'text-primary-text' : 'text-gray-400'}`}>
									└
								</span>
								<span>{t('sidebar.companies')}</span>
							</Link>
						</div>
					</div>
				)}

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

				{/* Decisions Module - Only for COMPANY */}
				{isCompany && (
					<div className="px-4 mb-4">
						<div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-4">
							{t('sidebar.tools')}
						</div>
						<div className="space-y-0.5 ml-2 border-l-2 border-gray-200 pl-2">
							<Link
								to="/tools/icp-diagnostician"
								onClick={handleLinkClick}
								className={`flex items-center pl-6 pr-4 py-2 rounded-md text-sm transition-colors ${
									isActive('/tools/icp-diagnostician') ? 'bg-primary text-primary-text' : 'text-gray-700 hover:bg-gray-100'
								}`}
							>
								<span className={`mr-2 ${isActive('/tools/icp-diagnostician') ? 'text-primary-text' : 'text-gray-400'}`}>└</span>
								<span>{t('sidebar.icpDiagnostician')}</span>
							</Link>
							<Link
								to="/tools/positioning"
								onClick={handleLinkClick}
								className={`flex items-center pl-6 pr-4 py-2 rounded-md text-sm transition-colors ${
									isActive('/tools/positioning') ? 'bg-primary text-primary-text' : 'text-gray-700 hover:bg-gray-100'
								}`}
							>
								<span className={`mr-2 ${isActive('/tools/positioning') ? 'text-primary-text' : 'text-gray-400'}`}>└</span>
								<span>{t('sidebar.positioning')}</span>
							</Link>
							<Link
								to="/tools/channel-risk"
								onClick={handleLinkClick}
								className={`flex items-center pl-6 pr-4 py-2 rounded-md text-sm transition-colors ${
									isActive('/tools/channel-risk') ? 'bg-primary text-primary-text' : 'text-gray-700 hover:bg-gray-100'
								}`}
							>
								<span className={`mr-2 ${isActive('/tools/channel-risk') ? 'text-primary-text' : 'text-gray-400'}`}>└</span>
								<span>{t('sidebar.channelRisk')}</span>
							</Link>
							<Link
								to="/tools/experiment"
								onClick={handleLinkClick}
								className={`flex items-center pl-6 pr-4 py-2 rounded-md text-sm transition-colors ${
									isActive('/tools/experiment') ? 'bg-primary text-primary-text' : 'text-gray-700 hover:bg-gray-100'
								}`}
							>
								<span className={`mr-2 ${isActive('/tools/experiment') ? 'text-primary-text' : 'text-gray-400'}`}>└</span>
								<span>{t('sidebar.experiment')}</span>
							</Link>
							<Link
								to="/tools/decision-review"
								onClick={handleLinkClick}
								className={`flex items-center pl-6 pr-4 py-2 rounded-md text-sm transition-colors ${
									isActive('/tools/decision-review') ? 'bg-primary text-primary-text' : 'text-gray-700 hover:bg-gray-100'
								}`}
							>
								<span className={`mr-2 ${isActive('/tools/decision-review') ? 'text-primary-text' : 'text-gray-400'}`}>└</span>
								<span>{t('sidebar.decisionReview')}</span>
							</Link>
						</div>
					</div>
				)}

				{/* Affiliate Sales Module */}
				{/* {(isCompany || isBlogger) && <div className="px-4 mb-4">
					<div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-4">
						{t('sidebar.affiliateSales')}
					</div>
					<div className="space-y-0.5 ml-2 border-l-2 border-gray-200 pl-2">
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
				</div>} */}
			</div>

			{/* QnA progress widget - only for company */}
			{isCompany && qnaPercent !== null && (
				<div className="px-4 py-3">
					<div className="rounded-lg bg-gray-50 p-3">
						<div className="flex items-center justify-between gap-2 mb-1.5">
							<span className="text-xs font-medium text-gray-600">{t('sidebar.qnaProgress')}</span>
							<span className="text-xs font-semibold text-gray-800 tabular-nums">{qnaPercent}%</span>
						</div>
						<div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
							<div
								className="h-full rounded-full bg-primary transition-all duration-300"
								style={{ width: `${qnaPercent}%` }}
								role="progressbar"
								aria-valuenow={qnaPercent}
								aria-valuemin={0}
								aria-valuemax={100}
								aria-label={t('sidebar.qnaProgress')}
							/>
						</div>
					</div>
				</div>
			)}

			{/* Bottom Section */}
			<div className="border-t border-gray-200 p-4">
				{/* User menu dropdown */}
				<div className="relative w-full" ref={userMenuRef}>
					<button
						type="button"
						onClick={() => setUserMenuOpen((o) => !o)}
						className="w-full flex items-center justify-between gap-2 px-4 py-2 rounded-md text-sm font-medium text-primary-text hover:bg-gray-100 transition-colors text-left"
						aria-expanded={userMenuOpen}
						aria-haspopup="true"
					>
						<span className="truncate">{displayName}</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-4 w-4 flex-shrink-0 text-primary-text"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden
						>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					{userMenuOpen && (
						<div
							className="absolute bottom-full left-0 right-0 mb-1 py-1 bg-white border border-gray-200 rounded-md shadow-lg z-10"
							role="menu"
						>
							{profilePath && (
								<Link
									to={profilePath}
									onClick={() => {
										setUserMenuOpen(false);
										handleLinkClick();
									}}
									className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
									role="menuitem"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-4 w-4 text-gray-500"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
										/>
									</svg>
									<span>{t('sidebar.userProfile')}</span>
								</Link>
							)}
							<button
								type="button"
								onClick={() => {
									toggleLanguage();
									setUserMenuOpen(false);
								}}
								className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
								role="menuitem"
								title={t('sidebar.switchLanguage')}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-4 w-4 text-gray-500"
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
							<button
								type="button"
								onClick={() => {
									setUserMenuOpen(false);
									logout();
								}}
								className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
								role="menuitem"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-4 w-4 text-gray-500"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
									/>
								</svg>
								<span>{t('common.logout')}</span>
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
    </>
	);
};

export default Sidebar;
