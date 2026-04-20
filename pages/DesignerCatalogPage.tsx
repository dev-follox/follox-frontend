import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import type { Company } from '../types';
import Spinner from '../components/Spinner';
import Button from '../components/Button';
import { useTranslation } from '../hooks/useTranslation';
import { Building2, ChevronRight } from 'lucide-react';

const DesignerCatalogPage: React.FC = () => {
  const { t } = useTranslation();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [linkedIds, setLinkedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [catalog, mine] = await Promise.all([api.getDesignerCatalogCompanies(), api.getMyDesignerCompanies()]);
      setCompanies(catalog);
      setLinkedIds(new Set(mine.map((c) => c.id)));
    } catch {
      setError(t('designerCatalog.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleJoin = async (companyId: number) => {
    try {
      setJoiningId(companyId);
      await api.joinDesignerCompany(companyId);
      setLinkedIds((prev) => new Set(prev).add(companyId));
    } catch {
      setError(t('designerCatalog.joinError'));
    } finally {
      setJoiningId(null);
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
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('designerCatalog.title')}</h1>
        <p className="mt-1 text-sm text-secondary-alpha">{t('designerCatalog.subtitle')}</p>
      </div>

      {companies.length === 0 ? (
        <p className="text-secondary-alpha">{t('designerCatalog.empty')}</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {companies.map((c) => {
            const linked = linkedIds.has(c.id);
            return (
              <li key={c.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-stone" strokeWidth={1.5} />
                  <div>
                    <p className="font-semibold text-foreground">{c.company_name}</p>
                    <p className="text-xs text-secondary-alpha">{c.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!linked && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      isLoading={joiningId === c.id}
                      onClick={() => void handleJoin(c.id)}
                    >
                      {t('designerCatalog.join')}
                    </Button>
                  )}
                  <Link
                    to={`/designers/catalog/${c.id}`}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
                  >
                    {t('designerCatalog.openCatalog')}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default DesignerCatalogPage;
