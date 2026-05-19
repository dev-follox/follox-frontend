import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { Product } from '../types';
import api from '../services/api';
import Spinner from '../components/Spinner';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import ProductForm from '../components/ProductForm';
import { ImageOff, Plus, Trash2 } from 'lucide-react';
import { isCompanySubscriptionActive } from '../utils/companySubscription';

const ShopDashboardPage: React.FC = () => {
	const { user } = useAuth();
	const { t } = useTranslation();
	const company = user?.role === 'COMPANY' ? user.company : undefined;
	const canWrite = isCompanySubscriptionActive(company);
	const navigate = useNavigate();
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
		price: number;
		image_url?: string;
	}) => {
		if (!company?.id) return;

		setIsCreating(true);
		try {
			const createdProduct = await api.createProduct({
				name: data.name,
				description: data.description,
				price: data.price,
				image_url: data.image_url,
				company_id: company.id,
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
		price: number;
		image_url?: string;
	}) => {
		if (!editingProduct) return;

		setIsCreating(true);
		try {
			const updatedProduct = await api.updateProduct(editingProduct.id, {
				name: data.name,
				description: data.description || null,
				price: data.price,
				image_url: data.image_url || null,
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
			<div className="space-y-6 p-4 md:p-8">
				{!canWrite && (
					<div className="rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
						{t('subscription.readOnlyNotice')}
					</div>
				)}
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-bold text-foreground">Каталог</h1>
					<Button
						onClick={() => setIsDialogOpen(true)}
						icon={<Plus className="h-4 w-4" />}
						disabled={!canWrite}
					>
						{t('company.addProduct')}
					</Button>
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

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
					{products.map((product) => (
						<div
							key={product.id}
							className="border border-border bg-card text-card-foreground group cursor-pointer overflow-hidden"
							onClick={(e) => handleCardClick(product.id, e)}
						>
							<div className="aspect-square w-full overflow-hidden bg-foreground/5">
								{product.image_url ? (
									<img
										src={api.getImageUrl(product.image_url)}
										alt={product.name}
										className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
										loading="lazy"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center text-muted-foreground">
										<ImageOff className="h-10 w-10" />
									</div>
								)}
							</div>
							<div className="p-4">
								<div className="flex justify-between items-start">
									<h3 className="font-semibold text-foreground">{product.name}</h3>
									<div className="dropdown-container">
										<button
											type="button"
											className="inline-flex items-center justify-center h-9 px-4 opacity-0 group-hover:opacity-100 hover:bg-foreground/5 disabled:opacity-30"
											disabled={!canWrite}
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteClick(product.id);
											}}
										>
											<Trash2 className="h-4 w-4 text-danger" />
										</button>
									</div>
								</div>
								<p className="text-sm text-muted-foreground mt-1">{product.description || t('company.noDescription')}</p>
								<p className="text-lg font-bold text-primary mt-2">{new Intl.NumberFormat().format(product.price)} ₸</p>
							</div>
						</div>
					))}
					{products.length === 0 && (
						<p className="text-muted-foreground col-span-full text-center py-8">{t('company.noProducts')}</p>
					)}
				</div>
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
