import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import type { CompanyProductDesignerBreakdownRow, CompanyAnalyticsSort } from '../types';
import Spinner from '../components/Spinner';
import { useTranslation } from '../hooks/useTranslation';
import { companyAnalyticsQueryString, readAnalyticsQuery } from '../utils/companyAnalyticsQuery';
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
import { ArrowLeft } from 'lucide-react';

const CompanyAnalyticsProductDesignersPage: React.FC = () => {
  const { productId: productIdParam } = useParams<{ productId: string }>();
  const productId = productIdParam ? parseInt(productIdParam, 10) : NaN;
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const q = readAnalyticsQuery(searchParams.toString());

  const [rows, setRows] = useState<CompanyProductDesignerBreakdownRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const qs = companyAnalyticsQueryString({ from: q.from, to: q.to, sort: q.sort });

  const handleSort = (column: CompanyAnalyticsSort) => {
    const next = companyAnalyticsQueryString({ from: q.from, to: q.to, sort: column });
    setSearchParams(new URLSearchParams(next.replace(/^\?/, '')));
  };

  const load = useCallback(async () => {
    if (!Number.isFinite(productId)) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getCompanyProductDesignerBreakdown(productId, {
        sort: q.sort,
        from: q.from ?? null,
        to: q.to ?? null,
      });
      setRows(data);
    } catch {
      setError(t('companyAnalytics.loadError'));
    } finally {
      setLoading(false);
    }
  }, [productId, q.sort, q.from, q.to, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const money = (n: number) => `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n)} ₸`;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <Link
        to={`/company/analytics/products${qs}`}
        className="inline-flex items-center gap-1 text-sm text-secondary-alpha hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('companyAnalytics.backProducts')}
      </Link>

      <h1 className="text-2xl font-bold text-foreground">{t('companyAnalytics.productDesignersTitle')}</h1>
      <p className="text-sm text-secondary-alpha">
        {t('companyAnalytics.filteredHint')} {q.from || '—'} → {q.to || '—'} · {q.sort}
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="flex h-48 justify-center">
          <Spinner size="large" />
        </div>
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
                  currentSort={q.sort}
                  onSort={handleSort}
                />
                <SortableMetricHeader
                  label={t('companySales.designerBonus')}
                  column="designer_bonus"
                  currentSort={q.sort}
                  onSort={handleSort}
                />
                <SortableMetricHeader
                  label={t('companySales.platformFee')}
                  column="platform_fee"
                  currentSort={q.sort}
                  onSort={handleSort}
                />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`${analyticsTd} py-8 text-center text-secondary-alpha`}>
                    {t('dashboardV2.noData')}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.designer_id} className={analyticsTbodyRow}>
                    <td className={`${analyticsTd} font-medium text-foreground`}>{r.designer_name}</td>
                    <td className={`${analyticsTd} text-secondary-alpha`}>{r.designer_email}</td>
                    <td className={`${analyticsTd} text-foreground`}>{r.items_sold}</td>
                    <td className={analyticsTdMono}>{money(r.revenue)}</td>
                    <td className={analyticsTdMono}>{money(r.designer_bonus)}</td>
                    <td className={analyticsTdMono}>{money(r.platform_fee)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CompanyAnalyticsProductDesignersPage;
