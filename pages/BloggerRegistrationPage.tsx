import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import api from '../services/api';
import { useTranslation } from '../hooks/useTranslation';
import { validatePassword, getPasswordErrorFrom422 } from '../utils/passwordValidation';

const BloggerRegistrationPage: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    bio: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const passwordValidation = validatePassword(formData.password, t);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message ?? t('registration.signupError'));
      return;
    }
    setIsLoading(true);

    try {
      await api.createBlogger(formData);
      navigate('/login');
    } catch (err: any) {
      const passwordMsg = err?.response?.status === 422 && err?.response?.data
        ? getPasswordErrorFrom422(err.response.data)
        : null;
      setError(passwordMsg ?? t('registration.signupError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    if (name === 'password') setPasswordTouched(true);
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
            {t('registration.bloggerTitle')}
          </h2>
          <span className="registration-header__spacer" />
        </div>
        <Card className="panel panel--padded">
          <form className="registration-form" onSubmit={handleSubmit}>
            {error && <p className="text-center text-sm text-red-600">{error}</p>}

            <Input
              id="name"
              name="name"
              label={t('common.name')}
              type="text"
              required
              value={formData.name}
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
              id="password"
              name="password"
              label={t('common.password')}
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              onBlur={() => setPasswordTouched(true)}
              error={
                passwordTouched
                  ? (() => {
                      const v = validatePassword(formData.password, t);
                      return v.valid ? undefined : v.message;
                    })()
                  : undefined
              }
            />

            <Input
              id="bio"
              name="bio"
              label={`${t('auth.bio')} (${t('common.optional')})`}
              multiline
              rows={3}
              value={formData.bio}
              onChange={handleChange}
            />

            <div>
              <Button type="submit" isLoading={isLoading} className="w-full">
                {t('auth.createAccount')}
              </Button>
            </div>

            <div className="registration-link">
              <Link to="/login">
                {t('auth.alreadyHaveAccount')}
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default BloggerRegistrationPage;
