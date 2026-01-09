import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import api from '../services/api';
import { GTMStrategy, Validation, Forecast } from '../types';

type TabType = 'strategy' | 'validation' | 'forecast';

const GTMStrategyPage: React.FC = () => {
  const { user } = useAuth();
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
      setError('Не удалось загрузить историю. Попробуйте снова.');
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
      setError(`Не удалось сгенерировать ${getTypeLabel(type)}. Попробуйте снова.`);
      console.error(`Failed to generate ${type}:`, err);
    } finally {
      setGenerating(null);
    }
  };

  const getTypeLabel = (type: TabType): string => {
    switch (type) {
      case 'strategy': return 'GTM стратегию';
      case 'validation': return 'валидацию';
      case 'forecast': return 'прогноз';
      default: return '';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('ru-RU', {
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
        Компания не найдена. Пожалуйста, войдите в систему.
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
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">GTM Стратегия</h2>
            <Button
              onClick={() => handleGenerate('strategy')}
              isLoading={generating === 'strategy'}
            >
              {strategyHistory.length > 0 ? 'Регенерировать' : 'Сгенерировать'}
            </Button>
          </div>

          {strategyHistory.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              <p>История GTM стратегий пуста. Нажмите "Сгенерировать" для создания первой стратегии.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {strategyHistory.map((strategy) => (
                <Card key={strategy.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        Стратегия от {formatDate(strategy.created_at)}
                      </h3>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleGenerate('strategy')}
                      isLoading={generating === 'strategy'}
                    >
                      Регенерировать
                    </Button>
                  </div>
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
                      {strategy.content}
                    </pre>
                  </div>
                  {strategy.output_data && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                        Показать структурированные данные
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-50 p-4 rounded overflow-auto">
                        {JSON.stringify(strategy.output_data, null, 2)}
                      </pre>
                    </details>
                  )}
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
            <h2 className="text-xl font-semibold">Валидация гипотез</h2>
            <Button
              onClick={() => handleGenerate('validation')}
              isLoading={generating === 'validation'}
            >
              {validationHistory.length > 0 ? 'Регенерировать' : 'Сгенерировать'}
            </Button>
          </div>

          {validationHistory.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              <p>История валидаций пуста. Нажмите "Сгенерировать" для создания первой валидации.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {validationHistory.map((validation) => (
                <Card key={validation.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        Валидация от {formatDate(validation.created_at)}
                      </h3>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleGenerate('validation')}
                      isLoading={generating === 'validation'}
                    >
                      Регенерировать
                    </Button>
                  </div>
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
                      {validation.content}
                    </pre>
                  </div>
                  {validation.output_data && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                        Показать структурированные данные
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-50 p-4 rounded overflow-auto">
                        {JSON.stringify(validation.output_data, null, 2)}
                      </pre>
                    </details>
                  )}
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
            <h2 className="text-xl font-semibold">Прогноз</h2>
            <Button
              onClick={() => handleGenerate('forecast')}
              isLoading={generating === 'forecast'}
            >
              {forecastHistory.length > 0 ? 'Регенерировать' : 'Сгенерировать'}
            </Button>
          </div>

          {forecastHistory.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              <p>История прогнозов пуста. Нажмите "Сгенерировать" для создания первого прогноза.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {forecastHistory.map((forecast) => (
                <Card key={forecast.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        Прогноз от {formatDate(forecast.created_at)}
                      </h3>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleGenerate('forecast')}
                      isLoading={generating === 'forecast'}
                    >
                      Регенерировать
                    </Button>
                  </div>
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
                      {forecast.content}
                    </pre>
                  </div>
                  {forecast.output_data && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                        Показать структурированные данные
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-50 p-4 rounded overflow-auto">
                        {JSON.stringify(forecast.output_data, null, 2)}
                      </pre>
                    </details>
                  )}
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
    <div className="h-full w-full p-4 md:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">GTM Strategy Generator</h1>
        <Button onClick={() => navigate('/gtm/qa')} variant="secondary">
          Редактировать ответы
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(['strategy', 'validation', 'forecast'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab === 'strategy' && 'GTM Стратегия'}
              {tab === 'validation' && 'Валидация'}
              {tab === 'forecast' && 'Прогноз'}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default GTMStrategyPage;
