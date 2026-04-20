import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { DesignerProductDetailed } from '../types';
import api from '../services/api';
import Spinner from '../components/Spinner';
import Button from '../components/Button';
import { useTranslation } from '../hooks/useTranslation';

const DesignerProductDetailsPage: React.FC = () => {
  const { t } = useTranslation();
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<DesignerProductDetailed | null>(null);
  /** Set when product was loaded via catalog fallback (no row in "my products" yet). */
  const [catalogCompanyId, setCatalogCompanyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!productId) return;
    const id = parseInt(productId, 10);
    if (Number.isNaN(id)) {
      setError(t('designerProductDetails.notFound'));
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const detailed = await api.getProductsForMeDetailed();
      const found = detailed.find((p) => p.id === id);
      if (found) {
        setProduct(found);
        setCatalogCompanyId(null);
        return;
      }

      const [productBase, myLinks] = await Promise.all([api.getProduct(id), api.getMyAffiliateLinks()]);
      const link = myLinks.find((l) => l.product_id === id);
      setCatalogCompanyId(productBase.company_id);
      setProduct({
        id: productBase.id,
        name: productBase.name,
        description: productBase.description,
        price: productBase.price,
        image_url: productBase.image_url,
        affiliate_code: link?.code ?? '',
      });
    } catch {
      setError(t('designerProductDetails.loadError'));
    } finally {
      setLoading(false);
    }
  }, [productId, t]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  if (!product) {
    return <div className="p-6 text-center text-secondary-alpha">{t('designerProductDetails.notFound')}</div>;
  }

  const hasAffiliate = Boolean(product.affiliate_code);

  return (
    <div className="designer-product-details-page h-full w-full p-4 md:p-8">
      <div className="mb-6">
        <Button onClick={() => navigate('/designers/products')} variant="secondary" size="sm" className="rounded-lg">
          {t('designerProductDetails.backToList')}
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
          <h1 className="mb-2 text-3xl font-bold text-foreground">{product.name}</h1>
          <p className="mb-4 text-lg text-secondary-alpha">₸{product.price.toFixed(2)}</p>
          {product.description && (
            <div className="mb-6">
              <h2 className="mb-2 text-xl font-semibold text-foreground">{t('designerProductDetails.description')}</h2>
              <p className="leading-relaxed text-secondary-alpha">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold text-foreground">{t('designerProductDetails.affiliateLink')}</h2>
        {hasAffiliate ? (
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <a
              className="flex-1 break-all text-primary underline"
              href={`${window.location.origin}/products/${product.affiliate_code}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {`${window.location.origin}/products/${product.affiliate_code}`}
            </a>
            <Button
              onClick={() => {
                void navigator.clipboard.writeText(`${window.location.origin}/products/${product.affiliate_code}`);
                alert(t('designerProductDetails.linkCopied'));
              }}
              variant="secondary"
              size="sm"
              className="rounded-lg"
            >
              {t('designerProductDetails.copy')}
            </Button>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-secondary-alpha">
            <p>{t('designerProductDetails.noAffiliateYet')}</p>
            <Link
              to={catalogCompanyId != null ? `/designers/catalog/${catalogCompanyId}` : '/designers/catalog'}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/50"
            >
              {t('designerProductDetails.openCatalogToCreate')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignerProductDetailsPage;
