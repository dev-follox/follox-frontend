import React from 'react';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { normalizeOrderStatus } from '../../utils/orderStatus';

/** Status pill styled like the landing demo modal order rows. */
const DashboardOrderStatusBadge: React.FC<{ status: string; label: string }> = ({ status, label }) => {
  const n = normalizeOrderStatus(status);
  const cfg =
    n === 'waiting_to_process'
      ? { cls: 'text-stone bg-stone/10', Icon: AlertCircle }
      : n === 'processed'
        ? { cls: 'text-primary bg-primary/10', Icon: CheckCircle2 }
        : { cls: 'text-destructive bg-destructive/10', Icon: XCircle };
  const Icon = cfg.Icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
      <Icon className="h-3 w-3 shrink-0" />
      {label}
    </span>
  );
};

export default DashboardOrderStatusBadge;
