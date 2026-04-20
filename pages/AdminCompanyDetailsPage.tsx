import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Company, CompanyAnswers, CompanySubscriptionAdminUpdate } from '../types';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Spinner from '../components/Spinner';

const AdminCompanyDetailsPage: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [company, setCompany] = useState<Company | null>(null);
  const [answers, setAnswers] = useState<CompanyAnswers | null>(null);

  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState('');
  const [defaultBonusPercent, setDefaultBonusPercent] = useState('');
  const [subscriptionSaving, setSubscriptionSaving] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | null>(null);
  const [subscriptionFormError, setSubscriptionFormError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
    if (companyId) {
      loadData();
    }
  }, [user, companyId, navigate]);

  const loadData = async () => {
    if (!companyId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const companyData = await api.getCompanyById(Number(companyId));
      setCompany(companyData);
      setSubscriptionExpiresAt(companyData.subscription_expires_at ?? '');
      setDefaultBonusPercent(String(companyData.default_designer_bonus_percent ?? ''));
      setSubscriptionMessage(null);
      setSubscriptionFormError(null);
      
      try {
        const answersData = await api.getCompanyAnswersAdmin(Number(companyId));
        setAnswers(answersData);
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          console.error('Failed to load answers:', err);
        }
      }
    } catch (err: any) {
      setError(t('admin.companyDetails.loadError'));
      console.error('Failed to load company data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSubscription = async () => {
    if (!companyId) return;
    setSubscriptionFormError(null);
    setSubscriptionMessage(null);

    const trimmedExpires = subscriptionExpiresAt.trim();
    let subscription_expires_at: string | null;
    if (!trimmedExpires) {
      subscription_expires_at = null;
    } else {
      const d = new Date(trimmedExpires);
      if (Number.isNaN(d.getTime())) {
        setSubscriptionFormError(t('admin.companyDetails.subscriptionDateInvalid'));
        return;
      }
      subscription_expires_at = d.toISOString();
    }

    const bonusTrim = defaultBonusPercent.trim();
    let default_designer_bonus_percent: number | null | undefined;
    if (bonusTrim === '') {
      default_designer_bonus_percent = undefined;
    } else {
      const n = Number(bonusTrim);
      if (Number.isNaN(n) || n < 0 || n > 100) {
        setSubscriptionFormError(t('registration.invalidDefaultBonus'));
        return;
      }
      default_designer_bonus_percent = n;
    }

    const body: CompanySubscriptionAdminUpdate = { subscription_expires_at };
    if (default_designer_bonus_percent !== undefined) {
      body.default_designer_bonus_percent = default_designer_bonus_percent;
    }

    setSubscriptionSaving(true);
    try {
      const updated = await api.patchAdminCompany(Number(companyId), body);
      setCompany(updated);
      setSubscriptionExpiresAt(updated.subscription_expires_at ?? '');
      setDefaultBonusPercent(String(updated.default_designer_bonus_percent ?? ''));
      setSubscriptionMessage(t('admin.companyDetails.subscriptionSaved'));
    } catch (err) {
      console.error(err);
      setSubscriptionFormError(t('admin.companyDetails.subscriptionError'));
    } finally {
      setSubscriptionSaving(false);
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

      <Card className="p-6 mb-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t('admin.companyDetails.subscriptionTitle')}</h2>
        {subscriptionFormError && <p className="text-sm text-red-600 mb-3">{subscriptionFormError}</p>}
        {subscriptionMessage && <p className="text-sm text-green-700 mb-3">{subscriptionMessage}</p>}
        <div className="space-y-4">
          <div>
            <label htmlFor="admin-sub-expires" className="block text-sm font-medium text-foreground mb-1">
              {t('admin.companyDetails.subscriptionExpires')}
            </label>
            <Input
              id="admin-sub-expires"
              value={subscriptionExpiresAt}
              onChange={(e) => setSubscriptionExpiresAt(e.target.value)}
              placeholder="2027-12-31T23:59:59.000Z"
            />
            <p className="text-xs text-secondary-alpha mt-1">{t('admin.companyDetails.subscriptionHint')}</p>
          </div>
          <div>
            <label htmlFor="admin-default-bonus" className="block text-sm font-medium text-foreground mb-1">
              {t('admin.companyDetails.defaultBonusPercent')}
            </label>
            <Input
              id="admin-default-bonus"
              type="number"
              min={0}
              max={100}
              step={1}
              value={defaultBonusPercent}
              onChange={(e) => setDefaultBonusPercent(e.target.value)}
            />
            <p className="text-xs text-secondary-alpha mt-1">{t('admin.companyDetails.defaultBonusHint')}</p>
          </div>
          <Button type="button" onClick={handleSaveSubscription} isLoading={subscriptionSaving}>
            {t('admin.companyDetails.saveSubscription')}
          </Button>
        </div>
      </Card>

      {/* Content */}
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
                  <Card className="qa-section">
                    <h2 className="qa-section__title">{t('qa.title')}</h2>
                    <div className="qa-section__fields">
                      <Input
                        id="answer-name"
                        label={t('qa.sections.product.name')}
                        value={answers.answers.name || ''}
                        disabled
                      />
                      <Input
                        id="answer-product"
                        label={t('qa.sections.product.description')}
                        multiline
                        rows={3}
                        value={answers.answers.product || ''}
                        disabled
                      />
                      <Input
                        id="answer-client"
                        label={t('qa.sections.customer.role')}
                        value={answers.answers.client || ''}
                        disabled
                      />
                      <Input
                        id="answer-problem"
                        label={t('qa.sections.problem.mainPain')}
                        multiline
                        rows={3}
                        value={answers.answers.problem || ''}
                        disabled
                      />
                      <Input
                        id="answer-value-proposition"
                        label={t('qa.sections.solution.coreValue')}
                        multiline
                        rows={3}
                        value={answers.answers.value_proposition || ''}
                        disabled
                      />
                      <Input
                        id="answer-competitive-advantage"
                        label={t('qa.sections.solution.differentiator')}
                        multiline
                        rows={2}
                        value={answers.answers.competitive_advantage || ''}
                        disabled
                      />
                      <Input
                        id="answer-business-model"
                        label={t('qa.sections.pricing.model')}
                        multiline
                        rows={2}
                        value={answers.answers.business_model || ''}
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
    </div>
  );
};

export default AdminCompanyDetailsPage;
