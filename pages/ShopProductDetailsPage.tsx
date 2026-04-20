import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import api from '../services/api';
import Spinner from '../components/Spinner';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import ProductForm from '../components/ProductForm';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { isCompanySubscriptionActive } from '../utils/companySubscription';

const ShopProductDetailsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const company = user?.role === 'COMPANY' ? user.company : null;
  const canWrite = isCompanySubscriptionActive(company);
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!productId) return;
    try {
      setLoading(true);
      setError(null);
      const productData = await api.getProduct(parseInt(productId, 10));
      setProduct(productData);
    } catch {
      setError(t('productDetails.loadError'));
    } finally {
      setLoading(false);
    }
  }, [productId, t]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleUpdateProduct = async (data: {
    name: string;
    description?: string;
    price: number;
    image_url?: string;
  }) => {
    if (!product) return;

    setIsUpdating(true);
    try {
      const updatedProduct = await api.updateProduct(product.id, {
        name: data.name,
        description: data.description || null,
        price: data.price,
        image_url: data.image_url || null,
      });
      setProduct(updatedProduct);
      setIsEditDialogOpen(false);
    } catch {
      alert(t('productDetails.updateError'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!product) return;

    setIsDeleting(true);
    try {
      await api.deleteProduct(product.id);
      navigate('/company/catalog');
    } catch {
      alert(t('productDetails.deleteError'));
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-destructive">{error}</div>;
  }

  if (!product) {
    return <div className="p-6 text-center text-secondary-alpha">{t('productDetails.notFound')}</div>;
  }

  return (
    <div className="h-full w-full p-4 md:p-8">
      <div className="mb-6">
        <Button onClick={() => navigate('/company/catalog')} variant="secondary" size="sm" className="rounded-lg">
          {t('common.back')}
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-8 md:flex-row">
        {product.image_url && (
          <div className="md:w-1/2">
            <img
              src={api.getImageUrl(product.image_url)}
              alt={product.name}
              className="h-auto w-full rounded-lg border border-border"
            />
          </div>
        )}
        <div className={product.image_url ? 'md:w-1/2' : 'w-full'}>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="mb-2 text-3xl font-bold text-foreground">{product.name}</h1>
              <p className="text-lg text-secondary-alpha">₸{product.price.toFixed(2)}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button onClick={() => setIsEditDialogOpen(true)} variant="secondary" size="sm" disabled={!canWrite}>
                {t('productDetails.edit')}
              </Button>
              <Button onClick={() => setIsDeleteDialogOpen(true)} variant="danger" size="sm" disabled={!canWrite}>
                {t('common.delete')}
              </Button>
            </div>
          </div>
          {product.description && (
            <div className="mb-6">
              <h2 className="mb-2 text-xl font-semibold text-foreground">{t('designerProductDetails.description')}</h2>
              <p className="leading-relaxed text-secondary-alpha">{product.description}</p>
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
};

export default ShopProductDetailsPage;
