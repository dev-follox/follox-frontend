import React from 'react';
import { Anchor, ArrowDown } from 'lucide-react';
import type { CompanyAnalyticsSort } from '../../types';
import { dataTh } from '../dataTableStyles';

interface Props {
  label: string;
  column: CompanyAnalyticsSort;
  currentSort: CompanyAnalyticsSort;
  onSort: (column: CompanyAnalyticsSort) => void;
}

export const SortableMetricHeader: React.FC<Props> = ({ label, column, currentSort, onSort }) => {
  const active = currentSort === column;
  return (
    <th className={`${dataTh} text-left`}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`inline-flex w-full items-center justify-start gap-1.5 text-left text-xs font-medium transition-colors hover:text-primary ${
          active ? 'text-primary' : 'text-secondary-alpha'
        }`}
      >
        <span>{label}</span>
        <ArrowDown className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-primary' : 'opacity-60'}`} strokeWidth={2} aria-hidden />
      </button>
    </th>
  );
};
