import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Company, CompanyAnswers, GTMStrategy, Validation, Forecast } from '../types';
import Card from '../components/Card';
import Input from '../components/Input';
import Spinner from '../components/Spinner';

type TabType = 'answers' | 'generations';

const AdminCompanyDetailsPage: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('answers');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [company, setCompany] = useState<Company | null>(null);
  const [answers, setAnswers] = useState<CompanyAnswers | null>(null);
  const [strategies, setStrategies] = useState<GTMStrategy[]>([]);
  const [validations, setValidations] = useState<Validation[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
    if (companyId) {
      loadData();
    }
  }, [user, companyId, navigate, activeTab]);

  const loadData = async () => {
    if (!companyId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const companyData = await api.getCompanyById(Number(companyId));
      setCompany(companyData);
      
      if (activeTab === 'answers') {
        try {
          const answersData = await api.getCompanyAnswersAdmin(Number(companyId));
          setAnswers(answersData);
        } catch (err: any) {
          // Answers might not exist, that's okay
          if (err?.response?.status !== 404) {
            console.error('Failed to load answers:', err);
          }
        }
      } else if (activeTab === 'generations') {
        const [strategiesData, validationsData, forecastsData] = await Promise.all([
          api.getCompanyGTMStrategiesAdmin(Number(companyId)),
          api.getCompanyValidationsAdmin(Number(companyId)),
          api.getCompanyForecastsAdmin(Number(companyId)),
        ]);
        setStrategies(strategiesData);
        setValidations(validationsData);
        setForecasts(forecastsData);
      }
    } catch (err: any) {
      setError(t('admin.companyDetails.loadError'));
      console.error('Failed to load company data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString(language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="admin-company-details-page">
        <div className="flex justify-center items-center h-64">
          <Spinner size="large" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="admin-company-details-page">
        <div className="text-center text-red-500 p-8">
          {t('admin.companyDetails.loadError')}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-company-details-page">
      <div className="admin-company-details-header">
        <button
          onClick={() => navigate('/admin/companies')}
          className="admin-company-details-back"
        >
          {t('admin.companyDetails.back')}
        </button>
        <h1 className="admin-company-details-title">
          {company.company_name} - {t('admin.companyDetails.title')}
        </h1>
      </div>

      {error && (
        <div className="qa-alert qa-alert--error">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="admin-company-details-tabs">
        <button
          onClick={() => setActiveTab('answers')}
          className={`admin-company-details-tab ${
            activeTab === 'answers' ? 'admin-company-details-tab--active' : ''
          }`}
        >
          {t('admin.companyDetails.tabs.answers')}
        </button>
        <button
          onClick={() => setActiveTab('generations')}
          className={`admin-company-details-tab ${
            activeTab === 'generations' ? 'admin-company-details-tab--active' : ''
          }`}
        >
          {t('admin.companyDetails.tabs.generations')}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'answers' ? (
        <div className="qa-page">
          <div className="qa-page__header">
            {answers && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">
                  <strong>{t('admin.companyDetails.answers.createdAt')}:</strong>{' '}
                  {formatDate(answers.created_at)}
                </p>
                {answers.updated_at && (
                  <p className="text-sm text-gray-500">
                    <strong>{t('admin.companyDetails.answers.updatedAt')}:</strong>{' '}
                    {formatDate(answers.updated_at)}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="qa-page__content">
              {answers ? (
                <div className="qa-sections">
                  {/* Product Section */}
                  <Card className="qa-section">
                    <h2 className="qa-section__title">{t('qa.sections.product.title')}</h2>
                    <div className="qa-section__fields">
                      <Input
                        id="product-name"
                        label={t('qa.sections.product.name')}
                        value={answers.answers.product?.name || ''}
                        disabled
                      />
                      <Input
                        id="product-description"
                        label={t('qa.sections.product.description')}
                        multiline
                        rows={3}
                        value={answers.answers.product?.description || ''}
                        disabled
                      />
                      <Input
                        id="product-category"
                        label={`${t('qa.sections.product.category')} (${t('common.optional')})`}
                        value={answers.answers.product?.category || ''}
                        disabled
                      />
                      <Input
                        id="product-stage"
                        label={`${t('qa.sections.product.stage')} (${t('common.optional')})`}
                        value={answers.answers.product?.stage || ''}
                        disabled
                      />
                    </div>
                  </Card>

                  {/* Market Section */}
                  <Card className="qa-section">
                    <h2 className="qa-section__title">{t('qa.sections.market.title')}</h2>
                    <div className="qa-section__fields">
                      <Input
                        id="market-target"
                        label={t('qa.sections.market.targetMarket')}
                        value={answers.answers.market?.target_market || ''}
                        disabled
                      />
                      <Input
                        id="market-geography"
                        label={`${t('qa.sections.market.geography')} (${t('common.optional')})`}
                        value={answers.answers.market?.geography || ''}
                        disabled
                      />
                      <Input
                        id="market-alternatives"
                        label={`${t('qa.sections.market.alternatives')} (${t('common.optional')})`}
                        value={answers.answers.market?.alternatives?.join(', ') || ''}
                        disabled
                      />
                    </div>
                  </Card>

                  {/* Customer Section */}
                  <Card className="qa-section">
                    <h2 className="qa-section__title">{t('qa.sections.customer.title')}</h2>
                    <div className="qa-section__fields">
                      <Input
                        id="customer-role"
                        label={t('qa.sections.customer.role')}
                        value={answers.answers.customer?.role || ''}
                        disabled
                      />
                      <Input
                        id="customer-company-stage"
                        label={`${t('qa.sections.customer.companyStage')} (${t('common.optional')})`}
                        value={answers.answers.customer?.company_stage || ''}
                        disabled
                      />
                      <Input
                        id="customer-team-size"
                        label={`${t('qa.sections.customer.teamSize')} (${t('common.optional')})`}
                        value={answers.answers.customer?.team_size || ''}
                        disabled
                      />
                    </div>
                  </Card>

                  {/* Problem Section */}
                  <Card className="qa-section">
                    <h2 className="qa-section__title">{t('qa.sections.problem.title')}</h2>
                    <div className="qa-section__fields">
                      <Input
                        id="problem-main-pain"
                        label={t('qa.sections.problem.mainPain')}
                        multiline
                        rows={3}
                        value={answers.answers.problem?.main_pain || ''}
                        disabled
                      />
                      <Input
                        id="problem-frequency"
                        label={`${t('qa.sections.problem.frequency')} (${t('common.optional')})`}
                        value={answers.answers.problem?.frequency || ''}
                        disabled
                      />
                      <Input
                        id="problem-current-solution"
                        label={`${t('qa.sections.problem.currentSolution')} (${t('common.optional')})`}
                        multiline
                        rows={2}
                        value={answers.answers.problem?.current_solution || ''}
                        disabled
                      />
                    </div>
                  </Card>

                  {/* Solution Section */}
                  <Card className="qa-section">
                    <h2 className="qa-section__title">{t('qa.sections.solution.title')}</h2>
                    <div className="qa-section__fields">
                      <Input
                        id="solution-core-value"
                        label={`${t('qa.sections.solution.coreValue')} (${t('common.optional')})`}
                        multiline
                        rows={3}
                        value={answers.answers.solution?.core_value || ''}
                        disabled
                      />
                      <Input
                        id="solution-differentiator"
                        label={`${t('qa.sections.solution.differentiator')} (${t('common.optional')})`}
                        multiline
                        rows={2}
                        value={answers.answers.solution?.differentiator || ''}
                        disabled
                      />
                    </div>
                  </Card>

                  {/* Distribution Section */}
                  <Card className="qa-section">
                    <h2 className="qa-section__title">{t('qa.sections.distribution.title')}</h2>
                    <div className="qa-section__fields">
                      <Input
                        id="distribution-channels"
                        label={`${t('qa.sections.distribution.knownChannels')} (${t('common.optional')})`}
                        value={answers.answers.distribution?.known_channels?.join(', ') || ''}
                        disabled
                      />
                      <Input
                        id="distribution-preferred"
                        label={`${t('qa.sections.distribution.preferredChannel')} (${t('common.optional')})`}
                        value={answers.answers.distribution?.preferred_channel || ''}
                        disabled
                      />
                    </div>
                  </Card>

                  {/* Pricing Section */}
                  <Card className="qa-section">
                    <h2 className="qa-section__title">{t('qa.sections.pricing.title')}</h2>
                    <div className="qa-section__fields">
                      <Input
                        id="pricing-model"
                        label={`${t('qa.sections.pricing.model')} (${t('common.optional')})`}
                        value={answers.answers.pricing?.model || ''}
                        disabled
                      />
                      <Input
                        id="pricing-expected"
                        label={`${t('qa.sections.pricing.expectedPrice')} (${t('common.optional')})`}
                        type="number"
                        value={answers.answers.pricing?.expected_price || ''}
                        disabled
                      />
                    </div>
                  </Card>

                  {/* Traction Section */}
                  <Card className="qa-section">
                    <h2 className="qa-section__title">{t('qa.sections.traction.title')}</h2>
                    <div className="qa-section__fields">
                      <Input
                        id="traction-users"
                        label={`${t('qa.sections.traction.users')} (${t('common.optional')})`}
                        type="number"
                        value={answers.answers.traction?.users || ''}
                        disabled
                      />
                      <Input
                        id="traction-revenue"
                        label={`${t('qa.sections.traction.revenue')} (${t('common.optional')})`}
                        type="number"
                        value={answers.answers.traction?.revenue || ''}
                        disabled
                      />
                      <Input
                        id="traction-signals"
                        label={`${t('qa.sections.traction.signals')} (${t('common.optional')})`}
                        multiline
                        rows={2}
                        value={answers.answers.traction?.signals || ''}
                        disabled
                      />
                    </div>
                  </Card>

                  {/* Constraints Section */}
                  <Card className="qa-section">
                    <h2 className="qa-section__title">{t('qa.sections.constraints.title')}</h2>
                    <div className="qa-section__fields">
                      <Input
                        id="constraints-budget"
                        label={`${t('qa.sections.constraints.budget')} (${t('common.optional')})`}
                        value={answers.answers.constraints?.budget || ''}
                        disabled
                      />
                      <Input
                        id="constraints-time"
                        label={`${t('qa.sections.constraints.time')} (${t('common.optional')})`}
                        value={answers.answers.constraints?.time || ''}
                        disabled
                      />
                      <Input
                        id="constraints-team"
                        label={`${t('qa.sections.constraints.team')} (${t('common.optional')})`}
                        value={answers.answers.constraints?.team || ''}
                        disabled
                      />
                    </div>
                  </Card>
                </div>
              ) : (
                <Card className="p-8 text-center text-gray-500">
                  <p>{t('admin.companyDetails.answers.noAnswers')}</p>
                </Card>
              )}
          </div>
        </div>
      ) : (
        <div className="admin-company-details-content">
          <div className="space-y-6">
            {/* GTM Strategies */}
            <div>
              <h2 className="text-xl font-semibold mb-4">{t('admin.companyDetails.generations.strategy')}</h2>
              {strategies.length === 0 ? (
                <Card className="p-8 text-center text-gray-500">
                  <p>{t('admin.companyDetails.generations.noStrategy')}</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {strategies.map((strategy) => (
                    <Card key={strategy.id} className="p-6">
                      <div className="mb-4">
                        <p className="text-sm text-gray-500">
                          <strong>{t('admin.companyDetails.generations.createdAt')}:</strong>{' '}
                          {formatDate(strategy.created_at)}
                        </p>
                      </div>
                      <div className="prose max-w-none">
                        <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
                          {strategy.content}
                        </pre>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Validations */}
            <div>
              <h2 className="text-xl font-semibold mb-4">{t('admin.companyDetails.generations.validation')}</h2>
              {validations.length === 0 ? (
                <Card className="p-8 text-center text-gray-500">
                  <p>{t('admin.companyDetails.generations.noValidation')}</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {validations.map((validation) => (
                    <Card key={validation.id} className="p-6">
                      <div className="mb-4">
                        <p className="text-sm text-gray-500">
                          <strong>{t('admin.companyDetails.generations.createdAt')}:</strong>{' '}
                          {formatDate(validation.created_at)}
                        </p>
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

            {/* Forecasts */}
            <div>
              <h2 className="text-xl font-semibold mb-4">{t('admin.companyDetails.generations.forecast')}</h2>
              {forecasts.length === 0 ? (
                <Card className="p-8 text-center text-gray-500">
                  <p>{t('admin.companyDetails.generations.noForecast')}</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {forecasts.map((forecast) => (
                    <Card key={forecast.id} className="p-6">
                      <div className="mb-4">
                        <p className="text-sm text-gray-500">
                          <strong>{t('admin.companyDetails.generations.createdAt')}:</strong>{' '}
                          {formatDate(forecast.created_at)}
                        </p>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCompanyDetailsPage;
