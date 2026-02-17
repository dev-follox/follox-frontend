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
import type { ToolGenerationResponse } from '../types';

interface DecisionPageProps {
  variant: DecisionVariant;
}

const CONFIG: Record<
  DecisionVariant,
  {
    generate: (id: number, body: { language?: string }) => Promise<ToolGenerationResponse>;
    getHistory: (id: number) => Promise<ToolGenerationResponse[]>;
    titleKey: string;
    emptyKey: string;
    errorKey: string;
  }
> = {
  hypothesis_generator: {
    generate: (id, b) => api.generateHypothesisGenerator(id, b),
    getHistory: api.getHypothesisGeneratorHistory,
    titleKey: 'decisions.hypothesisGenerator.title',
    emptyKey: 'decisions.hypothesisGenerator.noHistory',
    errorKey: 'decisions.hypothesisGenerator.generateError',
  },
  custdev_target_planner: {
    generate: (id, b) => api.generateCustdevTargetPlanner(id, b),
    getHistory: api.getCustdevTargetPlannerHistory,
    titleKey: 'decisions.custdevTargetPlanner.title',
    emptyKey: 'decisions.custdevTargetPlanner.noHistory',
    errorKey: 'decisions.custdevTargetPlanner.generateError',
  },
  custdev_interview_designer: {
    generate: (id, b) => api.generateCustdevInterviewDesigner(id, b),
    getHistory: api.getCustdevInterviewDesignerHistory,
    titleKey: 'decisions.custdevInterviewDesigner.title',
    emptyKey: 'decisions.custdevInterviewDesigner.noHistory',
    errorKey: 'decisions.custdevInterviewDesigner.generateError',
  },
  custdev_insights_analyzer: {
    generate: (id, b) => api.generateCustdevInsightsAnalyzer(id, b),
    getHistory: api.getCustdevInsightsAnalyzerHistory,
    titleKey: 'decisions.custdevInsightsAnalyzer.title',
    emptyKey: 'decisions.custdevInsightsAnalyzer.noHistory',
    errorKey: 'decisions.custdevInsightsAnalyzer.generateError',
  },
};

const DecisionPage: React.FC<DecisionPageProps> = ({ variant }) => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const cfg = CONFIG[variant];

  const [history, setHistory] = useState<ToolGenerationResponse[]>([]);
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
    
    const checkAndRegenerate = async () => {
      try {
        // Load history first
        const list = await cfg.getHistory(user.company.id);
        if (cancelled) return;
        
        setHistory(list);
        if (list.length > 0) setSelectedId(list[0].id);
        
        // Check if we have answers
        let hasAnswers = false;
        try {
          await api.getCompanyAnswers(user.company.id);
          hasAnswers = true;
        } catch (e: any) {
          if (e?.response?.status === 404) {
            hasAnswers = false;
          } else {
            throw e;
          }
        }
        
        if (cancelled) return;
        setHasAnswers(hasAnswers);
        
        // Only auto-regenerate if:
        // 1. We have answers
        // 2. Tool was previously generated (has history)
        // 3. Answers were updated after last generation
        if (hasAnswers && list.length > 0) {
          // Get answer update timestamp
          const answersUpdated = localStorage.getItem(`answers_last_updated_${user.company.id}`);
          // Get tool generation timestamp (use latest history item if not in localStorage)
          let toolGenerated = localStorage.getItem(`tool_last_generated_${user.company.id}_${variant}`);
          
          // If no timestamp in localStorage, use the latest history item's created_at
          if (!toolGenerated && list.length > 0) {
            toolGenerated = list[0].created_at;
            // Store it for future reference
            localStorage.setItem(`tool_last_generated_${user.company.id}_${variant}`, toolGenerated);
          }
          
          // Check if answers were updated after last generation
          const needsRegeneration = answersUpdated && toolGenerated && 
            new Date(answersUpdated) > new Date(toolGenerated);
          
          if (needsRegeneration) {
            setGenerating(true);
            try {
              const requestLanguage = language === 'en' ? 'en' : 'ru';
              const item = await cfg.generate(user.company.id, { language: requestLanguage });
              if (cancelled) return;
              
              // Update generation timestamp
              localStorage.setItem(`tool_last_generated_${user.company.id}_${variant}`, new Date().toISOString());
              
              setHistory((prev) => [item, ...prev]);
              setSelectedId(item.id);
              showToast({
                message: t('decisions.autoRegenerated'),
                type: 'success',
                duration: 4000,
              });
            } catch (e) {
              if (!cancelled) {
                console.error('Auto-regeneration failed:', e);
                // Don't show error toast for auto-regeneration, just log it
              }
            } finally {
              if (!cancelled) {
                setGenerating(false);
              }
            }
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(t('decisions.loadHistoryError'));
          console.error(e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    
    checkAndRegenerate();
    return () => { cancelled = true; };
  }, [user?.company?.id, variant, t, language, cfg]);

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
      // Send language by locale: en → English, ru → Russian
      const requestLanguage = language === 'en' ? 'en' : 'ru';
      const item = await cfg.generate(user.company.id, { language: requestLanguage });
      
      // Update generation timestamp
      localStorage.setItem(`tool_last_generated_${user.company.id}_${variant}`, new Date().toISOString());
      
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
            <Button onClick={handleGenerate} disabled={generating}>
              {history.length > 0 ? t('decisions.regenerate') : t('decisions.generate')}
            </Button>
          </div>
        </div>
        {error && <div className="qa-alert qa-alert--error">{error}</div>}
      </div>

      <div className="decision-page__body">
        <aside className="decision-page__sidebar">
          <h2 className="decision-page__sidebar-title">{t('decisions.history')}</h2>
          {history.length === 0 ? (
            <p className="decision-page__empty text-gray-500 text-sm">{t(cfg.emptyKey)}</p>
          ) : (
            <ul className="decision-page__list">
              {generating && (
                <li>
                  <button
                    type="button"
                    disabled
                    className="decision-page__list-item decision-page__list-item--generating"
                  >
                    <span className="decision-page__list-date">{t('decisions.inProgress')}</span>
                  </button>
                </li>
              )}
              {history.map((item) => {
                const isInactive = generating;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => !generating && setSelectedId(item.id)}
                      disabled={generating}
                      className={`decision-page__list-item ${selectedId === item.id && !generating ? 'decision-page__list-item--active' : ''} ${isInactive ? 'decision-page__list-item--inactive' : ''}`}
                    >
                      <span className="decision-page__list-date">{formatDate(item.created_at)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <main className="decision-page__main">
          {generating ? (
            <div className="decision-page__main-loader">
              <Spinner size="large" />
            </div>
          ) : loading && history.length === 0 ? (
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
