import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, Clock, DollarSign, Link2, ListOrdered, Store } from 'lucide-react';
import api from '../services/api';
import { AffiliateLinkWithRollup, OrderWithDetails } from '../types';
import Spinner from '../components/Spinner';
import StatCard from '../components/dashboard/StatCard';
import DashboardOrderStatusBadge from '../components/dashboard/DashboardOrderStatusBadge';
import { useTranslation } from '../hooks/useTranslation';

const DesignerProductsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [myLinks, setMyLinks] = useState<AffiliateLinkWithRollup[]>([]);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [earned, setEarned] = useState(0);
  const [awaiting, setAwaiting] = useState(0);
  const [readyToWithdraw, setReadyToWithdraw] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const money = (value: number) =>
    `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value)} ₸`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [stats, links, myOrders] = await Promise.all([
          api.getMyStats(),
          api.getMyAffiliateLinks(),
          api.getMyOrders(),
        ]);

        const totalBonus = stats.reduce((sum, s) => sum + (s.designer_bonus_paid ?? s.commission_paid ?? 0), 0);
        const totalRevenue = stats.reduce((sum, s) => sum + (s.revenue ?? s.money_earned ?? 0), 0);
        setEarned(totalBonus > 0 ? totalBonus : totalRevenue * 0.1);
        setAwaiting(Math.max(totalBonus * 0.2, 0));
        setReadyToWithdraw(Math.max(totalBonus * 0.8, 0));

        setMyLinks(links);
        setOrders(myOrders.slice(0, 10));
      } catch {
        setError(t('designerProducts.loadError'));
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [t]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-destructive">{error}</div>;
  }

  return (
    <div className="designer-products-page space-y-5 p-4 md:p-8">
      <div>
        <h1 className="text-xl font-bold uppercase tracking-wide text-foreground md:text-2xl">{t('designerProducts.title')}</h1>
        <p className="mt-1 text-sm text-secondary-alpha">{t('designerProducts.dashboardSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label={t('landingV2.demo.designer.stats.earnedThisMonth')} value={money(earned)} icon={Banknote} />
        <StatCard label={t('landingV2.demo.designer.stats.awaitingConfirmation')} value={money(awaiting)} icon={Clock} />
        <StatCard label={t('landingV2.demo.designer.stats.readyToWithdraw')} value={money(readyToWithdraw)} icon={DollarSign} />
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
            <Link2 className="h-4 w-4 text-primary" strokeWidth={1.5} />
            {t('landingV2.demo.designer.myAffiliateLinks')}
          </h2>
          <p className="mt-1 text-xs text-secondary-alpha">{t('designerProducts.linksHint')}</p>
        </div>
        {myLinks.length === 0 ? (
          <p className="text-sm text-secondary-alpha">{t('dashboardV2.noData')}</p>
        ) : (
          <div className="grid gap-2">
            {myLinks.map((link) => {
              const rev = link.revenue ?? 0;
              const bonus = link.designer_bonus_paid ?? link.commission_paid ?? 0;
              return (
                <div
                  key={link.id}
                  className="flex flex-col gap-3 border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-border/60 bg-background/40">
                      <Store className="h-4 w-4 text-stone" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{link.product?.name ?? `#${link.product_id}`}</p>
                      <p className="mt-0.5 text-xs text-secondary-alpha">
                        {t('designerProducts.effectiveBonus')}:{' '}
                        <span className="font-mono font-semibold text-primary">{link.effective_bonus_percent}%</span>
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-secondary-alpha">
                        <span>
                          {t('productDetails.analytics.revenue')}: {money(rev)}
                        </span>
                        <span>
                          {t('companySales.designerBonus')}: {money(bonus)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                      onClick={() => navigate(`/designers/links/${link.id}`)}
                    >
                      {t('designerProducts.analytics')}
                    </button>
                    <button
                      type="button"
                      className="text-sm font-medium text-secondary-alpha underline-offset-2 hover:text-foreground hover:underline"
                      onClick={() => navigate(`/designers/products/${link.product_id}`)}
                    >
                      {t('designerProducts.linkAndProduct')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
          <ListOrdered className="h-4 w-4 text-primary" strokeWidth={1.5} />
          {t('landingV2.demo.designer.orderHistory')}
        </h2>
        {orders.length === 0 ? (
          <p className="text-sm text-secondary-alpha">{t('dashboardV2.noData')}</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <div
                key={o.id}
                className="flex flex-col gap-2 border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{o.product?.name ?? `#${o.product_id}`}</p>
                  <p className="text-xs text-secondary-alpha">{o.client_phone}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-sm font-semibold text-foreground">{money(o.price_per_item * o.quantity)}</span>
                  <DashboardOrderStatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignerProductsPage;
