import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import type { CompanyDesignerProductBreakdownRow, CompanyAnalyticsSort } from '../types';
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

const CompanyAnalyticsDesignerProductsPage: React.FC = () => {
  const { designerId: designerIdParam } = useParams<{ designerId: string }>();
  const designerId = designerIdParam ? parseInt(designerIdParam, 10) : NaN;
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const q = readAnalyticsQuery(searchParams.toString());

  const [rows, setRows] = useState<CompanyDesignerProductBreakdownRow[]>([]);
  const [designerName, setDesignerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const qs = companyAnalyticsQueryString({ from: q.from, to: q.to, sort: q.sort });

  const handleSort = (column: CompanyAnalyticsSort) => {
    const next = companyAnalyticsQueryString({ from: q.from, to: q.to, sort: column });
    setSearchParams(new URLSearchParams(next.replace(/^\?/, '')));
  };

  const load = useCallback(async () => {
    if (!Number.isFinite(designerId)) return;
    try {
      setLoading(true);
      setError(null);
      const [data, designers] = await Promise.all([
        api.getCompanyDesignerProductBreakdown(designerId, {
          sort: q.sort,
          from: q.from ?? null,
          to: q.to ?? null,
        }),
        api.getCompanyDesigners().catch(() => []),
      ]);
      setRows(data);
      const match = designers.find((d) => d.designer_id === designerId);
      if (match) setDesignerName(match.designer.name);
    } catch {
      setError(t('companyAnalytics.loadError'));
    } finally {
      setLoading(false);
    }
  }, [designerId, q.sort, q.from, q.to, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const money = (n: number) => `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n)} ₸`;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <Link
        to={`/company/analytics/designers${qs}`}
        className="inline-flex items-center gap-1 text-sm text-secondary-alpha hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('companyAnalytics.backDesigners')}
      </Link>

      <h1 className="text-2xl font-bold text-foreground">
        {designerName ?? t('companyAnalytics.designerProductsTitle')}
      </h1>

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
                <th className={analyticsTh}>{t('companyAnalytics.product')}</th>
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
                  <td colSpan={5} className={`${analyticsTd} py-8 text-center text-secondary-alpha`}>
                    {t('dashboardV2.noData')}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.product_id} className={analyticsTbodyRow}>
                    <td className={`${analyticsTd} font-medium text-foreground`}>{r.product_name}</td>
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

export default CompanyAnalyticsDesignerProductsPage;
