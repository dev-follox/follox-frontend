import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock,
  DollarSign,
  Link2,
  Percent,
  Store,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

const topDesigners = [
  { name: 'Aigerim S.', revenue: '420 000 ₸', commission: '9%', rising: true },
  { name: 'Marat A.', revenue: '310 000 ₸', commission: '7%', rising: false },
  { name: 'Dana K.', revenue: '245 000 ₸', commission: '6%', rising: false },
  { name: 'Artem K.', revenue: '165 000 ₸', commission: '5%', rising: true },
];

const companyOrders = [
  { product: 'Crystal Grand Chandelier', designer: 'Aigerim S.', amount: '245 000 ₸', status: 'pending' },
  { product: 'Nordic Floor Lamp', designer: 'Marat A.', amount: '78 000 ₸', status: 'confirmed' },
  { product: 'Loft Wall Sconce', designer: 'Dana K.', amount: '32 000 ₸', status: 'payable' },
];

const designerLinks = [
  { name: 'LightHouse', commission: '9%', rising: true },
  { name: 'Furniture & Style', commission: '4%', rising: false },
  { name: 'CeramicsPro', commission: '6%', rising: true },
];

const designerOrders = [
  { product: 'Crystal Grand Chandelier', company: 'LightHouse', amount: '245 000 ₸', status: 'paid' },
  { product: 'Elegance Chair', company: 'Furniture & Style', amount: '89 000 ₸', status: 'confirmed' },
  { product: 'Marble Tiles', company: 'CeramicsPro', amount: '56 000 ₸', status: 'pending' },
];

function StatusBadge({ status, label }: { status: string; label: string }) {
  const cfg =
    ({
      pending: { cls: 'text-stone bg-stone/10', icon: AlertCircle },
      confirmed: { cls: 'text-primary bg-primary/10', icon: CheckCircle2 },
      payable: { cls: 'text-warning bg-warning/10', icon: Banknote },
      paid: { cls: 'text-foreground/60 bg-foreground/5', icon: CheckCircle2 },
    } as const)[status] || { cls: 'text-stone bg-stone/10', icon: AlertCircle };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
      <cfg.icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function RisingBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
      <TrendingUp className="h-3 w-3" /> %↑
    </span>
  );
}

