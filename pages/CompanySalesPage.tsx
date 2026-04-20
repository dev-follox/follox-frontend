import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Spinner from '../components/Spinner';
import { OrderWithDetails } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import Button from '../components/Button';
import { Check, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { isCompanySubscriptionActive } from '../utils/companySubscription';
import { normalizeOrderStatus } from '../utils/orderStatus';
import DashboardOrderStatusBadge from '../components/dashboard/DashboardOrderStatusBadge';
import { formatDateTime } from '../utils/formatDateTime';
import {
  dataTableWrap,
  dataTable,
  dataTheadRow,
  dataTh,
  dataTbodyRow,
  dataTd,
  dataTdMono,
} from '../components/dataTableStyles';

type CompanyOrderRow = OrderWithDetails;

const CompanySalesPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const company = user?.role === 'COMPANY' ? user.company : null;
  const canWrite = isCompanySubscriptionActive(company);
  const [orders, setOrders] = useState<CompanyOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<Record<number, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const list = await api.getOrders(0, 100);
        const detailed = await Promise.all(
          list.map(async (row) => {
            try {
              return await api.getOrderById(row.id);
            } catch {
              return {
                ...row,
                product: null,
                designer: null,
              } as CompanyOrderRow;
            }
          })
        );
        const flat = detailed.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
        setOrders(flat);
      } catch {
        setError(t('company.loadError'));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [t]);

  /** Optimistic status after confirm/reject until the list is reloaded. */
  const displayStatus = (row: CompanyOrderRow) => localStatus[row.id] ?? row.status;

  const handleConfirm = async (row: CompanyOrderRow) => {
    try {
      await api.updateOrderStatus(row.id, 'processed');
      setLocalStatus((prev) => ({ ...prev, [row.id]: 'processed' }));
    } catch {
      setError(t('company.updateError'));
    }
  };

  const handleReject = async (row: CompanyOrderRow) => {
    try {
      await api.updateOrderStatus(row.id, 'cancelled');
      setLocalStatus((prev) => ({ ...prev, [row.id]: 'cancelled' }));
    } catch {
      setError(t('company.updateError'));
    }
  };

  const showConfirmReject = (row: CompanyOrderRow) =>
    normalizeOrderStatus(displayStatus(row)) === 'waiting_to_process' && canWrite;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }
  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      {!canWrite && (
        <div className="rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
          {t('subscription.readOnlyNotice')}
        </div>
      )}
      <h1 className="text-2xl font-bold text-foreground">{t('sidebar.sales')}</h1>

      <div className={dataTableWrap}>
        <table className={dataTable}>
          <thead>
            <tr className={dataTheadRow}>
              <th className={dataTh}>{t('companySales.date')}</th>
              <th className={dataTh}>{t('companySales.designer')}</th>
              <th className={dataTh}>{t('companySales.product')}</th>
              <th className={dataTh}>{t('companySales.amount')}</th>
              <th className={dataTh}>{t('companySales.designerBonus')}</th>
              <th className={dataTh}>{t('companySales.platformFee')}</th>
              <th className={dataTh}>{t('companySales.status')}</th>
              <th className={dataTh} />
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td className={`${dataTd} py-8 text-center text-secondary-alpha`} colSpan={8}>
                  {t('dashboardV2.noData')}
                </td>
              </tr>
            ) : (
              orders.map((row) => (
                <tr key={row.id} className={dataTbodyRow}>
                  <td className={`${dataTd} whitespace-nowrap`}>{formatDateTime(row.created_at)}</td>
                  <td className={dataTd}>{row.designer?.name ?? `ID ${row.designer_id}`}</td>
                  <td className={dataTd}>{row.product?.name ?? `#${row.product_id}`}</td>
                  <td className={`${dataTdMono} whitespace-nowrap`}>
                    {new Intl.NumberFormat().format(row.price_per_item * row.quantity)} ₸
                  </td>
                  <td className={`${dataTdMono} whitespace-nowrap`}>
                    {new Intl.NumberFormat().format(row.designer_bonus_amount)} ₸
                  </td>
                  <td className={`${dataTdMono} whitespace-nowrap`}>
                    {new Intl.NumberFormat().format(row.platform_fee_amount)} ₸
                  </td>
                  <td className={dataTd}>
                    <DashboardOrderStatusBadge status={displayStatus(row)} />
                  </td>
                  <td className={dataTd}>
                    <div className="flex gap-1">
                      {showConfirmReject(row) && (
                        <>
                          <Button size="sm" variant="secondary" title="Confirm" onClick={() => void handleConfirm(row)}>
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="sm" variant="secondary" title="Reject" onClick={() => void handleReject(row)}>
                            <X className="h-4 w-4 text-danger" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompanySalesPage;
