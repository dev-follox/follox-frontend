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

const CompanyQAPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<CompanyAnswers['answers']>({});

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

  const handleChange = (field: keyof CompanyAnswers['answers'], value: string) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  };

  const save = async () => {
    if (!user?.company?.id) return;
    setSaving(true);
    setError(null);
    try {
      await api.updateCompanyAnswers(user.company.id, { answers });
      // Mark answers as updated - this will trigger tool regeneration
      const updateTimestamp = new Date().toISOString();
      localStorage.setItem(`answers_last_updated_${user.company.id}`, updateTimestamp);
      showToast({ message: t('qa.answersSaved'), type: 'success', duration: 4000 });
    } catch (err: any) {
      setError(t('qa.saveError'));
      console.error('Failed to save answers:', err);
    } finally {
      setSaving(false);
    }
  };


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

  const fieldLabels: Record<keyof CompanyAnswers['answers'], string> = {
    name: t('qa.sections.product.name'),
    product: t('qa.sections.product.description'),
    client: t('qa.sections.customer.role'),
    problem: t('qa.sections.problem.mainPain'),
    value_proposition: t('qa.sections.solution.coreValue'),
    competitive_advantage: t('qa.sections.solution.differentiator'),
    business_model: t('qa.sections.pricing.model'),
  };

  return (
    <div className="qa-page qa-page--steps">
      <div className="qa-page__header">
        <div className="qa-header">
          <h1 className="qa-header__title">{t('qa.title')}</h1>
          <div className="qa-header__meta">
            <Button onClick={() => navigate('/tools/icp-diagnostician')} variant="secondary" className="qa-header__link">
              {t('qa.goToTools')}
            </Button>
          </div>
        </div>
        {error && <div className="qa-alert qa-alert--error">{error}</div>}
      </div>

      <div className="qa-page__content">
        <Card className="qa-section qa-section--step">
          <div className="qa-section__fields">
            <Input
              id="answer-name"
              label={fieldLabels.name}
              value={answers.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
            />
            <Input
              id="answer-product"
              label={fieldLabels.product}
              multiline
              rows={3}
              value={answers.product || ''}
              onChange={(e) => handleChange('product', e.target.value)}
            />
            <Input
              id="answer-client"
              label={fieldLabels.client}
              value={answers.client || ''}
              onChange={(e) => handleChange('client', e.target.value)}
            />
            <Input
              id="answer-problem"
              label={fieldLabels.problem}
              multiline
              rows={3}
              value={answers.problem || ''}
              onChange={(e) => handleChange('problem', e.target.value)}
            />
            <Input
              id="answer-value-proposition"
              label={fieldLabels.value_proposition}
              multiline
              rows={3}
              value={answers.value_proposition || ''}
              onChange={(e) => handleChange('value_proposition', e.target.value)}
            />
            <Input
              id="answer-competitive-advantage"
              label={fieldLabels.competitive_advantage}
              multiline
              rows={2}
              value={answers.competitive_advantage || ''}
              onChange={(e) => handleChange('competitive_advantage', e.target.value)}
            />
            <Input
              id="answer-business-model"
              label={fieldLabels.business_model}
              multiline
              rows={2}
              value={answers.business_model || ''}
              onChange={(e) => handleChange('business_model', e.target.value)}
            />
          </div>
        </Card>
      </div>

      <div className="qa-page__footer qa-page__footer--steps">
        <div className="qa-steps-actions">
          <div className="qa-steps-actions__right">
            <Button type="button" onClick={save} isLoading={saving}>
              {t('qa.saveAnswers')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/tools/icp-diagnostician')}>
              {t('qa.done')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyQAPage;
