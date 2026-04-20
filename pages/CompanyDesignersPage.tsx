import React, { useCallback, useEffect, useState } from 'react';
import {
  Analytics,
  DesignerCompanyWithDesigner,
  DesignerInvite,
  DesignerInviteCreate,
} from '../types';
import api from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import Spinner from '../components/Spinner';
import Dialog from '../components/Dialog';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { isCompanySubscriptionActive } from '../utils/companySubscription';
import { formatDateTime } from '../utils/formatDateTime';
import { MailPlus } from 'lucide-react';
import {
  dataTableWrap,
  dataTable,
  dataTheadRow,
  dataTh,
  dataTbodyRow,
  dataTd,
  dataTdMono,
} from '../components/dataTableStyles';

const CompanyDesignersPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, setCompanyData } = useAuth();
  const [rows, setRows] = useState<DesignerCompanyWithDesigner[]>([]);
  const [perLink, setPerLink] = useState<Analytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [lastInvite, setLastInvite] = useState<DesignerInvite | null>(null);
  const [copied, setCopied] = useState(false);

  const [overrideDraft, setOverrideDraft] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const company = user?.role === 'COMPANY' ? user.company : null;
  const canWrite = isCompanySubscriptionActive(company);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [designerRows, dash] = await Promise.all([
        api.getCompanyDesigners(),
        api.getAnalyticsDashboard().catch(() => null),
      ]);
      setRows(designerRows);
      setPerLink(dash?.per_link ?? []);
      setError(null);
    } catch {
      setError(t('designers.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const magicUrl = (token: string) => `${window.location.origin}/designers/invites/${token}`;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteBusy(true);
    setError(null);
    try {
      const body: DesignerInviteCreate = { designer_email: inviteEmail.trim() };
      const inv = await api.createDesignerInvite(body);
      setLastInvite(inv);
      setInviteEmail('');
      if (company) {
        try {
          const fresh = await api.getCompanyMe();
          setCompanyData(fresh);
        } catch {
          /* ignore */
        }
      }
    } catch (err: unknown) {
      const er = err as { response?: { data?: { detail?: string } } };
      setError(er?.response?.data?.detail ?? t('designers.inviteError'));
    } finally {
      setInviteBusy(false);
    }
  };

  const handleSaveOverride = async (designerId: number) => {
    const raw = overrideDraft[designerId]?.trim();
    let value: number | null;
    if (raw === undefined || raw === '') {
      value = null;
    } else {
      const n = Number(raw);
      if (Number.isNaN(n) || n < 0 || n > 100) {
        setError(t('designers.bonusInvalid'));
        return;
      }
      value = n;
    }
    setSavingId(designerId);
    setError(null);
    try {
      await api.patchDesignerBonus(designerId, { bonus_percent_override: value });
      await load();
      setOverrideDraft((prev) => {
        const next = { ...prev };
        delete next[designerId];
        return next;
      });
    } catch {
      setError(t('designers.bonusSaveError'));
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteLink = async (linkId: number) => {
    if (!window.confirm(t('designers.confirmDeleteLink'))) return;
    setError(null);
    try {
      await api.deleteCompanyAffiliateLink(linkId);
      await load();
    } catch {
      setError(t('designers.deleteLinkError'));
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="designers-page space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('designers.title')}</h1>
        <Button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg"
          onClick={() => setInviteOpen(true)}
          disabled={!canWrite}
        >
          <MailPlus className="h-4 w-4" strokeWidth={1.5} />
          {t('designers.inviteDesignerCta')}
        </Button>
      </div>

      {!canWrite && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
          {t('subscription.readOnlyNotice')}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-foreground">{error}</div>
      )}

      <Dialog
        isOpen={inviteOpen}
        onClose={() => {
          if (inviteBusy) return;
          setInviteOpen(false);
          setLastInvite(null);
        }}
        title={t('designers.inviteSection')}
        onSubmit={handleInvite}
        actions={
          lastInvite
            ? [
                {
                  label: t('common.close'),
                  variant: 'primary',
                  type: 'button',
                  onClick: () => {
                    setInviteOpen(false);
                    setLastInvite(null);
                  },
                },
              ]
            : [
                {
                  label: t('designers.sendInvite'),
                  variant: 'primary',
                  type: 'submit',
                  disabled: !canWrite,
                  isLoading: inviteBusy,
                },
                {
                  label: t('common.cancel'),
                  variant: 'secondary',
                  type: 'button',
                  disabled: inviteBusy,
                  onClick: () => setInviteOpen(false),
                },
              ]
        }
      >
        <p className="text-sm text-secondary-alpha">{t('designers.inviteModalHint')}</p>
        <Input
          id="designer-invite-email"
          type="email"
          label={t('designers.inviteEmail')}
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          disabled={!canWrite}
          required
        />

        {lastInvite && (
          <div className="space-y-3 rounded-lg border border-border bg-background/50 p-4">
            <p className="text-sm font-medium text-foreground">{t('designers.inviteCreated')}</p>
            <p className="text-xs text-secondary-alpha">
              {t('designers.inviteExpires')}: {formatDateTime(lastInvite.expires_at)}
            </p>
            <div className="flex flex-wrap items-center gap-2 break-all font-mono text-xs text-secondary-alpha">
              <span className="flex-1">{magicUrl(lastInvite.token)}</span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="rounded-lg"
                disabled={!canWrite}
                onClick={() => {
                  void navigator.clipboard?.writeText(magicUrl(lastInvite.token)).then(() => {
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1500);
                  });
                }}
              >
                {copied ? t('designers.copied') : t('designers.copyMagicLink')}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <div className={dataTableWrap}>
        <table className={dataTable}>
          <thead>
            <tr className={dataTheadRow}>
              <th className={dataTh}>{t('common.name')}</th>
              <th className={dataTh}>{t('common.email')}</th>
              <th className={dataTh}>{t('designers.bonus')}</th>
              <th className={dataTh}>{t('designers.override')}</th>
              <th className={dataTh} />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className={`${dataTd} py-8 text-center text-secondary-alpha`}>
                  {t('designers.noDesigners')}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className={dataTbodyRow}>
                  <td className={dataTd}>{row.designer.name}</td>
                  <td className={dataTd}>{row.designer.email}</td>
                  <td className={`${dataTdMono} text-primary`}>{row.effective_bonus_percent}%</td>
                  <td className={dataTd}>
                    <input
                      className="h-9 w-24 border border-border bg-background px-2 text-foreground"
                        placeholder={t('designers.overridePlaceholder')}
                        value={
                          overrideDraft[row.designer_id] ??
                          (row.bonus_percent_override != null ? String(row.bonus_percent_override) : '')
                        }
                        disabled={!canWrite}
                        onChange={(e) =>
                          setOverrideDraft((prev) => ({ ...prev, [row.designer_id]: e.target.value }))
                        }
                      />
                    </td>
                  <td className={dataTd}>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={!canWrite || savingId === row.designer_id}
                      isLoading={savingId === row.designer_id}
                      onClick={() => void handleSaveOverride(row.designer_id)}
                    >
                      {t('common.save')}
                    </Button>
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

export default CompanyDesignersPage;
