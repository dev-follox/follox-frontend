import React from 'react';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  HelpCircle,
  PackageCheck,
  Truck,
  Undo2,
  XCircle,
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { normalizeOrderStatus, orderStatusLabel, type NormalizedOrderStatus } from '../../utils/orderStatus';

const BADGE: Record<
  NormalizedOrderStatus,
  { cls: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  waiting_to_process: { cls: 'text-amber-700 bg-amber-500/15', Icon: AlertCircle },
  processed: { cls: 'text-primary bg-primary/15', Icon: CheckCircle2 },
  cancelled: {
    cls: 'border border-danger/50 bg-danger/15 text-danger',
    Icon: XCircle,
  },
  paid: { cls: 'text-emerald-800 bg-emerald-100', Icon: Banknote },
  shipped: { cls: 'text-sky-800 bg-sky-100', Icon: Truck },
  delivered: { cls: 'text-teal-800 bg-teal-100', Icon: PackageCheck },
  refunded: { cls: 'text-violet-800 bg-violet-100', Icon: Undo2 },
  unknown: { cls: 'text-gray-600 bg-gray-100', Icon: HelpCircle },
};

/** Status pill with icon + localized label for any backend / display status string. */
const DashboardOrderStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const { t } = useTranslation();
  const n = normalizeOrderStatus(status);
  const cfg = BADGE[n];
  const Icon = cfg.Icon;
  const label = orderStatusLabel(t, status);

  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
      <Icon className="h-3 w-3 shrink-0" />
      {label}
    </span>
  );
};

export default DashboardOrderStatusBadge;
