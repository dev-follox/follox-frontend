import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import type { Company, Product, DesignerManualOrderCreate } from '../types';
import Spinner from '../components/Spinner';
import Button from '../components/Button';
import Input from '../components/Input';
import Dialog from '../components/Dialog';
import { useTranslation } from '../hooks/useTranslation';
import { ArrowLeft, Link2, Receipt } from 'lucide-react';
import {
  dataTableWrap,
  dataTable,
  dataTheadRow,
  dataTh,
  dataTbodyRow,
  dataTd,
  dataTdMono,
} from '../components/dataTableStyles';

const productLandingUrl = (code: string) => `${window.location.origin}/products/${code}`;

const DesignerCompanyCatalogPage: React.FC = () => {
  const { companyId: companyIdParam } = useParams<{ companyId: string }>();
  const companyId = companyIdParam ? parseInt(companyIdParam, 10) : NaN;
  const { t } = useTranslation();

  const [company, setCompany] = useState<Company | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [linksByProductId, setLinksByProductId] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyProductId, setBusyProductId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const [manualOpen, setManualOpen] = useState(false);
  const [manualProduct, setManualProduct] = useState<Product | null>(null);
  const [manualForm, setManualForm] = useState({
    quantity: '1',
    price_per_item: '',
    client_phone: '',
    client_name: '',
    note: '',
    attachment_url: '',
  });
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(companyId)) return;
    try {
      setLoading(true);
      setError(null);
      const [catalogCompanies, list] = await Promise.all([
        api.getDesignerCatalogCompanies(),
        api.getDesignerCatalogProducts(companyId),
      ]);
      const c = catalogCompanies.find((x) => x.id === companyId) ?? null;
      setCompany(c);
      setProducts(list);
      try {
        const myLinks = await api.getMyAffiliateLinks();
        const next: Record<number, string> = {};
        const ids = new Set(list.map((p) => p.id));
        myLinks.forEach((l) => {
          if (ids.has(l.product_id)) {
            next[l.product_id] = productLandingUrl(l.code);
          }
        });
        setLinksByProductId(next);
      } catch {
        setLinksByProductId({});
      }
    } catch {
      setError(t('designerCompanyCatalog.loadError'));
    } finally {
      setLoading(false);
    }
  }, [companyId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreateLink = async (product: Product) => {
    try {
      setBusyProductId(product.id);
      const link = await api.createAffiliateLink({ product_id: product.id });
      setLinksByProductId((prev) => ({ ...prev, [product.id]: productLandingUrl(link.code) }));
      await load();
    } catch {
      setError(t('designerCompanyCatalog.linkError'));
    } finally {
      setBusyProductId(null);
    }
  };

  const copyAffiliate = (productId: number, url: string) => {
    void navigator.clipboard?.writeText(url).then(() => {
      setCopiedId(productId);
      window.setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const openManual = (product: Product) => {
    setManualProduct(product);
    setManualForm((f) => ({
      ...f,
      price_per_item: String(product.price),
    }));
    setManualError(null);
    setManualOpen(true);
  };

  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualProduct) return;
    const qty = parseInt(manualForm.quantity, 10);
    const price = parseFloat(manualForm.price_per_item);
    if (!manualForm.client_phone.trim() || Number.isNaN(qty) || qty < 1 || Number.isNaN(price)) {
      setManualError(t('designerManualOrder.validation'));
      return;
    }
    const body: DesignerManualOrderCreate = {
      product_id: manualProduct.id,
      quantity: qty,
      price_per_item: price,
      client_phone: manualForm.client_phone.trim(),
      client_name: manualForm.client_name.trim() || null,
      note: manualForm.note.trim() || null,
      attachment_url: manualForm.attachment_url.trim() || null,
    };
    setManualSubmitting(true);
    setManualError(null);
    try {
      await api.createDesignerManualOrder(body);
      setManualOpen(false);
      setManualProduct(null);
      await load();
    } catch {
      setManualError(t('designerManualOrder.submitError'));
    } finally {
      setManualSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (error && !company && products.length === 0) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/designers/catalog"
          className="inline-flex items-center gap-1 text-sm text-secondary-alpha hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('designerCompanyCatalog.back')}
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-foreground">{error}</div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-foreground">{company?.company_name ?? t('designerCompanyCatalog.title')}</h1>
        <p className="mt-1 text-sm text-secondary-alpha">{t('designerCompanyCatalog.subtitle')}</p>
      </div>

      <div className={dataTableWrap}>
        <table className={dataTable}>
          <thead>
            <tr className={dataTheadRow}>
              <th className={dataTh}>{t('designerCompanyCatalog.product')}</th>
              <th className={dataTh}>{t('designerCompanyCatalog.price')}</th>
              <th className={`${dataTh} text-right`}>{t('designerCompanyCatalog.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={3} className={`${dataTd} py-8 text-center text-secondary-alpha`}>
                  {t('dashboardV2.noData')}
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className={dataTbodyRow}>
                  <td className={dataTd}>
                    <Link
                      to={`/designers/products/${p.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {p.name}
                    </Link>
                    {p.designer_task_description && (
                      <p className="mt-1 line-clamp-2 text-xs text-secondary-alpha">{p.designer_task_description}</p>
                    )}
                    {linksByProductId[p.id] && (
                      <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                        <a
                          href={linksByProductId[p.id]}
                          className="break-all text-xs text-secondary-alpha underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {linksByProductId[p.id]}
                        </a>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-7 shrink-0 self-start rounded-lg px-2 text-xs"
                          onClick={() => copyAffiliate(p.id, linksByProductId[p.id])}
                        >
                          {copiedId === p.id ? t('designers.copied') : t('designerProductDetails.copy')}
                        </Button>
                      </div>
                    )}
                  </td>
                  <td className={`${dataTdMono} whitespace-nowrap`}>₸{p.price.toFixed(2)}</td>
                  <td className={`${dataTd} text-right`}>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="rounded-lg"
                        isLoading={busyProductId === p.id}
                        onClick={() => void handleCreateLink(p)}
                      >
                        <Link2 className="mr-1 inline h-3.5 w-3.5" />
                        {t('designerCompanyCatalog.createLink')}
                      </Button>
                      <Button type="button" size="sm" variant="secondary" className="rounded-lg" onClick={() => openManual(p)}>
                        <Receipt className="mr-1 inline h-3.5 w-3.5" />
                        {t('designerCompanyCatalog.manualOrder')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        isOpen={manualOpen}
        onClose={() => !manualSubmitting && setManualOpen(false)}
        title={t('designerManualOrder.title')}
        onSubmit={submitManual}
        actions={[
          {
            label: t('common.cancel'),
            variant: 'secondary',
            type: 'button',
            disabled: manualSubmitting,
            onClick: () => setManualOpen(false),
          },
          {
            label: t('designerManualOrder.submit'),
            variant: 'primary',
            type: 'submit',
            isLoading: manualSubmitting,
          },
        ]}
      >
        {manualError && <p className="mb-3 text-sm text-red-600">{manualError}</p>}
        {manualProduct && <p className="mb-3 text-sm font-medium text-foreground">{manualProduct.name}</p>}
        <div className="space-y-3">
          <Input
            id="mo-qty"
            label={t('productLanding.quantity')}
            type="number"
            min={1}
            required
            value={manualForm.quantity}
            onChange={(e) => setManualForm((f) => ({ ...f, quantity: e.target.value }))}
          />
          <Input
            id="mo-price"
            label={t('designerManualOrder.pricePerItem')}
            type="number"
            step="0.01"
            required
            value={manualForm.price_per_item}
            onChange={(e) => setManualForm((f) => ({ ...f, price_per_item: e.target.value }))}
          />
          <Input
            id="mo-phone"
            label={t('productLanding.phoneNumber')}
            required
            value={manualForm.client_phone}
            onChange={(e) => setManualForm((f) => ({ ...f, client_phone: e.target.value }))}
          />
          <Input
            id="mo-name"
            label={`${t('common.name')} (${t('common.optional')})`}
            value={manualForm.client_name}
            onChange={(e) => setManualForm((f) => ({ ...f, client_name: e.target.value }))}
          />
          <Input
            id="mo-note"
            label={`${t('common.description')} (${t('common.optional')})`}
            value={manualForm.note}
            onChange={(e) => setManualForm((f) => ({ ...f, note: e.target.value }))}
          />
          <Input
            id="mo-attach"
            label={t('designerManualOrder.attachmentUrl')}
            type="url"
            placeholder="https://..."
            value={manualForm.attachment_url}
            onChange={(e) => setManualForm((f) => ({ ...f, attachment_url: e.target.value }))}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default DesignerCompanyCatalogPage;