const StatCard: React.FC<{ label: string; value: string; icon: typeof Users }> = ({ label, value, icon: Icon }) => {
  return (
    <div className="border border-border bg-card p-4">
      <div className="mb-1 flex items-center gap-2 text-xs text-secondary-alpha">
        <Icon className="h-3.5 w-3.5 text-stone" strokeWidth={1.5} />
        {label}
      </div>
      <div className="font-mono text-lg font-bold text-foreground">{value}</div>
    </div>
  );
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function DemoPreview({ open, onClose }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'company' | 'designer'>('company');

  const companyStats = [
    { label: t('landingV2.demo.company.stats.activeDesigners'), value: '6', icon: Users },
    { label: t('landingV2.demo.company.stats.revenueThisMonth'), value: '1 240 000 ₸', icon: DollarSign },
    { label: t('landingV2.demo.company.stats.pendingPayouts'), value: '87 300 ₸', icon: Clock },
    { label: t('landingV2.demo.company.stats.platformCommission'), value: '4 365 ₸', icon: Percent },
  ];

  const designerStats = [
    { label: t('landingV2.demo.designer.stats.earnedThisMonth'), value: '37 800 ₸', icon: Banknote },
    { label: t('landingV2.demo.designer.stats.awaitingConfirmation'), value: '12 250 ₸', icon: Clock },
    { label: t('landingV2.demo.designer.stats.readyToWithdraw'), value: '25 550 ₸', icon: DollarSign },
  ];

  const statusLabel = (status: string) => {
    const key =
      ({
        pending: 'landingV2.demo.status.pending',
        confirmed: 'landingV2.demo.status.confirmed',
        payable: 'landingV2.demo.status.payable',
        paid: 'landingV2.demo.status.paid',
      } as const)[status] || 'landingV2.demo.status.pending';
    return t(key);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
            className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden border border-border bg-sidebar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-bold uppercase tracking-wide text-foreground">{t('landingV2.demo.title')}</h2>
              <button onClick={onClose} className="text-secondary-alpha transition-colors hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 pt-4">
              <div className="flex gap-6 border-b border-border">
                <button
                  onClick={() => setTab('company')}
                  className={`-mb-px flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
                    tab === 'company'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-secondary-alpha hover:text-foreground'
                  }`}
                >
                  <Store className="h-4 w-4" /> {t('landingV2.demo.tabs.forCompanies')}
                </button>
                <button
                  onClick={() => setTab('designer')}
                  className={`-mb-px flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
                    tab === 'designer'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-secondary-alpha hover:text-foreground'
                  }`}
                >
                  <Users className="h-4 w-4" /> {t('landingV2.demo.tabs.forDesigners')}
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {tab === 'company' ? (
                <>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {companyStats.map((s, i) => (
                      <StatCard key={i} label={String(s.label)} value={s.value} icon={s.icon} />
                    ))}
                  </div>

                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                      <TrendingUp className="h-4 w-4 text-primary" /> {t('landingV2.demo.company.topDesigners')}
                    </h3>
                    <div className="overflow-hidden border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-xs text-secondary-alpha">
                            <th className="px-4 py-2.5 text-left font-medium">{t('landingV2.demo.company.table.designer')}</th>
                            <th className="px-4 py-2.5 text-right font-medium">{t('landingV2.demo.company.table.revenue')}</th>
                            <th className="px-4 py-2.5 text-right font-medium">{t('landingV2.demo.company.table.commission')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topDesigners.map((d, i) => (
                            <tr key={i} className={`border-b border-border/50 last:border-0 ${i % 2 === 1 ? 'bg-foreground/[0.03]' : ''}`}>
                              <td className="px-4 py-2.5 font-medium text-foreground">
                                <span className="flex items-center gap-2">
                                  {d.name}
                                  {d.rising && <RisingBadge />}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-foreground">{d.revenue}</td>
                              <td className="px-4 py-2.5 text-right font-mono font-semibold text-primary">{d.commission}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">{t('landingV2.demo.company.recentOrders')}</h3>
                    <div className="space-y-2">
                      {companyOrders.map((s, i) => (
                        <div key={i} className="flex items-center justify-between border border-border bg-card px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{s.product}</p>
                            <p className="text-xs text-secondary-alpha">{s.designer}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm font-semibold text-foreground">{s.amount}</span>
                            <StatusBadge status={s.status} label={statusLabel(s.status)} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {designerStats.map((s, i) => (
                      <StatCard key={i} label={String(s.label)} value={s.value} icon={s.icon} />
                    ))}
                  </div>

                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                      <Link2 className="h-4 w-4 text-primary" /> {t('landingV2.demo.designer.myAffiliateLinks')}
                    </h3>
                    <div className="grid gap-2">
                      {designerLinks.map((s, i) => (
                        <div key={i} className="flex items-center justify-between border border-border bg-card px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center">
                              <Store className="h-4 w-4 text-stone" strokeWidth={1.5} />
                            </div>
                            <span className="text-sm font-medium text-foreground">{s.name}</span>
                            {s.rising && <RisingBadge />}
                          </div>
                          <span className="font-mono text-sm font-semibold text-primary">{s.commission}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">{t('landingV2.demo.designer.orderHistory')}</h3>
                    <div className="space-y-2">
                      {designerOrders.map((s, i) => (
                        <div key={i} className="flex items-center justify-between border border-border bg-card px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{s.product}</p>
                            <p className="text-xs text-secondary-alpha">{s.company}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm font-semibold text-foreground">{s.amount}</span>
                            <StatusBadge status={s.status} label={statusLabel(s.status)} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
