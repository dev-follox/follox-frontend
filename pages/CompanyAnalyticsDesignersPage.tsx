import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import type { CompanyDesignerAnalyticsRow, CompanyAnalyticsSort } from '../types';
import Spinner from '../components/Spinner';
import Button from '../components/Button';
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
import { Filter } from 'lucide-react';

const toLocalInput = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const CompanyAnalyticsDesignersPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = readAnalyticsQuery(searchParams.toString());

  const [filterOpen, setFilterOpen] = useState(false);
  const [fromInput, setFromInput] = useState(toLocalInput(initial.from));
  const [toInput, setToInput] = useState(toLocalInput(initial.to));
  const [sort, setSort] = useState<CompanyAnalyticsSort>(initial.sort);
  const [rows, setRows] = useState<CompanyDesignerAnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = readAnalyticsQuery(searchParams.toString());
    setFromInput(toLocalInput(next.from));
    setToInput(toLocalInput(next.to));
    setSort(next.sort);
  }, [searchParams]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getCompanyDesignerAnalytics({
        sort,
        from: fromInput ? new Date(fromInput).toISOString() : null,
        to: toInput ? new Date(toInput).toISOString() : null,
      });
      setRows(data);
    } catch {
      setError(t('companyAnalytics.loadError'));
    } finally {
      setLoading(false);
    }
  }, [sort, fromInput, toInput, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const pushQuery = (next: { from?: string; to?: string; sort: CompanyAnalyticsSort }) => {
    const qs = companyAnalyticsQueryString({
      from: next.from ?? (fromInput || undefined),
      to: next.to ?? (toInput || undefined),
      sort: next.sort,
    });
    setSearchParams(new URLSearchParams(qs.replace(/^\?/, '')));
  };

  const applyDateFilters = () => {
    pushQuery({ sort, from: fromInput || undefined, to: toInput || undefined });
    void load();
  };

  const handleSort = (column: CompanyAnalyticsSort) => {
    setSort(column);
    pushQuery({ sort: column, from: fromInput || undefined, to: toInput || undefined });
  };

  const money = (n: number) => `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n)} ₸`;

  const detailHref = (designerId: number) =>
    `/company/analytics/designers/${designerId}${companyAnalyticsQueryString({
      from: fromInput || undefined,
      to: toInput || undefined,
      sort,
    })}`;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">{t('companyAnalytics.designersTitle')}</h1>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="inline-flex items-center gap-2 rounded-lg"
          onClick={() => setFilterOpen((v) => !v)}
        >
          <Filter className="h-4 w-4" strokeWidth={1.5} />
          {t('companyAnalytics.filter')}
        </Button>
      </div>

      {filterOpen && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-3 text-sm font-medium text-foreground">{t('companyAnalytics.filterTitle')}</p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="datetime-local"
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
              value={fromInput}
              onChange={(e) => setFromInput(e.target.value)}
            />
            <span className="text-sm text-secondary-alpha">-</span>
            <input
              type="datetime-local"
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
            />
            <Button type="button" className="rounded-lg" onClick={() => void applyDateFilters()}>
              {t('companyAnalytics.apply')}
            </Button>
          </div>
        </div>
      )}

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
                  currentSort={sort}
                  onSort={handleSort}
                />
                <SortableMetricHeader
                  label={t('companySales.designerBonus')}
                  column="designer_bonus"
                  currentSort={sort}
                  onSort={handleSort}
                />
                <SortableMetricHeader
                  label={t('companySales.platformFee')}
                  column="platform_fee"
                  currentSort={sort}
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
                    <td className={analyticsTd}>
                      <Link to={detailHref(r.designer_id)} className="font-medium text-primary hover:underline">
                        {r.designer_name}
                      </Link>
                    </td>
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

export default CompanyAnalyticsDesignersPage;
