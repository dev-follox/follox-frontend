import React, { useMemo, useState, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { validatePassword, getPasswordErrorFrom422 } from '../utils/passwordValidation';
import { ArrowLeft, Eye, EyeOff, Palette, Store } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';

type AuthMode = 'signup' | 'login';
type UserType = 'company' | 'blogger';

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [userType, setUserType] = useState<UserType>('company');
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  
  const [companyFormData, setCompanyFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone_number: '',
    company_name: '',
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
  const [companyPasswordTouched, setCompanyPasswordTouched] = useState(false);
  const [bloggerPasswordTouched, setBloggerPasswordTouched] = useState(false);

  const { login, isLoggedIn, user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const inputCls =
    'mt-1 flex h-10 w-full border border-border bg-card px-3 py-2 text-base text-foreground placeholder:text-secondary-alpha disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary';
  const labelCls = 'text-sm font-medium leading-none text-foreground/90';
  const secondaryLinkCls = 'text-sm text-secondary-alpha hover:text-foreground transition-colors';
  
  if (isLoggedIn) {
    if (user?.role === 'COMPANY') {
      const selectedModule = localStorage.getItem('selectedModule');
      if (selectedModule === 'tools') {
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

    const password = userType === 'company' ? companyFormData.password : bloggerFormData.password;
    if (confirmPassword && password !== confirmPassword) {
      setSignupError(t('profile.security.passwordMismatch'));
      return;
    }

    const passwordValidation = validatePassword(password, t);
    if (!passwordValidation.valid) {
      setSignupError(passwordValidation.message ?? t('auth.signupError'));
      return;
    }
    setIsSignupLoading(true);

    try {
      if (userType === 'company') {
        await api.createCompany({
          full_name: companyFormData.full_name,
          email: companyFormData.email,
          password: companyFormData.password,
          phone_number: companyFormData.phone_number || null,
          company_name: companyFormData.company_name,
          description: companyFormData.description || null,
        });
      } else {
        await api.createBlogger(bloggerFormData);
      }
      setMode('login');
      setLoginEmail(userType === 'company' ? companyFormData.email : bloggerFormData.email);
    } catch (err: any) {
      const passwordMsg = err?.response?.status === 422 && err?.response?.data
        ? getPasswordErrorFrom422(err.response.data)
        : null;
      setSignupError(passwordMsg ?? t('auth.signupError'));
    } finally {
      setIsSignupLoading(false);
    }
  };

  const handleCompanyFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'password') setCompanyPasswordTouched(true);
    setCompanyFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBloggerFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'password') setBloggerPasswordTouched(true);
    setBloggerFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const currentPasswordValue = useMemo(
    () => (mode === 'login' ? loginPassword : userType === 'company' ? companyFormData.password : bloggerFormData.password),
    [mode, loginPassword, userType, companyFormData.password, bloggerFormData.password]
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className={`inline-flex items-center gap-2 transition-colors ${secondaryLinkCls}`}>
            <ArrowLeft className="h-4 w-4" />
            {t('authV2.backHome')}
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="bg-card border border-border p-8">
          <div className="flex items-center justify-center gap-2 mb-8">
            <img src="/assets/logo.png" alt={t('landingV2.footer.brand')} className="h-9 w-9 object-contain" />
            <span className="text-2xl font-bold text-foreground">{t('landingV2.footer.brand')}</span>
          </div>

          <div className="flex border-b border-border mb-6">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                mode === 'login' ? 'border-primary text-foreground' : 'border-transparent text-secondary-alpha hover:text-foreground'
              }`}
            >
              {t('authV2.tabs.login')}
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                mode === 'signup' ? 'border-primary text-foreground' : 'border-transparent text-secondary-alpha hover:text-foreground'
              }`}
            >
              {t('authV2.tabs.signup')}
            </button>
          </div>

          {mode === 'signup' && (
            <div className="mb-6">
              <label className={`${labelCls} mb-2 block`}>{t('authV2.rolePrompt')}</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType('company')}
                  className={`flex flex-col items-center gap-2 border-2 p-4 transition-all ${
                    userType === 'company' ? 'border-primary bg-primary/5' : 'border-border hover:border-foreground/20'
                  }`}
                >
                  <Store className={`h-6 w-6 ${userType === 'company' ? 'text-primary' : 'text-stone'}`} strokeWidth={1.5} />
                  <span className="text-sm font-medium text-foreground">{t('authV2.roles.shop')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('blogger')}
                  className={`flex flex-col items-center gap-2 border-2 p-4 transition-all ${
                    userType === 'blogger' ? 'border-primary bg-primary/5' : 'border-border hover:border-foreground/20'
                  }`}
                >
                  <Palette className={`h-6 w-6 ${userType === 'blogger' ? 'text-primary' : 'text-stone'}`} strokeWidth={1.5} />
                  <span className="text-sm font-medium text-foreground">{t('authV2.roles.designer')}</span>
                </button>
              </div>
            </div>
          )}

          {mode === 'login' ? (
            <form className="space-y-4" onSubmit={handleLogin}>
              {loginError && <p className="text-center text-sm text-red-600">{loginError}</p>}

              <div>
                <label htmlFor="email" className={labelCls}>
                  {t('auth.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  className={inputCls}
                  placeholder="you@example.com"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className={labelCls}>
                  {t('common.password')}
                </label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`${inputCls} pr-10`}
                    placeholder={t('authV2.placeholders.password')}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-foreground"
                    aria-label={t('authV2.togglePassword')}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* <div className="text-right">
                <button type="button" className="text-sm text-primary hover:underline">
                  {t('authV2.forgotPassword')}
                </button>
              </div> */}

              <button
                className="h-11 w-full bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                type="submit"
                disabled={isLoginLoading}
              >
                {isLoginLoading ? t('common.loading') : t('common.login')}
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleSignup}>
              {signupError && <p className="text-center text-sm text-red-600">{signupError}</p>}

              {userType === 'company' ? (
                <>
                  <div>
                    <label htmlFor="company-full-name" className={labelCls}>
                      {t('auth.fullName')}
                    </label>
                    <input
                      id="company-full-name"
                      name="full_name"
                      className={inputCls}
                      placeholder={t('authV2.placeholders.fullName')}
                      required
                      value={companyFormData.full_name}
                      onChange={handleCompanyFormChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="company-email" className={labelCls}>
                      {t('auth.email')}
                    </label>
                    <input
                      id="company-email"
                      name="email"
                      type="email"
                      className={inputCls}
                      placeholder="you@example.com"
                      required
                      value={companyFormData.email}
                      onChange={handleCompanyFormChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="company-name" className={labelCls}>
                      {t('auth.companyName')}
                    </label>
                    <input
                      id="company-name"
                      name="company_name"
                      className={inputCls}
                      placeholder={t('authV2.placeholders.companyName')}
                      required
                      value={companyFormData.company_name}
                      onChange={handleCompanyFormChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="company-phone" className={labelCls}>
                      {t('auth.phoneNumber')} ({t('common.optional')})
                    </label>
                    <input
                      id="company-phone"
                      name="phone_number"
                      className={inputCls}
                      value={companyFormData.phone_number}
                      onChange={handleCompanyFormChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="company-description" className={labelCls}>
                      {t('common.description')} ({t('common.optional')})
                    </label>
                    <textarea
                      id="company-description"
                      name="description"
                      rows={3}
                      className={`${inputCls} h-auto`}
                      value={companyFormData.description}
                      onChange={handleCompanyFormChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="company-password" className={labelCls}>
                      {t('common.password')}
                    </label>
                    <div className="relative mt-1">
                      <input
                        id="company-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        className={`${inputCls} pr-10`}
                        placeholder={t('authV2.placeholders.passwordMin')}
                        required
                        value={companyFormData.password}
                        onChange={handleCompanyFormChange}
                        onBlur={() => setCompanyPasswordTouched(true)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-foreground"
                        aria-label={t('authV2.togglePassword')}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {companyPasswordTouched && (() => {
                      const v = validatePassword(companyFormData.password, t);
                      return v.valid ? null : <p className="mt-1 text-sm text-red-600">{v.message}</p>;
                    })()}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="designer-name" className={labelCls}>
                      {t('common.name')}
                    </label>
                    <input
                      id="designer-name"
                      name="name"
                      className={inputCls}
                      placeholder={t('authV2.placeholders.name')}
                      required
                      value={bloggerFormData.name}
                      onChange={handleBloggerFormChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="designer-email" className={labelCls}>
                      {t('auth.email')}
                    </label>
                    <input
                      id="designer-email"
                      name="email"
                      type="email"
                      className={inputCls}
                      placeholder="you@example.com"
                      required
                      value={bloggerFormData.email}
                      onChange={handleBloggerFormChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="designer-password" className={labelCls}>
                      {t('common.password')}
                    </label>
                    <div className="relative mt-1">
                      <input
                        id="designer-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        className={`${inputCls} pr-10`}
                        placeholder={t('authV2.placeholders.passwordMin')}
                        required
                        value={bloggerFormData.password}
                        onChange={handleBloggerFormChange}
                        onBlur={() => setBloggerPasswordTouched(true)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-foreground"
                        aria-label={t('authV2.togglePassword')}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {bloggerPasswordTouched && (() => {
                      const v = validatePassword(bloggerFormData.password, t);
                      return v.valid ? null : <p className="mt-1 text-sm text-red-600">{v.message}</p>;
                    })()}
                  </div>

                  <div>
                    <label htmlFor="designer-bio" className={labelCls}>
                      {t('auth.bio')} ({t('common.optional')})
                    </label>
                    <textarea
                      id="designer-bio"
                      name="bio"
                      rows={3}
                      className={`${inputCls} h-auto`}
                      value={bloggerFormData.bio}
                      onChange={handleBloggerFormChange}
                    />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="confirm-password" className={labelCls}>
                  {t('authV2.confirmPassword')}
                </label>
                <div className="relative mt-1">
                  <input
                    id="confirm-password"
                    type={showPassword2 ? 'text' : 'password'}
                    className={`${inputCls} pr-10`}
                    placeholder={t('authV2.placeholders.confirmPassword')}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword2((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-foreground"
                    aria-label={t('authV2.togglePassword')}
                  >
                    {showPassword2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                className="h-11 w-full bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                type="submit"
                disabled={isSignupLoading || (currentPasswordValue.length > 0 && confirmPassword.length > 0 && currentPasswordValue !== confirmPassword)}
              >
                {isSignupLoading ? t('common.loading') : t('auth.createAccount')}
              </button>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-2 text-secondary-alpha">{t('authV2.or')}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleGoogleSignIn(userType)}
              className="mt-4 w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
            >
              {t('auth.loginWithGoogle')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

