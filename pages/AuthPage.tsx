import React, { useState, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Toggle from '../components/Toggle';
import LanguageSwitcher from '../components/LanguageSwitcher';
import api from '../services/api';

type AuthMode = 'signup' | 'login';
type UserType = 'company' | 'blogger';

const AuthPage: React.FC = () => {
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
    description: ''
  });
  
  const [bloggerFormData, setBloggerFormData] = useState({
    name: '',
    email: '',
    password: '',
    bio: ''
  });
  
  const [signupError, setSignupError] = useState('');
  const [isSignupLoading, setIsSignupLoading] = useState(false);
  
  const { login, isLoggedIn, user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  if (isLoggedIn) {
    if (user?.role === 'COMPANY') {
      const selectedModule = localStorage.getItem('selectedModule');
      if (selectedModule === 'gtmStrategy') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/company/dashboard', { replace: true });
      }
    } else if (user?.role === 'BLOGGER') {
      navigate('/blogger/products', { replace: true });
    }
  }

  const handleGoogleSignIn = async (userType: 'company' | 'blogger') => {
    try {
      // Get authorization URL from backend
      const { authorization_url, state, redirect_uri } = await api.getGoogleAuthorizeUrl(userType);
      
      // Log redirect URI for debugging
      console.log('OAuth redirect_uri from backend:', redirect_uri);
      console.log('Current origin:', window.location.origin);
      console.log('Current protocol:', window.location.protocol);
      console.log('Current hostname:', window.location.hostname);
      console.log('Expected redirect URI:', `${window.location.origin}/auth/callback`);
      
      // Verify redirect_uri matches expected format
      const expectedRedirectUri = `${window.location.origin}/auth/callback`;
      if (redirect_uri !== expectedRedirectUri) {
        console.error('⚠️ Redirect URI mismatch detected!', {
          backend: redirect_uri,
          expected: expectedRedirectUri,
          message: 'The backend is sending a different redirect_uri than expected. This will cause a redirect_uri_mismatch error from Google. Please ensure the backend FRONTEND_URL environment variable matches the current origin.',
        });
        
        // Show user-friendly error
        setLoginError(`Несоответствие redirect URI. Ожидается: ${expectedRedirectUri}, получено: ${redirect_uri}. Пожалуйста, проверьте настройки бэкенда.`);
        return;
      }
      
      // Store state and redirect_uri in sessionStorage for validation
      console.log('Storing OAuth state:', {
        state,
        stateLength: state.length,
        userType,
        redirect_uri,
      });
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_redirect_uri', redirect_uri);
      sessionStorage.setItem('oauth_user_type', userType);
      
      // Verify what we stored
      console.log('Stored in sessionStorage:', {
        oauth_state: sessionStorage.getItem('oauth_state'),
        oauth_redirect_uri: sessionStorage.getItem('oauth_redirect_uri'),
        oauth_user_type: sessionStorage.getItem('oauth_user_type'),
      });
      
      // Redirect user to Google
      window.location.href = authorization_url;
    } catch (error) {
      console.error('Failed to initiate Google OAuth:', error);
      setLoginError(t('auth.googleAuthError'));
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoginLoading(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err) {
      setLoginError(t('auth.loginError'));
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
    } catch (err) {
      setSignupError(t('auth.signupError'));
    } finally {
      setIsSignupLoading(false);
    }
  };

  const handleCompanyFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCompanyFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBloggerFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBloggerFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className={mode === 'signup' ? "auth-landing-container auth-landing-container--start" : "auth-landing-container"}>
      <div className="max-w-2xl w-full">
        
        <Card className="p-8 w-full">
            <div className="mb-8 text-left">
              <div className="flex justify-end mb-4">
                <LanguageSwitcher />
              </div>
              <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">{t('auth.welcome')}</h1>
              <p className="text-center text-gray-600">{t('auth.chooseHowToContinue')}</p>
            </div>
          {mode === 'signup' ? (
            <>
              <Toggle
                options={[
                  { value: 'company', label: t('common.company') },
                  { value: 'blogger', label: t('common.blogger') }
                ]}
                selected={userType}
                onChange={(value) => setUserType(value as UserType)}
              />
              
              <form className="mt-6 space-y-6" onSubmit={handleSignup}>
                {signupError && <p className="text-center text-sm text-red-600">{signupError}</p>}
                
                {userType === 'company' ? (
                  <>
                    <Input
                      id="company-full-name"
                      name="full_name"
                      label={t('auth.fullName')}
                      type="text"
                      required
                      value={companyFormData.full_name}
                      onChange={handleCompanyFormChange}
                    />
                    <Input
                      id="company-email"
                      name="email"
                      label={t('auth.email')}
                      type="email"
                      autoComplete="email"
                      required
                      value={companyFormData.email}
                      onChange={handleCompanyFormChange}
                    />
                    <Input
                      id="company-phone"
                      name="phone_number"
                      label={`${t('auth.phoneNumber')} (${t('common.optional')})`}
                      type="tel"
                      value={companyFormData.phone_number}
                      onChange={handleCompanyFormChange}
                    />
                    <Input
                      id="company-profile-link"
                      name="professional_profile_link"
                      label={`${t('auth.linkedinLink')} (${t('common.optional')})`}
                      type="url"
                      value={companyFormData.professional_profile_link}
                      onChange={handleCompanyFormChange}
                    />
                    <Input
                      id="company-name"
                      name="company_name"
                      label={t('auth.companyName')}
                      type="text"
                      required
                      value={companyFormData.company_name}
                      onChange={handleCompanyFormChange}
                    />
                    <div>
                      <label htmlFor="company-stage" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('auth.stage')} ({t('common.optional')})
                      </label>
                      <select
                        id="company-stage"
                        name="stage"
                        value={companyFormData.stage}
                        onChange={handleCompanyFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      >
                        <option value="">{t('auth.selectStage')}</option>
                        <option value="idea">{t('auth.stageOptions.idea')}</option>
                        <option value="pre-revenue">{t('auth.stageOptions.preRevenue')}</option>
                        <option value="post-PMF">{t('auth.stageOptions.postPMF')}</option>
                        <option value="scaling">{t('auth.stageOptions.scaling')}</option>
                      </select>
                    </div>
                    <Input
                      id="company-description"
                      name="description"
                      label={`${t('common.description')} (${t('common.optional')})`}
                      multiline
                      rows={3}
                      value={companyFormData.description}
                      onChange={handleCompanyFormChange}
                    />
                    <Input
                      id="company-password"
                      name="password"
                      label={t('common.password')}
                      type="password"
                      autoComplete="new-password"
                      required
                      value={companyFormData.password}
                      onChange={handleCompanyFormChange}
                    />
                  </>
                ) : (
                  <>
                    <Input
                      id="blogger-name"
                      name="name"
                      label={t('common.name')}
                      type="text"
                      required
                      value={bloggerFormData.name}
                      onChange={handleBloggerFormChange}
                    />
                    <Input
                      id="blogger-email"
                      name="email"
                      label={t('auth.email')}
                      type="email"
                      autoComplete="email"
                      required
                      value={bloggerFormData.email}
                      onChange={handleBloggerFormChange}
                    />
                    <Input
                      id="blogger-password"
                      name="password"
                      label={t('common.password')}
                      type="password"
                      autoComplete="new-password"
                      required
                      value={bloggerFormData.password}
                      onChange={handleBloggerFormChange}
                    />
                    <Input
                      id="blogger-bio"
                      name="bio"
                      label={`${t('auth.bio')} (${t('common.optional')})`}
                      multiline
                      rows={3}
                      value={bloggerFormData.bio}
                      onChange={handleBloggerFormChange}
                    />
                  </>
                )}
                
                <Button type="submit" isLoading={isSignupLoading} className="w-full">
                  {t('auth.createAccount')}
                </Button>
              </form>
              
              {/* <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">или</span>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => handleGoogleSignIn(userType)}
                  className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t('auth.loginWithGoogle')}
                </button>
              </div> */}
              
              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-medium text-primary-text hover:text-primary-text-600"
                >
                  {t('auth.alreadyHaveAccount')}
                </button>
              </div>
            </>
          ) : (
            <>
              <form className="space-y-6" onSubmit={handleLogin}>
                {loginError && <p className="text-center text-sm text-red-600">{loginError}</p>}
                
                <Input
                  id="login-email"
                  label={t('auth.email')}
                  type="email"
                  autoComplete="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
                <Input
                  id="login-password"
                  label={t('common.password')}
                  type="password"
                  autoComplete="current-password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                
                <Button type="submit" isLoading={isLoginLoading} className="w-full">
                  {t('common.login')}
                </Button>
              </form>
              
              {/* <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">или</span>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => handleGoogleSignIn(userType)}
                  className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t('auth.loginWithGoogle')}
                </button>
              </div> */}
              
              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="font-medium text-primary-text hover:text-primary-text-600"
                >
                  {t('auth.noAccount')}
                </button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;

