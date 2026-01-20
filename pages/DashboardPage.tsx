import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import api from '../services/api';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import { CompanyAnswers } from '../types';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<CompanyAnswers['answers'] | null>(null);
  const [hasIcp, setHasIcp] = useState(false);
  const [hasPositioning, setHasPositioning] = useState(false);
  const [hasChannelRisk, setHasChannelRisk] = useState(false);
  const [hasExperiment, setHasExperiment] = useState(false);
  const [hasDecisionReview, setHasDecisionReview] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.company?.id) {
        setLoading(false);
        return;
      }

      try {
        try {
          const companyAnswers = await api.getCompanyAnswers(user.company.id);
          if (companyAnswers.answers) {
            setAnswers(companyAnswers.answers);
          }
        } catch (err: any) {
          if (err.response?.status !== 404) {
            console.error('Failed to fetch answers:', err);
          }
        }

        try {
          const h = await api.getIcpDiagnosticianHistory(user.company.id);
          setHasIcp(h.length > 0);
        } catch (err) { console.error('Failed to fetch ICP history:', err); }
        try {
          const h = await api.getPositioningHistory(user.company.id);
          setHasPositioning(h.length > 0);
        } catch (err) { console.error('Failed to fetch positioning history:', err); }
        try {
          const h = await api.getChannelRiskHistory(user.company.id);
          setHasChannelRisk(h.length > 0);
        } catch (err) { console.error('Failed to fetch channel risk history:', err); }
        try {
          const h = await api.getExperimentHistory(user.company.id);
          setHasExperiment(h.length > 0);
        } catch (err) { console.error('Failed to fetch experiment history:', err); }
        try {
          const h = await api.getDecisionReviewHistory(user.company.id);
          setHasDecisionReview(h.length > 0);
        } catch (err) { console.error('Failed to fetch decision review history:', err); }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const isSectionAnswered = (section: keyof typeof answers): boolean => {
    if (!answers || !answers[section]) return false;
    const sectionData = answers[section];
    if (!sectionData || typeof sectionData !== 'object') return false;
    return Object.keys(sectionData).length > 0 && Object.values(sectionData).some(v => {
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'string') return v.trim().length > 0;
      if (typeof v === 'number') return v > 0;
      return v !== null && v !== undefined;
    });
  };

  const answerSections = [
    { key: 'product', label: t('dashboard.steps.answerQuestions.product') },
    { key: 'market', label: t('dashboard.steps.answerQuestions.market') },
    { key: 'customer', label: t('dashboard.steps.answerQuestions.customer') },
    { key: 'problem', label: t('dashboard.steps.answerQuestions.problem') },
    { key: 'solution', label: t('dashboard.steps.answerQuestions.solution') },
    { key: 'distribution', label: t('dashboard.steps.answerQuestions.distribution') },
    { key: 'pricing', label: t('dashboard.steps.answerQuestions.pricing') },
    { key: 'traction', label: t('dashboard.steps.answerQuestions.traction') },
    { key: 'constraints', label: t('dashboard.steps.answerQuestions.constraints') },
  ] as const;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="large" />
      </div>
    );
  }

  if (!user?.company?.id) {
    return (
      <div className="text-center text-red-500 p-8">
        {t('qa.companyNotFound')}
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="dashboard-header__title">{t('dashboard.title')}</h1>
      </div>

      <div className="dashboard-steps">
        {/* Step 1: Answer the questions */}
        <Card className="dashboard-step">
          <div className="dashboard-step__header">
            <div className="flex flex--align-center flex--gap-sm">
              <span className="dashboard-step__badge">
                {t('dashboard.step')} 1
              </span>
              <h2 className="dashboard-step__title">
                {t('dashboard.steps.answerQuestions.title')}
              </h2>
            </div>
            <button
              onClick={() => navigate('/decisions/qa')}
              className="dashboard-step__arrow"
              title={t('dashboard.steps.answerQuestions.goTo')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
          <p className="dashboard-step__description">{t('dashboard.steps.answerQuestions.description')}</p>
          <div className="dashboard-step__items">
            {answerSections.map(({ key, label }) => {
              const isAnswered = isSectionAnswered(key as keyof typeof answers);
              return (
                <div
                  key={key}
                  className={`dashboard-step__item ${isAnswered ? 'dashboard-step__item--checked' : 'dashboard-step__item--unchecked'}`}
                >
                  {isAnswered ? (
                    <svg
                      className="dashboard-step__checkmark"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <div className="dashboard-step__checkbox" />
                  )}
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Step 2: Generate decisions */}
        <Card className="dashboard-step">
          <div className="dashboard-step__header">
            <div className="flex flex--align-center flex--gap-sm">
              <span className="dashboard-step__badge">
                {t('dashboard.step')} 2
              </span>
              <h2 className="dashboard-step__title">
                {t('dashboard.steps.generateDecisions.title')}
              </h2>
            </div>
            <button
              onClick={() => navigate('/decisions/icp-diagnostician')}
              className="dashboard-step__arrow"
              title={t('dashboard.steps.generateDecisions.goTo')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
          <p className="dashboard-step__description">{t('dashboard.steps.generateDecisions.description')}</p>
          <div className="dashboard-step__items">
            {[
              { key: 'icp', label: t('dashboard.steps.generateDecisions.icpDiagnostician'), checked: hasIcp },
              { key: 'positioning', label: t('dashboard.steps.generateDecisions.positioning'), checked: hasPositioning },
              { key: 'channelRisk', label: t('dashboard.steps.generateDecisions.channelRisk'), checked: hasChannelRisk },
              { key: 'experiment', label: t('dashboard.steps.generateDecisions.experiment'), checked: hasExperiment },
              { key: 'decisionReview', label: t('dashboard.steps.generateDecisions.decisionReview'), checked: hasDecisionReview },
            ].map(({ key, label, checked }) => (
              <div
                key={key}
                className={`dashboard-step__item ${checked ? 'dashboard-step__item--checked' : 'dashboard-step__item--unchecked'}`}
              >
                {checked ? (
                  <svg
                    className="dashboard-step__checkmark"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <div className="dashboard-step__checkbox" />
                )}
                <span>{label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
