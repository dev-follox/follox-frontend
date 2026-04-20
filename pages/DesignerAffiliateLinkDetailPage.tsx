import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import type { AffiliateLinkWithRollup, OrderWithDetails } from '../types';
import Spinner from '../components/Spinner';
import Button from '../components/Button';
import { useTranslation } from '../hooks/useTranslation';
import { ArrowLeft, MousePointerClick, Package, Banknote } from 'lucide-react';
import { normalizeOrderStatus } from '../utils/orderStatus';
import {
  dataTableWrap,
  dataTable,
  dataTheadRow,
  dataTh,
  dataTbodyRow,
  dataTd,
  dataTdMono,
} from '../components/dataTableStyles';

const DesignerAffiliateLinkDetailPage: React.FC = () => {
  const { linkId: linkIdParam } = useParams<{ linkId: string }>();
  const linkId = linkIdParam ? parseInt(linkIdParam, 10) : NaN;
  const { t } = useTranslation();

  const [link, setLink] = useState<AffiliateLinkWithRollup | null>(null);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const money = (n: number) => `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n)} ₸`;

  const load = useCallback(async () => {
    if (!Number.isFinite(linkId)) return;
    try {
      setLoading(true);
      setError(null);
      const [links, allOrders] = await Promise.all([api.getMyAffiliateLinks(), api.getMyOrders(0, 200)]);
      const found = links.find((l) => l.id === linkId) ?? null;
      setLink(found);
      setOrders(allOrders.filter((o) => o.affiliate_link_id === linkId));
    } catch {
      setError(t('designerLinkDetail.loadError'));
    } finally {
      setLoading(false);
    }
  }, [linkId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const landingUrl = useMemo(() => {
    if (!link?.code) return '';
    return `${window.location.origin}/products/${link.code}`;
  }, [link?.code]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">{error ?? t('designerLinkDetail.notFound')}</p>
        <Link to="/designers/products" className="mt-4 inline-block text-sm text-primary underline">
          {t('designerProductDetails.backToList')}
        </Link>
      </div>
    );
  }

  const visits = link.visit_count ?? 0;
  const orderCount = link.order_count ?? 0;
  const itemsSold = link.items_sold ?? 0;
  const revenue = link.revenue ?? 0;
  const bonus = link.designer_bonus_paid ?? link.commission_paid ?? 0;
  const platform = link.platform_fee_paid ?? 0;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/designers/products"
          className="inline-flex items-center gap-1 text-sm text-secondary-alpha hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('designerLinkDetail.back')}
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">{link.product?.name ?? `#${link.product_id}`}</h1>
        <p className="mt-1 text-sm text-secondary-alpha">
          {t('designerProducts.effectiveBonus')}: {link.effective_bonus_percent}%
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-secondary-alpha">{t('designerLinkDetail.publicLink')}</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <a href={landingUrl} className="break-all text-primary underline" target="_blank" rel="noreferrer">
            {landingUrl}
          </a>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void navigator.clipboard.writeText(landingUrl)}
          >
            {t('designerProductDetails.copy')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <div className="border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-secondary-alpha">
            <MousePointerClick className="h-4 w-4" />
            {t('productDetails.analytics.visits')}
          </div>
          <p className="mt-1 font-mono text-xl font-semibold text-foreground">{visits}</p>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-secondary-alpha">
            <Package className="h-4 w-4" />
            {t('productDetails.analytics.orders')}
          </div>
          <p className="mt-1 font-mono text-xl font-semibold text-foreground">{orderCount}</p>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="text-xs text-secondary-alpha">{t('productDetails.analytics.sold')}</div>
          <p className="mt-1 font-mono text-xl font-semibold text-foreground">{itemsSold}</p>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="text-xs text-secondary-alpha">{t('productDetails.analytics.revenue')}</div>
          <p className="mt-1 font-mono text-xl font-semibold text-foreground">{money(revenue)}</p>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-secondary-alpha">
            <Banknote className="h-4 w-4" />
            {t('companySales.designerBonus')}
          </div>
          <p className="mt-1 font-mono text-xl font-semibold text-foreground">{money(bonus)}</p>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="text-xs text-secondary-alpha">{t('companySales.platformFee')}</div>
          <p className="mt-1 font-mono text-xl font-semibold text-foreground">{money(platform)}</p>
        </div>
      </div>

      <div className="border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t('designerLinkDetail.ordersTitle')}</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-secondary-alpha">{t('designerLinkDetail.noOrders')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className={dataTable}>
              <thead>
                <tr className={dataTheadRow}>
                  <th className={dataTh}>{t('companySales.date')}</th>
                  <th className={dataTh}>{t('productDetails.orders.quantity')}</th>
                  <th className={dataTh}>{t('productDetails.orders.total')}</th>
                  <th className={dataTh}>{t('companySales.designerBonus')}</th>
                  <th className={dataTh}>{t('companySales.status')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className={dataTbodyRow}>
                    <td className={`${dataTd} whitespace-nowrap`}>{new Date(o.created_at).toLocaleString()}</td>
                    <td className={dataTd}>{o.quantity}</td>
                    <td className={dataTdMono}>{money(o.line_revenue)}</td>
                    <td className={dataTdMono}>{money(o.designer_bonus_amount)}</td>
                    <td className={`${dataTd} text-secondary-alpha`}>{normalizeOrderStatus(o.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignerAffiliateLinkDetailPage;
