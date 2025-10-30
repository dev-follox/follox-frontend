import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from './Button';
import Dialog from './Dialog';
import Input from './Input';
import api from '@/services/api';
import Card from './Card';

const Header: React.FC = () => {
	const { isLoggedIn, logout, shop } = useAuth();

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [chatId, setChatId] = useState<string>('');
	const [linkLoading, setLinkLoading] = useState(false);
	const [error, setError] = useState('');

	const handleOpenLinkTelegramDialog = () => {
		setChatId('');
		setIsDialogOpen(true);
	};

	const handleSubmitLink = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!chatId.trim()) {
			setError('Chat ID is required');
			return;
		}
		setLinkLoading(true);
		setError('');
		try {
			const updated = await api.linkTelegram(shop.id, chatId.trim());
			setIsDialogOpen(false);
		} catch (err) {
			setError('Failed to link Telegram. Please verify the Chat ID.');
		} finally {
			setLinkLoading(false);
		}
	};

	return (
		<>
			<header className="bg-white shadow-md">
				<nav className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
					<div className="flex items-center space-x-4">
						<Link to={isLoggedIn ? '/shop/dashboard' : '/'} className="text-2xl font-bold text-gray-800">
							Follox
						</Link>
						{isLoggedIn && shop && (
									<span className="text-gray-600 hidden sm:block">Добро пожаловать, {shop.name}</span>
						)}
					</div>
					<div className="flex items-center space-x-4">
						{isLoggedIn && shop && (
							<>
								<div className="flex items-center space-x-4">
									<Link to="/shop/dashboard" className="text-gray-600 hover:text-gray-900">
										Товары
									</Link>
									<Link to="/shop/bloggers" className="text-gray-600 hover:text-gray-900">
										Блогеры
									</Link>
									<Button onClick={handleOpenLinkTelegramDialog}>Прикрепить Telegram</Button>
									<Button onClick={logout} variant="secondary">
										Выйти
									</Button>
								</div>
							</>
						)}
					</div>
				</nav>
			</header>
			{isDialogOpen && (
				<Dialog
					isOpen={isDialogOpen}
					onClose={() => setIsDialogOpen(false)}
							title="Привязать Telegram"
					onSubmit={handleSubmitLink}
				>
					<div
						className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md"
						role="alert"
					>
						<>
							<p className="font-bold">Чтобы получать уведомления о заказах в Telegram:</p>
							<ol className="list-decimal list-inside space-y-1">
								<li>
									Откройте Telegram‑бота{' '}
									<a
										href="https://t.me/folloxKzBot"
										target="_blank"
										rel="noopener noreferrer"
										className="text-indigo-600 underline hover:text-indigo-800 font-medium"
									>
										https://t.me/folloxKzBot
									</a>
									.
								</li>
								<li>
									Запустите бота.
								</li>
								<li>Скопируйте Chat ID и вставьте его в поле ниже.</li>
							</ol>
						</>
					</div>
					{error && <div className="text-red-600 text-sm">{error}</div>}
					<Input
						id="telegram_chat_id"
							label="Chat ID"
							placeholder=""
						value={chatId}
						onChange={e => setChatId(e.target.value)}
					/>
				</Dialog>
			)}
		</>
	);
};

export default Header;
