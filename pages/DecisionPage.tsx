import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import Dialog from '../components/Dialog';
import Input from '../components/Input';
import DecisionOutputView, { DecisionVariant } from '../components/DecisionOutputView';
import api from '../services/api';
import type { ToolOutput, ToolType } from '../types';
import { useIteration } from '../hooks/useIteration';
import GenerationHistory from '../components/GenerationHistory';
import IterationContextBanner from '../components/IterationContextBanner';

interface DecisionPageProps {
  variant: DecisionVariant;
}

const CONFIG: Record<
  DecisionVariant,
  {
    generate: (id: number, body: { language?: string; interview_data?: string }) => Promise<ToolOutput>;
    toolType: ToolType;
    titleKey: string;
    emptyKey: string;
    errorKey: string;
  }
> = {
  hypothesis_generator: {
    generate: (id, b) => api.generateHypothesisGenerator(id, b),
    toolType: 'hypothesis_generator',
    titleKey: 'decisions.hypothesisGenerator.title',
    emptyKey: 'decisions.hypothesisGenerator.noHistory',
    errorKey: 'decisions.hypothesisGenerator.generateError',
  },
  custdev_target_planner: {
    generate: (id, b) => api.generateCustdevTargetPlanner(id, b),
    toolType: 'custdev_target_planner',
    titleKey: 'decisions.custdevTargetPlanner.title',
    emptyKey: 'decisions.custdevTargetPlanner.noHistory',
    errorKey: 'decisions.custdevTargetPlanner.generateError',
  },
  custdev_interview_designer: {
    generate: (id, b) => api.generateCustdevInterviewDesigner(id, b),
    toolType: 'custdev_interview_designer',
    titleKey: 'decisions.custdevInterviewDesigner.title',
    emptyKey: 'decisions.custdevInterviewDesigner.noHistory',
    errorKey: 'decisions.custdevInterviewDesigner.generateError',
  },
  custdev_insights_analyzer: {
    generate: (id, b) => api.generateCustdevInsightsAnalyzer(id, b),
    toolType: 'custdev_insights_analyzer',
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
  const { currentIteration } = useIteration();

  const [currentOutput, setCurrentOutput] = useState<ToolOutput | null>(null);
  const [hasAnswers, setHasAnswers] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [interviewData, setInterviewData] = useState('');
  const [historyRefreshToken, setHistoryRefreshToken] = useState(0);
  const [contextRefreshToken, setContextRefreshToken] = useState(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Pre-fill interview data when opening dialog for custdev_insights_analyzer
  useEffect(() => {
    if (interviewDialogOpen && variant === 'custdev_insights_analyzer' && user?.company?.id) {
      api.getCompanyAnswers(user.company.id).then((res) => {
        if (isMountedRef.current && res.answers?.interview_data != null) {
          setInterviewData(res.answers.interview_data);
        }
      }).catch(() => {});
    }
  }, [interviewDialogOpen, variant, user?.company?.id]);

  useEffect(() => {
    if (!user?.company?.id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const checkAnswers = async () => {
      try {
        let hasAnswersFlag = false;
        try {
          await api.getCompanyAnswers(user.company.id);
          hasAnswersFlag = true;
        } catch (e: any) {
          if (e?.response?.status === 404) {
            hasAnswersFlag = false;
          } else {
            throw e;
          }
        }
        if (!cancelled) {
          setHasAnswers(hasAnswersFlag);
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

    checkAnswers();
    return () => {
      cancelled = true;
    };
  }, [user?.company?.id, t]);

  const runGeneration = (extraBody?: { interview_data?: string }) => {
    if (!user?.company?.id) return;
    setGenerating(true);
    setError(null);
    showToast({
      message: t('decisions.generationStarted'),
      type: 'info',
      duration: 4000,
    });
    const requestLanguage = language === 'en' ? 'en' : 'ru';
    const body: { language?: string; interview_data?: string } = {
      language: requestLanguage,
      ...(extraBody ?? {}),
    };
    cfg
      .generate(user.company.id, body)
      .then((item) => {
        if (!isMountedRef.current) return;
        localStorage.setItem(`tool_last_generated_${user.company.id}_${variant}`, new Date().toISOString());
        setCurrentOutput(item);
        setHistoryRefreshToken((prev) => prev + 1);
        setContextRefreshToken((prev) => prev + 1);
        showToast({ message: t('decisions.generationCompleted'), type: 'success', duration: 3000 });
      })
      .catch((e) => {
        if (!isMountedRef.current) return;
        setError(t(cfg.errorKey));
        console.error(e);
        showToast({ message: t(cfg.errorKey), type: 'error', duration: 4000 });
      })
      .finally(() => {
        if (isMountedRef.current) setGenerating(false);
      });
  };

  const handleGenerate = () => {
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
    if (variant === 'custdev_insights_analyzer') {
      setInterviewData('');
      setInterviewDialogOpen(true);
      return;
    }
    runGeneration();
  };

  const handleInterviewDialogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.company?.id) return;
    setInterviewDialogOpen(false);
    setGenerating(true);
    setError(null);
    try {
      const current = await api.getCompanyAnswers(user.company.id);
      const updatedAnswers = { ...current.answers, interview_data: interviewData.trim() || undefined };
      await api.updateCompanyAnswers(user.company.id, { answers: updatedAnswers });
      if (typeof window !== 'undefined') {
        localStorage.setItem(`answers_last_updated_${user.company.id}`, new Date().toISOString());
      }
      runGeneration({ interview_data: interviewData.trim() || undefined });
    } catch (err) {
      console.error(err);
      if (isMountedRef.current) {
        setGenerating(false);
        showToast({ message: t('qa.saveError'), type: 'error', duration: 4000 });
      }
    }
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleString(language, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

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
            <Button onClick={handleGenerate} disabled={generating} isLoading={generating}>
              {generating ? t('decisions.generating') : (history.length > 0 ? t('decisions.regenerate') : t('decisions.generate'))}
            </Button>
          </div>
        </div>
        {error && <div className="qa-alert qa-alert--error">{error}</div>}
      </div>

      <div className="decision-page__body">
        <main className="decision-page__main">
          <IterationContextBanner variant={variant} refreshToken={contextRefreshToken} />

          {loading && !currentOutput ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="large" />
            </div>
          ) : currentOutput ? (
            <Card className="decision-page__card">
              <div className="decision-page__card-header">
                <span className="decision-page__card-date">{formatDate(currentOutput.created_at)}</span>
              </div>
              <DecisionOutputView
                outputData={currentOutput.output_json ?? undefined}
                variant={variant}
                fallback={currentOutput.output_raw ?? undefined}
                t={t}
              />
            </Card>
          ) : (
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
          )}

          <GenerationHistory
            iterationId={currentIteration?.id ?? null}
            toolType={cfg.toolType}
            variant={variant}
            refreshToken={historyRefreshToken}
            onSelectOutput={(output) => {
              setCurrentOutput(output);
            }}
          />
        </main>
      </div>

      {variant === 'custdev_insights_analyzer' && (
        <Dialog
          isOpen={interviewDialogOpen}
          onClose={() => setInterviewDialogOpen(false)}
          title={t('decisions.custdevInsightsAnalyzer.interviewDataDialogTitle')}
          onSubmit={handleInterviewDialogSubmit}
          actions={[
            { label: t('common.cancel'), variant: 'secondary', onClick: () => setInterviewDialogOpen(false) },
            { label: t('decisions.custdevInsightsAnalyzer.submitAndGenerate'), variant: 'primary', type: 'submit' },
          ]}
        >
          <Input
            id="interview-data"
            label={t('decisions.custdevInsightsAnalyzer.interviewDataLabel')}
            multiline
            rows={8}
            value={interviewData}
            onChange={(e) => setInterviewData(e.target.value)}
            placeholder={t('decisions.custdevInsightsAnalyzer.interviewDataPlaceholder')}
          />
        </Dialog>
      )}
    </div>
  );
};

export default DecisionPage;
