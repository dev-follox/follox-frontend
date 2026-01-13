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
  const [hasStrategy, setHasStrategy] = useState(false);
  const [hasValidation, setHasValidation] = useState(false);
  const [hasForecast, setHasForecast] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.company?.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch answers
        try {
          const companyAnswers = await api.getCompanyAnswers(user.company.id);
          if (companyAnswers.answers) {
            setAnswers(companyAnswers.answers);
          }
        } catch (err: any) {
          // 404 is fine, means no answers yet
          if (err.response?.status !== 404) {
            console.error('Failed to fetch answers:', err);
          }
        }

        // Fetch strategy history
        try {
          const strategyHistory = await api.getGTMStrategyHistory(user.company.id);
          setHasStrategy(strategyHistory.length > 0);
        } catch (err) {
          console.error('Failed to fetch strategy history:', err);
        }

        // Fetch validation history
        try {
          const validationHistory = await api.getValidationHistory(user.company.id);
          setHasValidation(validationHistory.length > 0);
        } catch (err) {
          console.error('Failed to fetch validation history:', err);
        }

        // Fetch forecast history
        try {
          const forecastHistory = await api.getForecastHistory(user.company.id);
          setHasForecast(forecastHistory.length > 0);
        } catch (err) {
          console.error('Failed to fetch forecast history:', err);
        }
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
    <div className="h-full w-full p-4 md:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: Answer the questions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-primary text-white text-sm font-semibold rounded">
                {t('dashboard.step')} 1
              </span>
              <h2 className="text-xl font-semibold text-gray-800">
                {t('dashboard.steps.answerQuestions.title')}
              </h2>
            </div>
            <button
              onClick={() => navigate('/gtm/qa')}
              className="text-primary hover:text-primary-600 transition-colors"
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
          <p className="text-gray-600 mb-4">{t('dashboard.steps.answerQuestions.description')}</p>
          <div className="space-y-2">
            {answerSections.map(({ key, label }) => {
              const isAnswered = isSectionAnswered(key as keyof typeof answers);
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 text-sm"
                >
                  {isAnswered ? (
                    <svg
                      className="h-5 w-5 text-primary flex-shrink-0"
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
                    <div className="h-5 w-5 border-2 border-gray-300 rounded flex-shrink-0" />
                  )}
                  <span className={isAnswered ? 'text-gray-800' : 'text-gray-500'}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Step 2: Generate GTM Strategy */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-primary text-white text-sm font-semibold rounded">
                {t('dashboard.step')} 2
              </span>
              <h2 className="text-xl font-semibold text-gray-800">
                {t('dashboard.steps.generateStrategy.title')}
              </h2>
            </div>
            <button
              onClick={() => navigate('/gtm/strategy')}
              className="text-primary hover:text-primary-600 transition-colors"
              title={t('dashboard.steps.generateStrategy.goTo')}
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
          <p className="text-gray-600 mb-4">{t('dashboard.steps.generateStrategy.description')}</p>
          <div className="space-y-2">
            {[
              { key: 'strategy', label: t('dashboard.steps.generateStrategy.strategy'), checked: hasStrategy },
              { key: 'validation', label: t('dashboard.steps.generateStrategy.validation'), checked: hasValidation },
              { key: 'forecast', label: t('dashboard.steps.generateStrategy.forecast'), checked: hasForecast },
            ].map(({ key, label, checked }) => (
              <div
                key={key}
                className="flex items-center gap-2 text-sm"
              >
                {checked ? (
                  <svg
                    className="h-5 w-5 text-primary flex-shrink-0"
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
                  <div className="h-5 w-5 border-2 border-gray-300 rounded flex-shrink-0" />
                )}
                <span className={checked ? 'text-gray-800' : 'text-gray-500'}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
