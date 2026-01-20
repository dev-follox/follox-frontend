import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import api from '../services/api';
import { CompanyAnswers } from '../types';

const SECTION_ORDER = [
  'product',
  'market',
  'customer',
  'problem',
  'solution',
  'distribution',
  'pricing',
  'traction',
  'constraints',
] as const;

const CompanyQAPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<CompanyAnswers['answers']>({
    product: {},
    market: {},
    customer: {},
    problem: {},
    solution: {},
    distribution: {},
    pricing: {},
    traction: {},
    constraints: {},
  });

  useEffect(() => {
    const fetchAnswers = async () => {
      if (!user?.company?.id) {
        setError(t('qa.companyNotFound'));
        setLoading(false);
        return;
      }
      try {
        const companyAnswers = await api.getCompanyAnswers(user.company.id);
        if (companyAnswers.answers) {
          setAnswers(companyAnswers.answers);
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          console.error('Failed to fetch answers:', err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAnswers();
  }, [user]);

  const handleChange = (section: keyof typeof answers, field: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleArrayChange = (section: keyof typeof answers, field: string, value: string) => {
    const newArray = value.split(',').map((item) => item.trim()).filter(Boolean);
    handleChange(section, field, newArray);
  };

  const save = async () => {
    if (!user?.company?.id) return;
    setSaving(true);
    setError(null);
    try {
      await api.updateCompanyAnswers(user.company.id, { answers });
      showToast({ message: t('qa.answersSaved'), type: 'success', duration: 4000 });
    } catch (err: any) {
      setError(t('qa.saveError'));
      console.error('Failed to save answers:', err);
    } finally {
      setSaving(false);
    }
  };

  const goNext = () => {
    if (currentStep < SECTION_ORDER.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      navigate('/tools/icp-diagnostician');
    }
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const skip = () => {
    goNext();
  };

  const sectionKey = SECTION_ORDER[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === SECTION_ORDER.length - 1;

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

  const renderSection = () => {
    switch (sectionKey) {
      case 'product':
        return (
          <Card className="qa-section qa-section--step">
            <h2 className="qa-section__title">{t('qa.sections.product.title')}</h2>
            <div className="qa-section__fields">
              <Input
                id="product-name"
                label={t('qa.sections.product.name')}
                value={answers.product?.name || ''}
                onChange={(e) => handleChange('product', 'name', e.target.value)}
              />
              <Input
                id="product-description"
                label={t('qa.sections.product.description')}
                multiline
                rows={3}
                value={answers.product?.description || ''}
                onChange={(e) => handleChange('product', 'description', e.target.value)}
              />
              <Input
                id="product-category"
                label={`${t('qa.sections.product.category')} (${t('common.optional')})`}
                value={answers.product?.category || ''}
                onChange={(e) => handleChange('product', 'category', e.target.value)}
              />
              <Input
                id="product-stage"
                label={`${t('qa.sections.product.stage')} (${t('common.optional')})`}
                value={answers.product?.stage || ''}
                onChange={(e) => handleChange('product', 'stage', e.target.value)}
              />
            </div>
          </Card>
        );
      case 'market':
        return (
          <Card className="qa-section qa-section--step">
            <h2 className="qa-section__title">{t('qa.sections.market.title')}</h2>
            <div className="qa-section__fields">
              <Input
                id="market-target"
                label={t('qa.sections.market.targetMarket')}
                value={answers.market?.target_market || ''}
                onChange={(e) => handleChange('market', 'target_market', e.target.value)}
              />
              <Input
                id="market-geography"
                label={`${t('qa.sections.market.geography')} (${t('common.optional')})`}
                value={answers.market?.geography || ''}
                onChange={(e) => handleChange('market', 'geography', e.target.value)}
              />
              <Input
                id="market-alternatives"
                label={`${t('qa.sections.market.alternatives')} (${t('common.optional')})`}
                value={answers.market?.alternatives?.join(', ') || ''}
                onChange={(e) => handleArrayChange('market', 'alternatives', e.target.value)}
              />
            </div>
          </Card>
        );
      case 'customer':
        return (
          <Card className="qa-section qa-section--step">
            <h2 className="qa-section__title">{t('qa.sections.customer.title')}</h2>
            <div className="qa-section__fields">
              <Input
                id="customer-role"
                label={t('qa.sections.customer.role')}
                value={answers.customer?.role || ''}
                onChange={(e) => handleChange('customer', 'role', e.target.value)}
              />
              <Input
                id="customer-company-stage"
                label={`${t('qa.sections.customer.companyStage')} (${t('common.optional')})`}
                value={answers.customer?.company_stage || ''}
                onChange={(e) => handleChange('customer', 'company_stage', e.target.value)}
              />
              <Input
                id="customer-team-size"
                label={`${t('qa.sections.customer.teamSize')} (${t('common.optional')})`}
                value={answers.customer?.team_size || ''}
                onChange={(e) => handleChange('customer', 'team_size', e.target.value)}
              />
            </div>
          </Card>
        );
      case 'problem':
        return (
          <Card className="qa-section qa-section--step">
            <h2 className="qa-section__title">{t('qa.sections.problem.title')}</h2>
            <div className="qa-section__fields">
              <Input
                id="problem-main-pain"
                label={t('qa.sections.problem.mainPain')}
                multiline
                rows={3}
                value={answers.problem?.main_pain || ''}
                onChange={(e) => handleChange('problem', 'main_pain', e.target.value)}
              />
              <Input
                id="problem-frequency"
                label={`${t('qa.sections.problem.frequency')} (${t('common.optional')})`}
                value={answers.problem?.frequency || ''}
                onChange={(e) => handleChange('problem', 'frequency', e.target.value)}
              />
              <Input
                id="problem-current-solution"
                label={`${t('qa.sections.problem.currentSolution')} (${t('common.optional')})`}
                multiline
                rows={2}
                value={answers.problem?.current_solution || ''}
                onChange={(e) => handleChange('problem', 'current_solution', e.target.value)}
              />
            </div>
          </Card>
        );
      case 'solution':
        return (
          <Card className="qa-section qa-section--step">
            <h2 className="qa-section__title">{t('qa.sections.solution.title')}</h2>
            <div className="qa-section__fields">
              <Input
                id="solution-core-value"
                label={`${t('qa.sections.solution.coreValue')} (${t('common.optional')})`}
                multiline
                rows={3}
                value={answers.solution?.core_value || ''}
                onChange={(e) => handleChange('solution', 'core_value', e.target.value)}
              />
              <Input
                id="solution-differentiator"
                label={`${t('qa.sections.solution.differentiator')} (${t('common.optional')})`}
                multiline
                rows={2}
                value={answers.solution?.differentiator || ''}
                onChange={(e) => handleChange('solution', 'differentiator', e.target.value)}
              />
            </div>
          </Card>
        );
      case 'distribution':
        return (
          <Card className="qa-section qa-section--step">
            <h2 className="qa-section__title">{t('qa.sections.distribution.title')}</h2>
            <div className="qa-section__fields">
              <Input
                id="distribution-channels"
                label={`${t('qa.sections.distribution.knownChannels')} (${t('common.optional')})`}
                value={answers.distribution?.known_channels?.join(', ') || ''}
                onChange={(e) => handleArrayChange('distribution', 'known_channels', e.target.value)}
              />
              <Input
                id="distribution-preferred"
                label={`${t('qa.sections.distribution.preferredChannel')} (${t('common.optional')})`}
                value={answers.distribution?.preferred_channel || ''}
                onChange={(e) => handleChange('distribution', 'preferred_channel', e.target.value)}
              />
            </div>
          </Card>
        );
      case 'pricing':
        return (
          <Card className="qa-section qa-section--step">
            <h2 className="qa-section__title">{t('qa.sections.pricing.title')}</h2>
            <div className="qa-section__fields">
              <Input
                id="pricing-model"
                label={`${t('qa.sections.pricing.model')} (${t('common.optional')})`}
                value={answers.pricing?.model || ''}
                onChange={(e) => handleChange('pricing', 'model', e.target.value)}
              />
              <Input
                id="pricing-expected"
                label={`${t('qa.sections.pricing.expectedPrice')} (${t('common.optional')})`}
                type="number"
                value={answers.pricing?.expected_price || ''}
                onChange={(e) => handleChange('pricing', 'expected_price', e.target.value ? Number(e.target.value) : '')}
              />
            </div>
          </Card>
        );
      case 'traction':
        return (
          <Card className="qa-section qa-section--step">
            <h2 className="qa-section__title">{t('qa.sections.traction.title')}</h2>
            <div className="qa-section__fields">
              <Input
                id="traction-users"
                label={`${t('qa.sections.traction.users')} (${t('common.optional')})`}
                type="number"
                value={answers.traction?.users || ''}
                onChange={(e) => handleChange('traction', 'users', e.target.value ? Number(e.target.value) : undefined)}
              />
              <Input
                id="traction-revenue"
                label={`${t('qa.sections.traction.revenue')} (${t('common.optional')})`}
                type="number"
                value={answers.traction?.revenue || ''}
                onChange={(e) => handleChange('traction', 'revenue', e.target.value ? Number(e.target.value) : undefined)}
              />
              <Input
                id="traction-signals"
                label={`${t('qa.sections.traction.signals')} (${t('common.optional')})`}
                multiline
                rows={2}
                value={answers.traction?.signals || ''}
                onChange={(e) => handleChange('traction', 'signals', e.target.value)}
              />
            </div>
          </Card>
        );
      case 'constraints':
        return (
          <Card className="qa-section qa-section--step">
            <h2 className="qa-section__title">{t('qa.sections.constraints.title')}</h2>
            <div className="qa-section__fields">
              <Input
                id="constraints-budget"
                label={`${t('qa.sections.constraints.budget')} (${t('common.optional')})`}
                value={answers.constraints?.budget || ''}
                onChange={(e) => handleChange('constraints', 'budget', e.target.value)}
              />
              <Input
                id="constraints-time"
                label={`${t('qa.sections.constraints.time')} (${t('common.optional')})`}
                value={answers.constraints?.time || ''}
                onChange={(e) => handleChange('constraints', 'time', e.target.value)}
              />
              <Input
                id="constraints-team"
                label={`${t('qa.sections.constraints.team')} (${t('common.optional')})`}
                value={answers.constraints?.team || ''}
                onChange={(e) => handleChange('constraints', 'team', e.target.value)}
              />
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="qa-page qa-page--steps">
      <div className="qa-page__header">
        <div className="qa-header">
          <h1 className="qa-header__title">{t('qa.title')}</h1>
          <div className="qa-header__meta">
            <span className="qa-step-indicator">
              {t('qa.stepOf').replace('{current}', String(currentStep + 1)).replace('{total}', String(SECTION_ORDER.length))}
            </span>
            <Button onClick={() => navigate('/tools/icp-diagnostician')} variant="secondary" className="qa-header__link">
              {t('qa.goToTools')}
            </Button>
          </div>
        </div>
        <div className="qa-progress">
          <div
            className="qa-progress__bar"
            style={{ width: `${((currentStep + 1) / SECTION_ORDER.length) * 100}%` }}
          />
        </div>
        {error && <div className="qa-alert qa-alert--error">{error}</div>}
      </div>

      <div className="qa-page__content">
        {renderSection()}
      </div>

      <div className="qa-page__footer qa-page__footer--steps">
        <div className="qa-steps-actions">
          <div className="qa-steps-actions__left">
            {!isFirst && (
              <Button type="button" variant="secondary" onClick={goBack}>
                {t('qa.back')}
              </Button>
            )}
          </div>
          <div className="qa-steps-actions__right">
            <Button type="button" variant="secondary" onClick={skip}>
              {t('qa.skip')}
            </Button>
            <Button type="button" onClick={save} isLoading={saving}>
              {t('qa.saveAnswers')}
            </Button>
            <Button type="button" onClick={goNext}>
              {isLast ? t('qa.done') : t('qa.next')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyQAPage;
