import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BloggerProductDetailed } from '../types';
import api from '../services/api';
import Spinner from '../components/Spinner';
import Button from '../components/Button';

const BloggerProductDetailsPage: React.FC = () => {
	const { productId } = useParams<{ productId: string }>();
	const navigate = useNavigate();
	const [product, setProduct] = useState<BloggerProductDetailed | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		if (!productId) return;
		try {
			setLoading(true);
			const products = await api.getProductsForMeDetailed();
			const foundProduct = products.find(p => p.id === parseInt(productId));
			if (foundProduct) {
				setProduct(foundProduct);
			} else {
				setError('Товар не найден.');
			}
		} catch (err) {
			setError('Не удалось загрузить данные товара.');
		} finally {
			setLoading(false);
		}
	}, [productId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	if (loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<Spinner size="large" />
			</div>
		);
	}

	if (error) {
		return <div className="text-center text-red-500">{error}</div>;
	}

	if (!product) {
		return <div className="text-center text-gray-500">Товар не найден.</div>;
	}

	return (
		<div>
			<div className="mb-6">
				<Button onClick={() => navigate('/blogger/products')} variant="secondary" size="sm">
					← Назад к списку
				</Button>
			</div>

			<div className="flex flex-col md:flex-row gap-8 mb-6">
				{product.image_url && (
					<div className="md:w-1/2">
						<img
							src={api.getImageUrl(product.image_url)}
							alt={product.name}
							className="w-full h-auto rounded-lg shadow-lg"
						/>
					</div>
				)}
				<div className={`${product.image_url ? 'md:w-1/2' : 'w-full'}`}>
					<h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
					<p className="text-lg text-gray-600 mb-4">₸{product.price.toFixed(2)}</p>
					{product.description && (
						<div className="mb-6">
							<h2 className="text-xl font-semibold text-gray-800 mb-2">Описание</h2>
							<p className="text-gray-700 leading-relaxed">{product.description}</p>
						</div>
					)}
					{product.blogger_task_description && (
						<div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
							<h2 className="text-xl font-semibold text-blue-900 mb-2">Задача от магазина</h2>
							<p className="text-blue-800 leading-relaxed">{product.blogger_task_description}</p>
						</div>
					)}
				</div>
			</div>

			<div className="mt-8 p-6 bg-gray-50 rounded-lg">
				<h2 className="text-xl font-semibold text-gray-800 mb-4">Партнёрская ссылка</h2>
				<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
					<a
						className="text-indigo-600 underline break-all flex-1"
						href={`${window.location.origin}/#/products/${product.affiliate_code}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						{`${window.location.origin}/#/products/${product.affiliate_code}`}
					</a>
					<Button
						onClick={() => {
							navigator.clipboard.writeText(`${window.location.origin}/#/products/${product.affiliate_code}`);
							alert('Ссылка скопирована в буфер обмена!');
						}}
						variant="secondary"
						size="sm"
					>
						Копировать
					</Button>
				</div>
			</div>
		</div>
	);
};

export default BloggerProductDetailsPage;

