import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, Order, Analytics, OrderStatusValue } from '../types';
import api from '../services/api';
import Spinner from '../components/Spinner';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import ProductForm from '../components/ProductForm';
import { format } from 'date-fns';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { isCompanySubscriptionActive } from '../utils/companySubscription';
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

type Tab = 'orders' | 'analytics';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const { t } = useTranslation();
  const n = normalizeOrderStatus(status);
  const colorClasses = {
    waiting_to_process: 'bg-warning/15 text-warning border border-warning/40',
    processed: 'bg-primary/15 text-primary border border-primary/40',
    cancelled: 'bg-destructive/15 text-destructive border border-destructive/40',
  };
  const label =
    n === 'processed'
      ? t('productDetails.orders.statusProcessed')
      : n === 'cancelled'
        ? t('productDetails.orders.statusCancelled')
        : t('productDetails.orders.statusWaiting');
  return (
    <span className={`inline-flex border px-2 py-0.5 text-xs font-semibold leading-5 ${colorClasses[n]}`}>
      {label}
    </span>
  );
};

const ShopProductDetailsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const company = user?.role === 'COMPANY' ? user.company : null;
  const canWrite = isCompanySubscriptionActive(company);
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const fetchData = useCallback(async () => {
    if (!productId) return;
    try {
      setLoading(true);
      const [productData, ordersData, analyticsData] = await Promise.all([
        api.getProduct(parseInt(productId, 10)),
        api.getProductOrders(parseInt(productId, 10)),
        api.getProductAnalytics(parseInt(productId, 10)),
      ]);
      setProduct(productData);
      setOrders(ordersData);
      setAnalytics(analyticsData);
    } catch {
      setError(t('productDetails.loadError'));
    } finally {
      setLoading(false);
    }
  }, [productId, t]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleUpdateStatus = async (orderId: number, status: OrderStatusValue) => {
    setUpdatingOrderId(orderId);
    try {
      await api.updateOrderStatus(orderId, status);
      await fetchData();
    } catch {
      alert(t('productDetails.statusUpdateError'));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleEditClick = () => {
    if (!product) return;
    setIsEditDialogOpen(true);
  };

  const handleUpdateProduct = async (data: {
    name: string;
    description?: string;
    designer_task_description?: string;
    price: number;
    image_url?: string;
  }) => {
    if (!product) return;

    setIsUpdating(true);
    try {
      const updatedProduct = await api.updateProduct(product.id, {
        name: data.name,
        description: data.description || null,
        designer_task_description: data.designer_task_description || null,
        price: data.price,
        image_url: data.image_url || null,
      });
      setProduct(updatedProduct);
      setIsEditDialogOpen(false);
    } catch {
      alert(t('productDetails.updateError'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!product) return;

    setIsDeleting(true);
    try {
      await api.deleteProduct(product.id);
      navigate('/company/catalog');
    } catch {
      alert(t('productDetails.deleteError'));
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-destructive">{error}</div>;
  }

  if (!product) {
    return <div className="p-6 text-center text-secondary-alpha">{t('productDetails.notFound')}</div>;
  }

  return (
    <div className="h-full w-full p-4 md:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 pr-4">
          <h1 className="mb-2 text-3xl font-bold text-foreground">{product.name}</h1>
          <p className="mb-4 text-lg text-secondary-alpha">₸{product.price.toFixed(2)}</p>
        </div>
        <div className="flex shrink-0 space-x-2">
          <Button onClick={handleEditClick} variant="secondary" size="sm" disabled={!canWrite}>
            {t('productDetails.edit')}
          </Button>
          <Button onClick={handleDeleteClick} variant="danger" size="sm" disabled={!canWrite}>
            {t('common.delete')}
          </Button>
        </div>
      </div>
      {product.description && (
        <div className="relative mb-8 border-b border-border pb-6">
          <div
            className={`text-sm leading-relaxed text-secondary-alpha ${
              isDescriptionExpanded ? '' : 'line-clamp-3 max-h-[4.5rem]'
            }`}
            style={
              !isDescriptionExpanded
                ? {
                    WebkitMaskImage:
                      'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0) 100%)',
                    maskImage:
                      'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0) 100%)',
                  }
                : undefined
            }
          >
            {product.description}
          </div>
          {product.description.length > 150 && (
            <button
              type="button"
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              className="relative z-10 mt-1 text-sm font-medium text-primary hover:underline"
            >
              {isDescriptionExpanded ? t('productDetails.collapse') : t('productDetails.expand')}
            </button>
          )}
        </div>
      )}

      <ProductForm
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        product={product}
        onSubmit={handleUpdateProduct}
        isLoading={isUpdating}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={t('productDetails.deleteTitle')}
        message={t('productDetails.deleteMessage')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        confirmVariant="danger"
        isLoading={isDeleting}
      />

      <div className="border-b border-border">
        <nav className="-mb-px flex gap-8" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'orders'
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary-alpha hover:border-border hover:text-foreground'
            }`}
          >
            {t('productDetails.tabs.orders')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary-alpha hover:border-border hover:text-foreground'
            }`}
          >
            {t('productDetails.tabs.analytics')}
          </button>
        </nav>
      </div>

      <div className="mt-8">
        {activeTab === 'orders' && (
          <div className={dataTableWrap}>
            <table className={dataTable}>
              <thead>
                <tr className={dataTheadRow}>
                  <th className={dataTh}>{t('productDetails.orders.created')}</th>
                  <th className={dataTh}>{t('productDetails.orders.clientPhone')}</th>
                  <th className={dataTh}>{t('productDetails.orders.quantity')}</th>
                  <th className={dataTh}>{t('productDetails.orders.total')}</th>
                  <th className={dataTh}>{t('productDetails.orders.status')}</th>
                  <th className={`${dataTh} text-right`}>
                    <span className="sr-only">{t('productDetails.orders.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={`${dataTd} py-8 text-center text-secondary-alpha`}>
                      {t('productDetails.orders.noOrders')}
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className={dataTbodyRow}>
                      <td className={`${dataTd} whitespace-nowrap font-medium text-foreground`}>
                        {format(new Date(order.created_at), 'dd.MM.yyyy HH:mm')}
                      </td>
                      <td className={`${dataTd} whitespace-nowrap text-foreground`}>{order.client_phone}</td>
                      <td className={dataTdMono}>{order.quantity}</td>
                      <td className={dataTdMono}>₸{(order.quantity * order.price_per_item).toFixed(2)}</td>
                      <td className={dataTd}>
                        <StatusBadge status={order.status} />
                      </td>
                      <td className={`${dataTd} text-right`}>
                        {normalizeOrderStatus(order.status) === 'waiting_to_process' && canWrite && (
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <Button
                              onClick={() => void handleUpdateStatus(order.id, 'processed')}
                              variant="success"
                              size="sm"
                              isLoading={updatingOrderId === order.id}
                            >
                              {t('productDetails.orders.process')}
                            </Button>
                            <Button
                              onClick={() => void handleUpdateStatus(order.id, 'cancelled')}
                              variant="danger"
                              size="sm"
                              isLoading={updatingOrderId === order.id}
                            >
                              {t('productDetails.orders.cancel')}
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'analytics' && (
          <div className={dataTableWrap}>
            <table className={dataTable}>
              <thead>
                <tr className={dataTheadRow}>
                  <th className={dataTh}>{t('productDetails.analytics.designer')}</th>
                  <th className={dataTh}>{t('productDetails.analytics.visits')}</th>
                  <th className={dataTh}>{t('productDetails.analytics.orders')}</th>
                  <th className={dataTh}>{t('productDetails.analytics.sold')}</th>
                  <th className={dataTh}>{t('productDetails.analytics.revenue')}</th>
                </tr>
              </thead>
              <tbody>
                {analytics.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={`${dataTd} py-8 text-center text-secondary-alpha`}>
                      {t('productDetails.analytics.noData')}
                    </td>
                  </tr>
                ) : (
                  analytics.map((analytic) => (
                    <tr key={analytic.id} className={dataTbodyRow}>
                      <td className={`${dataTd} font-medium text-foreground`}>
                        {analytic.designer?.name || `${t('common.designer')} ${analytic.designer_id}`}
                      </td>
                      <td className={dataTdMono}>{analytic.visit_count}</td>
                      <td className={dataTdMono}>{analytic.order_count}</td>
                      <td className={dataTdMono}>{analytic.items_sold}</td>
                      <td className={`${dataTdMono} font-semibold`}>
                        ₸{(analytic.revenue ?? analytic.money_earned ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopProductDetailsPage;
