import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import Button from './Button';
import Dialog from './Dialog';
import Input from './Input';
import LanguageSwitcher from './LanguageSwitcher';
import api from '@/services/api';
import Card from './Card';

const Header: React.FC = () => {
	const { isLoggedIn, logout, user } = useAuth();
	const { t } = useTranslation();
	const location = useLocation();

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [chatId, setChatId] = useState<string>('');
	const [linkLoading, setLinkLoading] = useState(false);
	const [error, setError] = useState('');
	const [linkSuccess, setLinkSuccess] = useState(false);

	const handleOpenLinkTelegramDialog = () => {
		setChatId('');
		setIsDialogOpen(true);
		setLinkSuccess(false);
	};

	const handleSubmitLink = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!chatId.trim()) {
			setError(t('telegram.chatIdRequired'));
			return;
		}
		setLinkLoading(true);
		setError('');
		try {
			if (user?.role === 'COMPANY' && user.company) {
				await api.linkTelegram(user.company.id, chatId.trim());
				setLinkSuccess(true);
			}
		} catch (err) {
			setError(t('telegram.linkError'));
		} finally {
			setLinkLoading(false);
		}
	};

	return (
		<>
			<header className="bg-white shadow-md">
				<nav className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
					<div className="flex items-center space-x-4">
						{isLoggedIn && user?.role === 'COMPANY' && user.company && (
							<span className="text-gray-600 hidden sm:block">{t('common.welcome')}, {user.company.company_name}</span>
						)}
					</div>
					<div className="flex items-center space-x-4">
						{isLoggedIn && user?.role === 'BLOGGER' && (
							<>
								<LanguageSwitcher />
								<Button onClick={logout} variant="secondary">{t('common.logout')}</Button>
							</>
						)}
					</div>
				</nav>
			</header>
			{isDialogOpen && (
				<Dialog
					isOpen={isDialogOpen}
					onClose={() => setIsDialogOpen(false)}
					title={t('telegram.linkTitle')}
					onSubmit={handleSubmitLink}
					actions={linkSuccess
						? [
							{
								label: t('common.close'),
								variant: 'secondary',
								onClick: () => {
									setIsDialogOpen(false);
									setLinkSuccess(false);
								},
							},
						]
						: [
							{ label: t('common.cancel'), variant: 'secondary', onClick: () => setIsDialogOpen(false) },
							{ label: t('telegram.linkTitle'), variant: 'primary', type: 'submit' },
						]}
				>
					<div
						className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md"
						role="alert"
					>
						<>
							<p className="font-bold">{t('telegram.instructions')}</p>
							<ol className="list-decimal list-inside space-y-1">
								<li>
									{t('telegram.step1')}{' '}
									<a
										href="https://t.me/folloxKzBot"
										target="_blank"
										rel="noopener noreferrer"
										className="text-primary-text underline hover:text-primary-text-600 font-medium"
									>
										https://t.me/folloxKzBot
									</a>
									.
								</li>
								<li>
									{t('telegram.step2')}
								</li>
								<li>{t('telegram.step3')}</li>
							</ol>
						</>
					</div>
					{linkSuccess && (
						<div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md" role="alert">
							<p className="font-bold">{t('telegram.linked')}</p>
							<p>{t('telegram.linkedMessage')}</p>
						</div>
					)}
					{error && <div className="text-red-600 text-sm">{error}</div>}
					<Input
						id="telegram_chat_id"
						label={t('telegram.chatId')}
						placeholder={t('telegram.chatIdPlaceholder')}
						value={chatId}
						onChange={e => setChatId(e.target.value)}
					/>
				</Dialog>
			)}
		</>
	);
};

export default Header;
