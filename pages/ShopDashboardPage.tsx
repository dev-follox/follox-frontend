import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { Product } from '../types';
import api from '../services/api';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import ProductForm from '../components/ProductForm';

type TabType = 'products' | 'bloggers';

const ShopDashboardPage: React.FC = () => {
	const { user } = useAuth();
	const { t } = useTranslation();
	const company = user?.company;
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState<TabType>('products');
	const location = useLocation();

	// Sync activeTab with current route
	useEffect(() => {
		if (location.pathname === '/company/bloggers') {
			setActiveTab('bloggers');
		} else if (location.pathname.startsWith('/company/dashboard') || location.pathname.startsWith('/company/products')) {
			setActiveTab('products');
		}
	}, [location.pathname]);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [productToDelete, setProductToDelete] = useState<number | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const dropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

	useEffect(() => {
		if (company?.id) {
			const fetchProducts = async () => {
				try {
					setLoading(true);
					const data = await api.getProducts();
					setProducts(data);
				} catch (err) {
					setError(t('dashboard.loadError'));
				} finally {
					setLoading(false);
				}
			};
			fetchProducts();
		}
	}, [company]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (openDropdownId !== null) {
				const dropdown = dropdownRefs.current[openDropdownId];
				if (dropdown && !dropdown.contains(event.target as Node)) {
					setOpenDropdownId(null);
				}
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [openDropdownId]);

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

	const handleCreateProduct = async (data: {
		name: string;
		description?: string;
		blogger_task_description?: string;
		price: number;
		image_url?: string;
	}) => {
		if (!company?.id) return;

		setIsCreating(true);
		try {
			const createdProduct = await api.createProduct({
				...data,
				company_id: company.id
			});
			setProducts(prev => [createdProduct, ...prev]);
			setIsDialogOpen(false);
		} catch (err) {
			setError(t('dashboard.createError'));
		} finally {
			setIsCreating(false);
		}
	};

	const handleCreateProductClose = () => {
		setIsDialogOpen(false);
	};

	const handleEditClick = (product: Product) => {
		setEditingProduct(product);
		setIsEditDialogOpen(true);
		setOpenDropdownId(null);
	};

	const handleUpdateProduct = async (data: {
		name: string;
		description?: string;
		blogger_task_description?: string;
		price: number;
		image_url?: string;
	}) => {
		if (!editingProduct) return;

		setIsCreating(true);
		try {
			const updatedProduct = await api.updateProduct(editingProduct.id, {
				name: data.name,
				description: data.description || null,
				blogger_task_description: data.blogger_task_description || null,
				price: data.price,
				image_url: data.image_url || null
			});
			setProducts(prev => prev.map(p => (p.id === editingProduct.id ? updatedProduct : p)));
			setIsEditDialogOpen(false);
			setEditingProduct(null);
		} catch (err) {
			setError(t('dashboard.updateError'));
		} finally {
			setIsCreating(false);
		}
	};

	const handleEditProductClose = () => {
		setIsEditDialogOpen(false);
		setEditingProduct(null);
	};

	const handleDeleteClick = (productId: number) => {
		setProductToDelete(productId);
		setIsDeleteDialogOpen(true);
		setOpenDropdownId(null);
	};

	const handleDeleteConfirm = async () => {
		if (productToDelete === null) return;

		setIsDeleting(true);
		try {
			await api.deleteProduct(productToDelete);
			setProducts(prev => prev.filter(p => p.id !== productToDelete));
			setIsDeleteDialogOpen(false);
			setProductToDelete(null);
		} catch (err) {
			setError(t('dashboard.deleteError'));
			setIsDeleteDialogOpen(false);
			setProductToDelete(null);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleCardClick = (productId: number, e: React.MouseEvent) => {
		// Don't navigate if clicking on dropdown or its button
		const target = e.target as HTMLElement;
		if (target.closest('.dropdown-container')) {
			return;
		}
		navigate(`/company/products/${productId}`);
	};

	return (
		<>
			<div className="h-full w-full p-4 md:p-8 space-y-8">
				{/* Tabs */}
				<div className="border-b border-gray-200">
					<nav className="-mb-px flex space-x-8">
						<button
							onClick={() => setActiveTab('products')}
							className={`${
								activeTab === 'products'
									? 'border-primary text-primary'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
							} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
						>
							{t('sidebar.products')}
						</button>
						<button
							onClick={() => navigate('/company/bloggers')}
							className={`${
								activeTab === 'bloggers'
									? 'border-primary text-primary'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
							} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
						>
							{t('sidebar.bloggers')}
						</button>
					</nav>
				</div>

				{/* Tab Content */}
				{activeTab === 'products' && (
					<>
						<div className="flex justify-between items-center">
							<h1 className="text-xl font-bold text-gray-900">{t('dashboard.yourProducts')}</h1>
							<Button onClick={() => setIsDialogOpen(true)}>{t('dashboard.addProduct')}</Button>
						</div>

				<ConfirmDialog
					isOpen={isDeleteDialogOpen}
					onClose={() => {
						setIsDeleteDialogOpen(false);
						setProductToDelete(null);
					}}
					onConfirm={handleDeleteConfirm}
					title={t('dashboard.deleteProduct')}
					message={t('dashboard.deleteConfirm')}
					confirmLabel={t('common.delete')}
					cancelLabel={t('common.cancel')}
					confirmVariant="danger"
					isLoading={isDeleting}
				/>

				{products.length === 0 ? (
					<p className="text-center text-gray-500">{t('dashboard.noProducts')}</p>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{products.map(product => (
							<Card
								key={product.id}
								className="h-96 flex flex-col hover:shadow-xl transition-shadow duration-300 cursor-pointer relative"
								onClick={e => handleCardClick(product.id, e)}
							>
								<div className="absolute top-2 right-2 z-10 dropdown-container">
									<div className="relative" ref={el => (dropdownRefs.current[product.id] = el)}>
										<button
											onClick={e => {
												e.stopPropagation();
												setOpenDropdownId(openDropdownId === product.id ? null : product.id);
											}}
											className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
											aria-label="Действия"
										>
											<svg
												className="w-5 h-5 text-gray-600"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
												/>
											</svg>
										</button>
										{openDropdownId === product.id && (
											<div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
												<div className="py-1">
													<button
														onClick={e => {
															e.stopPropagation();
															handleEditClick(product);
														}}
														className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
													>
														{t('common.edit')}
													</button>
													<button
														onClick={e => {
															e.stopPropagation();
															handleDeleteClick(product.id);
														}}
														className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
													>
														{t('common.delete')}
													</button>
												</div>
											</div>
										)}
									</div>
								</div>
								<div className="flex flex-col h-full">
									{product.image_url && (
										<div className="h-48 w-full flex-shrink-0">
											<img
												src={api.getImageUrl(product.image_url)}
												alt={product.name}
												className="h-full w-full object-cover rounded-t-lg"
											/>
										</div>
									)}
									<div className="p-6 flex-grow flex flex-col min-h-0">
										<h2 className="text-lg font-semibold text-gray-800 mb-2">{product.name}</h2>
										<p className="text-gray-600 text-sm flex-grow overflow-hidden">
											<span className="line-clamp-3">
												{product.description || t('dashboard.noDescription')}
											</span>
										</p>
										<p className="mt-4 text-2xl font-bold text-primary-text flex-shrink-0">
											₸{product.price.toFixed(2)}
										</p>
									</div>
								</div>
							</Card>
						))}
					</div>
				)}
					</>
				)}

			</div>
			<ProductForm
				isOpen={isDialogOpen}
				onClose={handleCreateProductClose}
				onSubmit={handleCreateProduct}
				isLoading={isCreating}
			/>

			<ProductForm
				isOpen={isEditDialogOpen}
				onClose={handleEditProductClose}
				product={editingProduct}
				onSubmit={handleUpdateProduct}
				isLoading={isCreating}
			/>
		</>
	);
};

export default ShopDashboardPage;
