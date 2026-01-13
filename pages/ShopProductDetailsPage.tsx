import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, Order, Analytics, OrderStatus } from '../types';
import api from '../services/api';
import Spinner from '../components/Spinner';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import ProductForm from '../components/ProductForm';
import { format } from 'date-fns';
import { useTranslation } from '../hooks/useTranslation';

type Tab = 'orders' | 'analytics';

const StatusBadge: React.FC<{ status: keyof typeof OrderStatus }> = ({ status }) => {
	const colorClasses = {
		waiting_to_process: 'bg-yellow-100 text-yellow-800',
		processed: 'bg-green-100 text-green-800',
		cancelled: 'bg-red-100 text-red-800'
	};
	return (
		<span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses[status]}`}>
			{OrderStatus[status]}
		</span>
	);
};

const ShopProductDetailsPage: React.FC = () => {
	const { t } = useTranslation();
	const { productId } = useParams<{ productId: string }>();
	const navigate = useNavigate();
	const [product, setProduct] = useState<Product | null>(null);
	const [orders, setOrders] = useState<Order[]>([]);
	const [analytics, setAnalytics] = useState<Analytics[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<Tab>('orders');
	const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

	const fetchData = useCallback(async () => {
		if (!productId) return;
		try {
			setLoading(true);
			const [productData, ordersData, analyticsData] = await Promise.all([
				api.getProduct(parseInt(productId)),
				api.getProductOrders(parseInt(productId)),
				api.getProductAnalytics(parseInt(productId))
			]);
			setProduct(productData);
			setOrders(ordersData);
			setAnalytics(analyticsData);
		} catch (err) {
			setError(t('productDetails.loadError'));
		} finally {
			setLoading(false);
		}
	}, [productId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleUpdateStatus = async (orderId: number, status: keyof typeof OrderStatus) => {
		setUpdatingOrderId(orderId);
		try {
			await api.updateOrderStatus(orderId, status);
			await fetchData(); // Refresh all data
		} catch (err) {
			alert(t('productDetails.statusUpdateError'));
		} finally {
			setUpdatingOrderId(null);
		}
	};

	const handleEditClick = () => {
		if (!product) return;
		setIsEditDialogOpen(true);
	};

	const handleUpdateProduct = async (data: {
		name: string;
		description?: string;
		blogger_task_description?: string;
		price: number;
		image_url?: string;
	}) => {
		if (!product) return;

		setIsUpdating(true);
		try {
			const updatedProduct = await api.updateProduct(product.id, {
				name: data.name,
				description: data.description || null,
				blogger_task_description: data.blogger_task_description || null,
				price: data.price,
				image_url: data.image_url || null
			});
			setProduct(updatedProduct);
			setIsEditDialogOpen(false);
		} catch (err) {
			alert(t('productDetails.updateError'));
		} finally {
			setIsUpdating(false);
		}
	};

	const handleDeleteClick = () => {
		setIsDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!product) return;

		setIsDeleting(true);
		try {
			await api.deleteProduct(product.id);
			navigate('/company/dashboard');
		} catch (err) {
			alert(t('productDetails.deleteError'));
			setIsDeleting(false);
			setIsDeleteDialogOpen(false);
		}
	};

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
		return <div className="text-center text-gray-500">{t('productDetails.notFound')}</div>;
	}

	return (
		<div className="h-full w-full p-4 md:p-8">
			<div className="flex justify-between items-start mb-6">
				<div className="flex-1 pr-4">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
					<p className="text-lg text-gray-600 mb-4">₸{product.price.toFixed(2)}</p>
				</div>
				<div className="flex space-x-2 flex-shrink-0">
					<Button onClick={handleEditClick} variant="secondary" size="sm">
						{t('productDetails.edit')}
					</Button>
					<Button onClick={handleDeleteClick} variant="danger" size="sm">
						{t('common.delete')}
					</Button>
				</div>
			</div>
			{product.description && (
				<div className="relative">
					<div
						className={`text-gray-700 text-sm leading-relaxed ${
							isDescriptionExpanded ? '' : 'line-clamp-3 max-h-[4.5rem]'
						}`}
						style={
							!isDescriptionExpanded
								? {
										WebkitMaskImage:
											'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0) 100%)',
										maskImage:
											'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0) 100%)'
								  }
								: undefined
						}
					>
						{product.description}
					</div>
					{product.description.length > 150 && (
						<button
							onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
							className="mt-1 text-sm text-primary-text hover:text-primary-text-600 font-medium relative z-10"
						>
							{isDescriptionExpanded ? t('productDetails.collapse') : t('productDetails.expand')}
						</button>
					)}
				</div>
			)}

			<ProductForm
				isOpen={isEditDialogOpen}
				onClose={() => setIsEditDialogOpen(false)}
				product={product}
				onSubmit={handleUpdateProduct}
				isLoading={isUpdating}
			/>

			<ConfirmDialog
				isOpen={isDeleteDialogOpen}
				onClose={() => setIsDeleteDialogOpen(false)}
				onConfirm={handleDeleteConfirm}
				title={t('productDetails.deleteTitle')}
				message={t('productDetails.deleteMessage')}
				confirmLabel={t('common.delete')}
				cancelLabel={t('common.cancel')}
				confirmVariant="danger"
				isLoading={isDeleting}
			/>

			<div className="border-b border-gray-200">
				<nav className="-mb-px flex space-x-8" aria-label="Tabs">
					<button
						onClick={() => setActiveTab('orders')}
						className={`${
							activeTab === 'orders'
								? 'border-primary text-primary-text'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
						} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
					>
						{t('productDetails.tabs.orders')}
					</button>
					<button
						onClick={() => setActiveTab('analytics')}
						className={`${
							activeTab === 'analytics'
								? 'border-primary text-primary-text'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
						} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
					>
						{t('productDetails.tabs.analytics')}
					</button>
				</nav>
			</div>

			<div className="mt-8">
				{activeTab === 'orders' && (
					<div className="flex flex-col">
						<div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
							<div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
								<div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th
													scope="col"
													className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													{t('productDetails.orders.created')}
												</th>
												<th
													scope="col"
													className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													{t('productDetails.orders.clientPhone')}
												</th>
												<th
													scope="col"
													className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													{t('productDetails.orders.quantity')}
												</th>
												<th
													scope="col"
													className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													{t('productDetails.orders.total')}
												</th>
												<th
													scope="col"
													className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													{t('productDetails.orders.status')}
												</th>
												<th scope="col" className="relative px-6 py-3">
													<span className="sr-only">{t('productDetails.orders.actions')}</span>
												</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{orders.length === 0 ? (
												<tr>
													<td colSpan={5} className="px-6 py-4 text-center text-gray-500">
														{t('productDetails.orders.noOrders')}
													</td>
												</tr>
											) : (
												orders.map(order => (
													<tr key={order.id}>
														<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
															{format(new Date(order.created_at), 'dd.MM.yyyy HH:mm')}
														</td>
														<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
															{order.client_phone}
														</td>
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
															{order.quantity}
														</td>
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
															₸{(order.quantity * order.price_per_item).toFixed(2)}
														</td>
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
															<StatusBadge
																status={order.status as keyof typeof OrderStatus}
															/>
														</td>
														<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
															{order.status === 'waiting_to_process' && (
																<div className="flex items-center justify-end space-x-2">
																	<Button
																		onClick={() =>
																			handleUpdateStatus(order.id, 'processed')
																		}
																		variant="success"
																		size="sm"
																		isLoading={updatingOrderId === order.id}
																	>
																		{t('productDetails.orders.process')}
																	</Button>
																	<Button
																		onClick={() =>
																			handleUpdateStatus(order.id, 'cancelled')
																		}
																		variant="danger"
																		size="sm"
																		isLoading={updatingOrderId === order.id}
																	>
																		{t('productDetails.orders.cancel')}
																	</Button>
																</div>
															)}
														</td>
													</tr>
												))
											)}
										</tbody>
									</table>
								</div>
							</div>
						</div>
					</div>
				)}
				{activeTab === 'analytics' && (
					<div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th
										scope="col"
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										{t('productDetails.analytics.blogger')}
									</th>
									<th
										scope="col"
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										{t('productDetails.analytics.visits')}
									</th>
									<th
										scope="col"
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										{t('productDetails.analytics.orders')}
									</th>
									<th
										scope="col"
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										{t('productDetails.analytics.sold')}
									</th>
									<th
										scope="col"
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										{t('productDetails.analytics.revenue')}
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{analytics.length === 0 ? (
									<tr>
										<td colSpan={5} className="px-6 py-4 text-center text-gray-500">
											{t('productDetails.analytics.noData')}
										</td>
									</tr>
								) : (
									analytics.map(analytic => (
										<tr key={analytic.id}>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
												{analytic.blogger?.name || `${t('common.blogger')} ${analytic.blogger_id}`}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{analytic.visit_count}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{analytic.order_count}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{analytic.items_sold}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">
												₸{analytic.money_earned.toFixed(2)}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
};

export default ShopProductDetailsPage;
