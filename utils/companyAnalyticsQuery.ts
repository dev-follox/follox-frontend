import type { CompanyAnalyticsSort } from '../types';

const SORTS: CompanyAnalyticsSort[] = ['revenue', 'designer_bonus', 'platform_fee'];

export function parseCompanyAnalyticsSort(value: string | null): CompanyAnalyticsSort {
  if (value && SORTS.includes(value as CompanyAnalyticsSort)) return value as CompanyAnalyticsSort;
  return 'revenue';
}

/** Build query string for analytics drill-down links (from/to as ISO UTC). */
export function companyAnalyticsQueryString(params: {
  from?: string;
  to?: string;
  sort?: CompanyAnalyticsSort;
}): string {
  const p = new URLSearchParams();
  if (params.from?.trim()) p.set('from', new Date(params.from).toISOString());
  if (params.to?.trim()) p.set('to', new Date(params.to).toISOString());
  if (params.sort) p.set('sort', params.sort);
  const s = p.toString();
  return s ? `?${s}` : '';
}

export function readAnalyticsQuery(search: string): {
  from?: string;
  to?: string;
  sort: CompanyAnalyticsSort;
} {
  const p = new URLSearchParams(search);
  const from = p.get('from') ?? undefined;
  const to = p.get('to') ?? undefined;
  const sort = parseCompanyAnalyticsSort(p.get('sort'));
  return { from, to, sort };
}
