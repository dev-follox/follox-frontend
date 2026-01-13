import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import api from '../services/api';
import { GTMStrategy, Validation, Forecast } from '../types';

type TabType = 'strategy' | 'validation' | 'forecast';

const GTMStrategyPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('strategy');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [strategyHistory, setStrategyHistory] = useState<GTMStrategy[]>([]);
  const [validationHistory, setValidationHistory] = useState<Validation[]>([]);
  const [forecastHistory, setForecastHistory] = useState<Forecast[]>([]);

  useEffect(() => {
    if (user?.company?.id) {
      loadHistory();
    }
  }, [user, activeTab]);

  const loadHistory = async () => {
    if (!user?.company?.id) return;

    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'strategy') {
        const history = await api.getGTMStrategyHistory(user.company.id);
        setStrategyHistory(history);
      } else if (activeTab === 'validation') {
        const history = await api.getValidationHistory(user.company.id);
        setValidationHistory(history);
      } else if (activeTab === 'forecast') {
        const history = await api.getForecastHistory(user.company.id);
        setForecastHistory(history);
      }
    } catch (err: any) {
      setError(t('gtmStrategy.loadHistoryError'));
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (type: TabType) => {
    if (!user?.company?.id) return;

    setGenerating(type);
    setError(null);

    try {
      if (type === 'strategy') {
        const newStrategy = await api.generateGTMStrategy(user.company.id);
        setStrategyHistory(prev => [newStrategy, ...prev]);
      } else if (type === 'validation') {
        const newValidation = await api.generateValidation(user.company.id);
        setValidationHistory(prev => [newValidation, ...prev]);
      } else if (type === 'forecast') {
        const newForecast = await api.generateForecast(user.company.id);
        setForecastHistory(prev => [newForecast, ...prev]);
      }
    } catch (err: any) {
      setError(getTypeLabel(type));
      console.error(`Failed to generate ${type}:`, err);
    } finally {
      setGenerating(null);
    }
  };

  const getTypeLabel = (type: TabType): string => {
    switch (type) {
      case 'strategy': return t('gtmStrategy.generateError.strategy');
      case 'validation': return t('gtmStrategy.generateError.validation');
      case 'forecast': return t('gtmStrategy.generateError.forecast');
      default: return '';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString(t.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user?.company?.id) {
    return (
      <div className="text-center text-red-500 p-8">
        {t('qa.companyNotFound')}
      </div>
    );
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Spinner size="large" />
        </div>
      );
    }

    if (activeTab === 'strategy') {
      return (
        <div className="gtm-strategy-history">
          <div className="gtm-strategy-section">
            <h2 className="gtm-strategy-section__title">{t('gtmStrategy.tabs.strategy')}</h2>
            <Button
              onClick={() => handleGenerate('strategy')}
              isLoading={generating === 'strategy'}
            >
              {strategyHistory.length > 0 ? t('gtmStrategy.regenerate') : t('gtmStrategy.generate')}
            </Button>
          </div>

          {strategyHistory.length === 0 ? (
            <Card className="gtm-strategy-item">
              <div className="gtm-strategy-item__empty">
                <p>{t('gtmStrategy.noHistory.strategy')}</p>
              </div>
            </Card>
          ) : (
            <div className="gtm-strategy-history">
              {strategyHistory.map((strategy) => (
                <Card key={strategy.id} className="gtm-strategy-item">
                  <div className="gtm-strategy-item__header">
                    <div>
                      <h3 className="gtm-strategy-item__title">
                        <svg
                          className="inline-block w-4 h-4 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {formatDate(strategy.created_at)}
                      </h3>
                    </div>
                  </div>
                  <div className="gtm-strategy-item__content">
                    {strategy.content}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'validation') {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{t('gtmStrategy.tabs.validation')}</h2>
            <Button
              onClick={() => handleGenerate('validation')}
              isLoading={generating === 'validation'}
            >
              {validationHistory.length > 0 ? t('gtmStrategy.regenerate') : t('gtmStrategy.generate')}
            </Button>
          </div>

          {validationHistory.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              <p>{t('gtmStrategy.noHistory.validation')}</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {validationHistory.map((validation) => (
                <Card key={validation.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {formatDate(validation.created_at)}
                      </h3>
                    </div>
                  </div>
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
                      {validation.content}
                    </pre>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'forecast') {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{t('gtmStrategy.tabs.forecast')}</h2>
            <Button
              onClick={() => handleGenerate('forecast')}
              isLoading={generating === 'forecast'}
            >
              {forecastHistory.length > 0 ? t('gtmStrategy.regenerate') : t('gtmStrategy.generate')}
            </Button>
          </div>

          {forecastHistory.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              <p>{t('gtmStrategy.noHistory.forecast')}</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {forecastHistory.map((forecast) => (
                <Card key={forecast.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {formatDate(forecast.created_at)}
                      </h3>
                    </div>
                  </div>
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
                      {forecast.content}
                    </pre>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="gtm-strategy-page">
      <div className="gtm-strategy-page__header">
        <div className="gtm-strategy-header">
          <h1 className="gtm-strategy-header__title">{t('gtmStrategy.title')}</h1>
          <Button onClick={() => navigate('/gtm/qa')} variant="secondary">
            {t('gtmStrategy.editAnswers')}
          </Button>
        </div>

        {error && (
          <div className="qa-alert qa-alert--error">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="gtm-strategy-tabs">
          <nav className="gtm-strategy-tabs__nav">
            {(['strategy', 'validation', 'forecast'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`gtm-strategy-tabs__tab ${
                  activeTab === tab ? 'gtm-strategy-tabs__tab--active' : ''
                }`}
              >
                {tab === 'strategy' && t('gtmStrategy.tabs.strategy')}
                {tab === 'validation' && t('gtmStrategy.tabs.validation')}
                {tab === 'forecast' && t('gtmStrategy.tabs.forecast')}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="gtm-strategy-page__content">
        <div className="gtm-strategy-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default GTMStrategyPage;
