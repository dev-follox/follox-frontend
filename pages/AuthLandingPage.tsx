import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';

const AuthLandingPage: React.FC = () => {
	return (
		<div className="max-w-4xl mx-auto">
			<h1 className="text-3xl font-bold text-gray-900 text-center mb-8">Добро пожаловать в Follox</h1>
			<p className="text-center text-gray-600 mb-10">Выберите, как вы хотите продолжить</p>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card className="p-6 flex flex-col">
					<h2 className="text-xl font-semibold text-gray-800">Я магазин</h2>
					<p className="text-gray-600 mt-2 flex-grow">
						Создайте аккаунт магазина, добавляйте товары и отслеживайте заказы.
					</p>
					<div className="mt-6 flex gap-3">
						<Link to="/shop/register">
							<Button>Зарегистрироваться</Button>
						</Link>
					</div>
				</Card>
				<Card className="p-6 flex flex-col">
					<h2 className="text-xl font-semibold text-gray-800">Я блогер</h2>
					<p className="text-gray-600 mt-2 flex-grow">
						Создайте аккаунт блогера и получайте партнёрские ссылки.
					</p>
					<div className="mt-6 flex gap-3">
						<Link to="/blogger/register">
							<Button>Зарегистрироваться</Button>
						</Link>
					</div>
				</Card>
			</div>
			<div className="text-center mt-4">
				<Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
					Уже есть аккаунт? Войти
				</Link>
			</div>
		</div>
	);
};

export default AuthLandingPage;
