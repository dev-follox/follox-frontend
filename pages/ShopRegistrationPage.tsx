import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import api from '../services/api';
import { useTranslation } from '../hooks/useTranslation';
import Select from '../components/Select';

const ShopRegistrationPage: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone_number: '',
    professional_profile_link: '',
    company_name: '',
    stage: '' as 'idea' | 'pre-revenue' | 'post-PMF' | 'scaling' | '',
    description: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.createCompany({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone_number || null,
        professional_profile_link: formData.professional_profile_link || null,
        company_name: formData.company_name,
        stage: formData.stage || null,
        description: formData.description || null,
      });
      // Redirect to login page after successful registration
      navigate('/login');
    } catch (err) {
      setError(t('registration.signupError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="registration-page">
      <div className="registration-container">
        <div className="registration-header">
          <Link to="/">
            <Button variant="secondary" size="sm" aria-label={t('common.back')}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L8.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </Button>
          </Link>
          <h2 className="registration-header__title">
            {t('registration.companyTitle')}
          </h2>
          <span className="registration-header__spacer" />
        </div>
        <Card className="panel panel--padded">
          <form className="registration-form" onSubmit={handleSubmit}>
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            
            <Input
              id="full_name"
              name="full_name"
              label={t('auth.fullName')}
              type="text"
              required
              value={formData.full_name}
              onChange={handleChange}
            />

            <Input
              id="email"
              name="email"
              label={t('common.email')}
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
            />

            <Input
              id="phone_number"
              name="phone_number"
              label={`${t('auth.phoneNumber')} (${t('common.optional')})`}
              type="tel"
              value={formData.phone_number}
              onChange={handleChange}
            />

            <Input
              id="professional_profile_link"
              name="professional_profile_link"
              label={`${t('auth.linkedinLink')} (${t('common.optional')})`}
              type="url"
              value={formData.professional_profile_link}
              onChange={handleChange}
            />

            <Input
              id="company_name"
              name="company_name"
              label={t('auth.companyName')}
              type="text"
              required
              value={formData.company_name}
              onChange={handleChange}
            />

            <Select
              id="stage"
              name="stage"
              label={`${t('auth.stage')} (${t('common.optional')})`}
              value={formData.stage}
              onChange={handleChange}
              options={[
                { value: '', label: t('auth.selectStage') },
                { value: 'idea', label: t('auth.stageOptions.idea') },
                { value: 'pre-revenue', label: t('auth.stageOptions.preRevenue') },
                { value: 'post-PMF', label: t('auth.stageOptions.postPMF') },
                { value: 'scaling', label: t('auth.stageOptions.scaling') }
              ]}
            />

            <Input
              id="description"
              name="description"
              label={`${t('common.description')} (${t('common.optional')})`}
              multiline
              rows={3}
              value={formData.description}
              onChange={handleChange}
            />

            <Input
              id="password"
              name="password"
              label={t('common.password')}
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
            />

            <div>
              <Button type="submit" isLoading={isLoading} className="w-full">
                {t('auth.createAccount')}
              </Button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="font-medium text-primary-text hover:text-primary-text-600"
              >
                {t('auth.alreadyHaveAccount')}
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ShopRegistrationPage;
