import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import DecisionOutputView, { DecisionVariant } from '../components/DecisionOutputView';
import api from '../services/api';
import type { ICPDiagnostician, Positioning, ChannelRisk, Experiment, DecisionReview } from '../types';

type DecisionItem = ICPDiagnostician | Positioning | ChannelRisk | Experiment | DecisionReview;

interface DecisionPageProps {
  variant: DecisionVariant;
}

const CONFIG: Record<
  DecisionVariant,
  {
    generate: (id: number, body: { language?: string }) => Promise<DecisionItem>;
    getHistory: (id: number) => Promise<DecisionItem[]>;
    titleKey: string;
    emptyKey: string;
    errorKey: string;
  }
> = {
  icp_diagnostician: {
    generate: (id, b) => api.generateIcpDiagnostician(id, b),
    getHistory: api.getIcpDiagnosticianHistory,
    titleKey: 'decisions.icpDiagnostician.title',
    emptyKey: 'decisions.icpDiagnostician.noHistory',
    errorKey: 'decisions.icpDiagnostician.generateError',
  },
  positioning: {
    generate: (id, b) => api.generatePositioning(id, b),
    getHistory: api.getPositioningHistory,
    titleKey: 'decisions.positioning.title',
    emptyKey: 'decisions.positioning.noHistory',
    errorKey: 'decisions.positioning.generateError',
  },
  channel_risk: {
    generate: (id, b) => api.generateChannelRisk(id, b),
    getHistory: api.getChannelRiskHistory,
    titleKey: 'decisions.channelRisk.title',
    emptyKey: 'decisions.channelRisk.noHistory',
    errorKey: 'decisions.channelRisk.generateError',
  },
  experiment: {
    generate: (id, b) => api.generateExperiment(id, b),
    getHistory: api.getExperimentHistory,
    titleKey: 'decisions.experiment.title',
    emptyKey: 'decisions.experiment.noHistory',
    errorKey: 'decisions.experiment.generateError',
  },
  decision_review: {
    generate: (id, b) => api.generateDecisionReview(id, b),
    getHistory: api.getDecisionReviewHistory,
    titleKey: 'decisions.decisionReview.title',
    emptyKey: 'decisions.decisionReview.noHistory',
    errorKey: 'decisions.decisionReview.generateError',
  },
};

const DecisionPage: React.FC<DecisionPageProps> = ({ variant }) => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const cfg = CONFIG[variant];

  const [history, setHistory] = useState<DecisionItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hasAnswers, setHasAnswers] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.company?.id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    cfg.getHistory(user.company.id)
      .then((list) => {
        if (cancelled) return;
        setHistory(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(t('decisions.loadHistoryError'));
          console.error(e);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    api.getCompanyAnswers(user.company.id)
      .then(() => { if (!cancelled) setHasAnswers(true); })
      .catch((e: any) => { if (!cancelled && e?.response?.status === 404) setHasAnswers(false); });
    return () => { cancelled = true; };
  }, [user?.company?.id, variant, t]);

  const handleGenerate = async () => {
    if (!user?.company?.id) return;
    if (hasAnswers === false) {
      showToast({
        message: t('decisions.pleaseAnswerFirst'),
        type: 'info',
        action: { label: t('decisions.goToQuestions'), onClick: () => navigate('/tools/qa') },
        duration: 6000,
      });
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const item = await cfg.generate(user.company.id, { language });
      setHistory((prev) => [item, ...prev]);
      setSelectedId(item.id);
    } catch (e) {
      setError(t(cfg.errorKey));
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleString(language, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const selected = history.find((h) => h.id === selectedId) ?? history[0];

  if (!user?.company?.id) {
    return (
      <div className="text-center text-red-500 p-8">
        {t('qa.companyNotFound')}
      </div>
    );
  }

  return (
    <div className="decision-page">
      <div className="decision-page__header">
        <div className="decision-page-header">
          <h1 className="decision-page-header__title">{t(cfg.titleKey)}</h1>
          <div className="decision-page-header__actions flex flex--gap-sm">
            <Button onClick={() => navigate('/tools/qa')} variant="secondary">
              {t('decisions.editAnswers')}
            </Button>
            <Button onClick={handleGenerate} isLoading={generating}>
              {history.length > 0 ? t('decisions.regenerate') : t('decisions.generate')}
            </Button>
          </div>
        </div>
        {error && <div className="qa-alert qa-alert--error">{error}</div>}
      </div>

      <div className="decision-page__body">
        <aside className="decision-page__sidebar">
          <h2 className="decision-page__sidebar-title">{t('decisions.history')}</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="small" />
            </div>
          ) : history.length === 0 ? (
            <p className="decision-page__empty text-gray-500 text-sm">{t(cfg.emptyKey)}</p>
          ) : (
            <ul className="decision-page__list">
              {history.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`decision-page__list-item ${selectedId === item.id ? 'decision-page__list-item--active' : ''}`}
                  >
                    <span className="decision-page__list-date">{formatDate(item.created_at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="decision-page__main">
          {loading && history.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="large" />
            </div>
          ) : selected ? (
            <Card className="decision-page__card">
              <div className="decision-page__card-header">
                <span className="decision-page__card-date">{formatDate(selected.created_at)}</span>
              </div>
              <DecisionOutputView
                outputData={selected.output_data ?? undefined}
                variant={variant}
                fallback={selected.content}
                t={t}
              />
            </Card>
          ) : history.length === 0 ? (
            <Card className="decision-page__empty-card">
              {hasAnswers === false ? (
                <>
                  <p className="decision-page__empty-text">{t('decisions.answerFirst')}</p>
                  <Button onClick={() => navigate('/tools/qa')}>
                    {t('decisions.goToQuestions')}
                  </Button>
                </>
              ) : (
                <p className="decision-page__empty-text">{t('decisions.noDataYet')}</p>
              )}
            </Card>
          ) : (
            <Card className="p-8 text-center text-gray-500">
              <p>{t(cfg.emptyKey)}</p>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default DecisionPage;
