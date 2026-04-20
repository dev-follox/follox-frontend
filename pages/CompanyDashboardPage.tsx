import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Package,
  Percent,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-react';
import api from '../services/api';
import Spinner from '../components/Spinner';
import StatCard from '../components/dashboard/StatCard';
import DashboardOrderStatusBadge from '../components/dashboard/DashboardOrderStatusBadge';
import type {
  AnalyticsDashboard,
  CompanyAnalyticsSort,
  CompanyDesignerAnalyticsRow,
  CompanyProductAnalyticsRow,
  OrderWithDetails,
} from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { companyAnalyticsQueryString } from '../utils/companyAnalyticsQuery';
import { normalizeOrderStatus } from '../utils/orderStatus';
import { SortableMetricHeader } from '../components/companyAnalytics/SortableMetricHeader';
import {
  analyticsTable,
  analyticsTableWrap,
  analyticsTheadRow,
  analyticsTh,
  analyticsTbodyRow,
  analyticsTd,
  analyticsTdMono,
} from '../components/companyAnalytics/companyAnalyticsTableStyles';

const formatMoney = (value: number) =>
  `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value)} ₸`;

const TOP_DESIGNERS = 5;
const TOP_PRODUCTS = 8;
const RECENT_ORDERS = 5;

const CompanyDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [designerRows, setDesignerRows] = useState<CompanyDesignerAnalyticsRow[]>([]);
  const [productRows, setProductRows] = useState<CompanyProductAnalyticsRow[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderWithDetails[]>([]);
  const [designerSort, setDesignerSort] = useState<CompanyAnalyticsSort>('revenue');
  const [productSort, setProductSort] = useState<CompanyAnalyticsSort>('revenue');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dash, designers, products, ordersRaw] = await Promise.all([
        api.getAnalyticsDashboard(),
        api.getCompanyDesignerAnalytics({
          sort: designerSort,
          from: null,
          to: null,
        }),
        api.getCompanyProductOrderAnalytics({
          sort: productSort,
          from: null,
          to: null,
        }),
        api.getOrders(0, RECENT_ORDERS),
      ]);
      setDashboard(dash);
      setDesignerRows(designers);
      setProductRows(products);
      const recentDetailed = await Promise.all(
        ordersRaw.map((o) =>
          api.getOrderById(o.id).catch(() => ({ ...o, product: null, designer: null } as OrderWithDetails))
        )
      );
      setRecentOrders(recentDetailed);
    } catch {
      setError(t('company.loadError'));
    } finally {
      setLoading(false);
    }
  }, [designerSort, productSort, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const money = (n: number) => formatMoney(n);

  const designerDetailHref = (designerId: number) =>
    `/company/analytics/designers/${designerId}${companyAnalyticsQueryString({ sort: designerSort })}`;

  const productDetailHref = (productId: number) =>
    `/company/analytics/products/${productId}${companyAnalyticsQueryString({ sort: productSort })}`;

  const orderStatusLabel = (status: string) => {
    const n = normalizeOrderStatus(status);
    if (n === 'processed') return t('productDetails.orders.statusProcessed');
    if (n === 'cancelled') return t('productDetails.orders.statusCancelled');
    return t('productDetails.orders.statusWaiting');
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }
  if (error || !dashboard) {
    return <div className="text-center text-destructive">{error ?? t('company.loadError')}</div>;
  }

  const designersPreview = designerRows.slice(0, TOP_DESIGNERS);
  const productsPreview = productRows.slice(0, TOP_PRODUCTS);

  const activeDesigners = dashboard.designer_rankings.length;

  return (
    <div className="space-y-5 p-4 md:p-8">
      <div>
        <h1 className="text-xl font-bold uppercase tracking-wide text-foreground md:text-2xl">{t('sidebar.dashboard')}</h1>
        <p className="mt-1 text-sm text-secondary-alpha">{t('dashboardV2.dashboardSubtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label={t('landingV2.demo.company.stats.activeDesigners')} value={String(activeDesigners)} icon={Users} />
        <StatCard label={t('dashboardV2.totalRevenue')} value={money(dashboard.total_revenue)} icon={DollarSign} />
        <StatCard label={t('dashboardV2.designerBonusTotal')} value={money(dashboard.total_designer_bonus)} icon={TrendingUp} />
        <StatCard label={t('dashboardV2.platformFeeTotal')} value={money(dashboard.total_platform_fee)} icon={Percent} />
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
              <TrendingUp className="h-4 w-4 text-primary" strokeWidth={1.5} />
              {t('landingV2.demo.company.topDesigners')}
            </h2>
            <p className="mt-1 text-xs text-secondary-alpha">{t('dashboardV2.designersPreviewHint')}</p>
          </div>
          <Link to="/company/analytics/designers" className="text-sm font-medium text-primary hover:underline">
            {t('dashboardV2.viewAllAnalytics')}
          </Link>
        </div>
        {designersPreview.length === 0 ? (
          <p className="text-sm text-secondary-alpha">{t('dashboardV2.noData')}</p>
        ) : (
          <div className={analyticsTableWrap}>
            <table className={analyticsTable}>
              <thead>
                <tr className={analyticsTheadRow}>
                  <th className={analyticsTh}>{t('companySales.designer')}</th>
                  <th className={analyticsTh}>{t('companySales.email')}</th>
                  <th className={analyticsTh}>{t('productDetails.analytics.sold')}</th>
                  <SortableMetricHeader
                    label={t('productDetails.analytics.revenue')}
                    column="revenue"
                    currentSort={designerSort}
                    onSort={setDesignerSort}
                  />
                  <SortableMetricHeader
                    label={t('companySales.designerBonus')}
                    column="designer_bonus"
                    currentSort={designerSort}
                    onSort={setDesignerSort}
                  />
                  <SortableMetricHeader
                    label={t('companySales.platformFee')}
                    column="platform_fee"
                    currentSort={designerSort}
                    onSort={setDesignerSort}
                  />
                </tr>
              </thead>
              <tbody>
                {designersPreview.map((r, i) => (
                  <tr key={r.designer_id} className={`${analyticsTbodyRow} ${i % 2 === 1 ? 'bg-foreground/[0.03]' : ''}`}>
                    <td className={analyticsTd}>
                      <Link to={designerDetailHref(r.designer_id)} className="font-medium text-primary hover:underline">
                        {r.designer_name}
                      </Link>
                    </td>
                    <td className={`${analyticsTd} text-secondary-alpha`}>{r.designer_email}</td>
                    <td className={`${analyticsTd} text-foreground`}>{r.items_sold}</td>
                    <td className={analyticsTdMono}>{money(r.revenue)}</td>
                    <td className={analyticsTdMono}>{money(r.designer_bonus)}</td>
                    <td className={analyticsTdMono}>{money(r.platform_fee)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
              <Package className="h-4 w-4 text-primary" strokeWidth={1.5} />
              {t('dashboardV2.salesByProducts')}
            </h2>
            <p className="mt-1 text-xs text-secondary-alpha">
              {t('dashboardV2.activeDesigners')}: {activeDesigners}
            </p>
          </div>
          <Link to="/company/analytics/products" className="text-sm font-medium text-primary hover:underline">
            {t('dashboardV2.viewAllAnalytics')}
          </Link>
        </div>
        {productsPreview.length === 0 ? (
          <p className="text-sm text-secondary-alpha">{t('dashboardV2.noData')}</p>
        ) : (
          <div className={analyticsTableWrap}>
            <table className={analyticsTable}>
              <thead>
                <tr className={analyticsTheadRow}>
                  <th className={analyticsTh}>{t('companyAnalytics.product')}</th>
                  <th className={analyticsTh}>{t('productDetails.analytics.sold')}</th>
                  <SortableMetricHeader
                    label={t('productDetails.analytics.revenue')}
                    column="revenue"
                    currentSort={productSort}
                    onSort={setProductSort}
                  />
                  <SortableMetricHeader
                    label={t('companySales.designerBonus')}
                    column="designer_bonus"
                    currentSort={productSort}
                    onSort={setProductSort}
                  />
                  <SortableMetricHeader
                    label={t('companySales.platformFee')}
                    column="platform_fee"
                    currentSort={productSort}
                    onSort={setProductSort}
                  />
                </tr>
              </thead>
              <tbody>
                {productsPreview.map((r, i) => (
                  <tr key={r.product_id} className={`${analyticsTbodyRow} ${i % 2 === 1 ? 'bg-foreground/[0.03]' : ''}`}>
                    <td className={analyticsTd}>
                      <Link to={productDetailHref(r.product_id)} className="font-medium text-primary hover:underline">
                        {r.product_name}
                      </Link>
                    </td>
                    <td className={`${analyticsTd} text-foreground`}>{r.items_sold}</td>
                    <td className={analyticsTdMono}>{money(r.revenue)}</td>
                    <td className={analyticsTdMono}>{money(r.designer_bonus)}</td>
                    <td className={analyticsTdMono}>{money(r.platform_fee)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
            <ShoppingBag className="h-4 w-4 text-primary" strokeWidth={1.5} />
            {t('dashboardV2.recentOrders')}
          </h2>
          <Link to="/company/sales" className="text-sm font-medium text-primary hover:underline">
            {t('sidebar.sales')}
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-secondary-alpha">{t('dashboardV2.noData')}</p>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((o) => (
              <div
                key={o.id}
                className="flex flex-col gap-2 border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{o.product?.name ?? `Product #${o.product_id}`}</p>
                  <p className="text-xs text-secondary-alpha">{o.designer?.name ?? `Designer #${o.designer_id}`}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-sm font-semibold text-foreground">{money(o.line_revenue)}</span>
                  <DashboardOrderStatusBadge status={o.status} label={orderStatusLabel(o.status)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyDashboardPage;
