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

type TabType = 'products' | 'designers';

const ShopDashboardPage: React.FC = () => {
	const { user } = useAuth();
	const { t } = useTranslation();
	const company = user?.company;
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState<TabType>('products');
	const location = useLocation();

	// Sync activeTab with current route
	useEffect(() => {
		if (location.pathname === '/company/designers') {
			setActiveTab('designers');
		} else if (
			location.pathname.startsWith('/company/dashboard') ||
			location.pathname.startsWith('/company/products')
		) {
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
					setError(t('company.loadError'));
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
			setError(t('company.createError'));
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
			setError(t('company.updateError'));
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
			setError(t('company.deleteError'));
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
			<div className="company-dashboard">
				<div className="company-dashboard-header">
					<h1 className="company-dashboard-header__title">{t('company.yourProducts')}</h1>
					<Button onClick={() => setIsDialogOpen(true)}>{t('company.addProduct')}</Button>
				</div>

				<ConfirmDialog
					isOpen={isDeleteDialogOpen}
					onClose={() => {
						setIsDeleteDialogOpen(false);
						setProductToDelete(null);
					}}
					onConfirm={handleDeleteConfirm}
					title={t('company.deleteProduct')}
					message={t('company.deleteConfirm')}
					confirmLabel={t('common.delete')}
					cancelLabel={t('common.cancel')}
					confirmVariant="danger"
					isLoading={isDeleting}
				/>

				{products.length === 0 ? (
					<p className="company-empty-state">{t('company.noProducts')}</p>
				) : (
					<div className="company-products-grid">
						{products.map(product => (
							<Card
								key={product.id}
								className="company-product-card"
								onClick={e => handleCardClick(product.id, e)}
							>
								<div className="company-product-card__actions dropdown-container">
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
											<div className="absolute right-0 mt-2 w-48 bg-white rounded-md z-20 border border-[rgba(228,228,231,1)]">
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
								{product.image_url && (
									<div className="company-product-card__image">
										<img src={api.getImageUrl(product.image_url)} alt={product.name} />
									</div>
								)}
								<div className="company-product-card__content">
									<h2 className="company-product-card__title">{product.name}</h2>
									<p className="company-product-card__description">
										<span>{product.description || t('company.noDescription')}</span>
									</p>
									<p className="company-product-card__price">₸{product.price.toFixed(2)}</p>
								</div>
							</Card>
						))}
					</div>
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
