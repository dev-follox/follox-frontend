import React, { useState, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import Input from './Input';
import Button from './Button';
import Toggle from './Toggle';
import api from '../services/api';

type AuthMode = 'signup' | 'login';
type UserType = 'company' | 'blogger';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [userType, setUserType] = useState<UserType>('company');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const [companyFormData, setCompanyFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone_number: '',
    professional_profile_link: '',
    company_name: '',
    stage: '' as 'idea' | 'pre-revenue' | 'post-PMF' | 'scaling' | '',
    description: '',
  });

  const [bloggerFormData, setBloggerFormData] = useState({
    name: '',
    email: '',
    password: '',
    bio: '',
  });

  const [signupError, setSignupError] = useState('');
  const [isSignupLoading, setIsSignupLoading] = useState(false);

  const { login } = useAuth();
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoginLoading(true);
    try {
      await login(loginEmail, loginPassword);
      onClose();
    } catch {
      setLoginError(t('auth.loginError'));
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setIsSignupLoading(true);
    try {
      if (userType === 'company') {
        await api.createCompany({
          full_name: companyFormData.full_name,
          email: companyFormData.email,
          password: companyFormData.password,
          phone_number: companyFormData.phone_number || null,
          professional_profile_link: companyFormData.professional_profile_link || null,
          company_name: companyFormData.company_name,
          stage: companyFormData.stage || null,
          description: companyFormData.description || null,
        });
      } else {
        await api.createBlogger(bloggerFormData);
      }
      setMode('login');
      setLoginEmail(userType === 'company' ? companyFormData.email : bloggerFormData.email);
    } catch {
      setSignupError(t('auth.signupError'));
    } finally {
      setIsSignupLoading(false);
    }
  };

  const handleCompanyFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCompanyFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBloggerFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBloggerFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="auth-modal__close"
          onClick={onClose}
          aria-label={t('common.close')}
        >
          ×
        </button>
        <div className="auth-modal__header">
          <h2 className="auth-modal__title">{t('auth.welcome')}</h2>
          <p className="auth-modal__subtitle">{t('auth.chooseHowToContinue')}</p>
        </div>

        {mode === 'signup' ? (
          <>
            <Toggle
              options={[
                { value: 'company', label: t('common.company') },
                { value: 'blogger', label: t('common.blogger') },
              ]}
              selected={userType}
              onChange={(v) => setUserType(v as UserType)}
            />
            <form className="auth-modal__form" onSubmit={handleSignup}>
              {signupError && <p className="auth-modal__error">{signupError}</p>}
              {userType === 'company' ? (
                <>
                  <Input id="m-full_name" name="full_name" label={t('auth.fullName')} type="text" required value={companyFormData.full_name} onChange={handleCompanyFormChange} />
                  <Input id="m-email" name="email" label={t('auth.email')} type="email" required value={companyFormData.email} onChange={handleCompanyFormChange} />
                  <Input id="m-phone_number" name="phone_number" label={`${t('auth.phoneNumber')} (${t('common.optional')})`} type="tel" value={companyFormData.phone_number} onChange={handleCompanyFormChange} />
                  <Input id="m-professional_profile_link" name="professional_profile_link" label={`${t('auth.linkedinLink')} (${t('common.optional')})`} type="url" value={companyFormData.professional_profile_link} onChange={handleCompanyFormChange} />
                  <Input id="m-company_name" name="company_name" label={t('auth.companyName')} type="text" required value={companyFormData.company_name} onChange={handleCompanyFormChange} />
                  <div>
                    <label htmlFor="m-stage" className="auth-modal__label">
                      {t('auth.stage')} ({t('common.optional')})
                    </label>
                    <select id="m-stage" name="stage" value={companyFormData.stage} onChange={handleCompanyFormChange} className="auth-modal__select">
                      <option value="">{t('auth.selectStage')}</option>
                      <option value="idea">{t('auth.stageOptions.idea')}</option>
                      <option value="pre-revenue">{t('auth.stageOptions.preRevenue')}</option>
                      <option value="post-PMF">{t('auth.stageOptions.postPMF')}</option>
                      <option value="scaling">{t('auth.stageOptions.scaling')}</option>
                    </select>
                  </div>
                  <Input id="m-description" name="description" label={`${t('common.description')} (${t('common.optional')})`} multiline rows={2} value={companyFormData.description} onChange={handleCompanyFormChange} />
                  <Input id="m-password" name="password" label={t('common.password')} type="password" required value={companyFormData.password} onChange={handleCompanyFormChange} />
                </>
              ) : (
                <>
                  <Input id="m-name" name="name" label={t('common.name')} type="text" required value={bloggerFormData.name} onChange={handleBloggerFormChange} />
                  <Input id="m-b-email" name="email" label={t('auth.email')} type="email" required value={bloggerFormData.email} onChange={handleBloggerFormChange} />
                  <Input id="m-b-password" name="password" label={t('common.password')} type="password" required value={bloggerFormData.password} onChange={handleBloggerFormChange} />
                  <Input id="m-bio" name="bio" label={`${t('auth.bio')} (${t('common.optional')})`} multiline rows={2} value={bloggerFormData.bio} onChange={handleBloggerFormChange} />
                </>
              )}
              <Button type="submit" isLoading={isSignupLoading} className="auth-modal__submit">
                {t('auth.createAccount')}
              </Button>
            </form>
            <p className="auth-modal__switch">
              <button type="button" onClick={() => setMode('login')} className="auth-modal__link">
                {t('auth.alreadyHaveAccount')}
              </button>
            </p>
          </>
        ) : (
          <>
            <form className="auth-modal__form" onSubmit={handleLogin}>
              {loginError && <p className="auth-modal__error">{loginError}</p>}
              <Input id="m-login-email" label={t('auth.email')} type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
              <Input id="m-login-password" label={t('common.password')} type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              <Button type="submit" isLoading={isLoginLoading} className="auth-modal__submit">
                {t('common.login')}
              </Button>
            </form>
            <p className="auth-modal__switch">
              <button type="button" onClick={() => setMode('signup')} className="auth-modal__link">
                {t('auth.noAccount')}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
