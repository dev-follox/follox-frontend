import React, { useState, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Toggle from '../components/Toggle';
import api from '../services/api';

type AuthMode = 'signup' | 'login';
type UserType = 'shop' | 'blogger';

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [userType, setUserType] = useState<UserType>('shop');
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  
  const [shopFormData, setShopFormData] = useState({
    name: '',
    email: '',
    password: '',
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
  const navigate = useNavigate();
  
  if (isLoggedIn) {
    if (user?.role === 'SHOP') {
      navigate('/shop/dashboard', { replace: true });
    } else if (user?.role === 'BLOGGER') {
      navigate('/blogger/products', { replace: true });
    }
  }

  const handleGoogleSignIn = async (userType: 'shop' | 'blogger') => {
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
      setLoginError('Не удалось инициировать вход через Google. Попробуйте снова.');
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoginLoading(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err) {
      setLoginError('Не удалось войти. Проверьте почту и пароль.');
      setIsLoginLoading(false);
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setIsSignupLoading(true);

    try {
      if (userType === 'shop') {
        await api.register(shopFormData);
      } else {
        await api.createBlogger(bloggerFormData);
      }
      setMode('login');
      setLoginEmail(userType === 'shop' ? shopFormData.email : bloggerFormData.email);
    } catch (err) {
      setSignupError('Не удалось зарегистрироваться. Проверьте данные и попробуйте снова.');
    } finally {
      setIsSignupLoading(false);
    }
  };

  const handleShopFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShopFormData(prev => ({
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
    <div className="auth-landing-container">
      <div className="max-w-2xl w-full">
        <div className="mb-8 text-left">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Добро пожаловать в Follox</h1>
          <p className="text-center text-gray-600">{mode === 'signup' ? 'Выберите, как вы хотите продолжить' : 'Вход в систему'}</p>
        </div>
        
        <Card className="p-8 w-full">
          {mode === 'signup' ? (
            <>
              <Toggle
                options={[
                  { value: 'shop', label: 'Магазин' },
                  { value: 'blogger', label: 'Блогер' }
                ]}
                selected={userType}
                onChange={(value) => setUserType(value as UserType)}
              />
              
              <form className="mt-6 space-y-6" onSubmit={handleSignup}>
                {signupError && <p className="text-center text-sm text-red-600">{signupError}</p>}
                
                {userType === 'shop' ? (
                  <>
                    <Input
                      id="shop-name"
                      name="name"
                      label="Название магазина"
                      type="text"
                      required
                      value={shopFormData.name}
                      onChange={handleShopFormChange}
                    />
                    <Input
                      id="shop-email"
                      name="email"
                      label="Электронная почта"
                      type="email"
                      autoComplete="email"
                      required
                      value={shopFormData.email}
                      onChange={handleShopFormChange}
                    />
                    <Input
                      id="shop-password"
                      name="password"
                      label="Пароль"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={shopFormData.password}
                      onChange={handleShopFormChange}
                    />
                    <Input
                      id="shop-description"
                      name="description"
                      label="Описание (необязательно)"
                      multiline
                      rows={3}
                      value={shopFormData.description}
                      onChange={handleShopFormChange}
                    />
                  </>
                ) : (
                  <>
                    <Input
                      id="blogger-name"
                      name="name"
                      label="Имя"
                      type="text"
                      required
                      value={bloggerFormData.name}
                      onChange={handleBloggerFormChange}
                    />
                    <Input
                      id="blogger-email"
                      name="email"
                      label="Электронная почта"
                      type="email"
                      autoComplete="email"
                      required
                      value={bloggerFormData.email}
                      onChange={handleBloggerFormChange}
                    />
                    <Input
                      id="blogger-password"
                      name="password"
                      label="Пароль"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={bloggerFormData.password}
                      onChange={handleBloggerFormChange}
                    />
                    <Input
                      id="blogger-bio"
                      name="bio"
                      label="О себе (необязательно)"
                      multiline
                      rows={3}
                      value={bloggerFormData.bio}
                      onChange={handleBloggerFormChange}
                    />
                  </>
                )}
                
                <Button type="submit" isLoading={isSignupLoading} className="w-full">
                  Создать аккаунт
                </Button>
              </form>
              
              <div className="mt-6">
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
                  className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Войти через Google
                </button>
              </div>
              
              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-medium text-primary-text hover:text-primary-text-600"
                >
                  Уже есть аккаунт? Войти
                </button>
              </div>
            </>
          ) : (
            <>
              <form className="space-y-6" onSubmit={handleLogin}>
                {loginError && <p className="text-center text-sm text-red-600">{loginError}</p>}
                
                <Input
                  id="login-email"
                  label="Электронная почта"
                  type="email"
                  autoComplete="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
                <Input
                  id="login-password"
                  label="Пароль"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                
                <Button type="submit" isLoading={isLoginLoading} className="w-full">
                  Войти
                </Button>
              </form>
              
              <div className="mt-6">
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
                  className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Войти через Google
                </button>
              </div>
              
              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="font-medium text-primary-text hover:text-primary-text-600"
                >
                  Нет аккаунта? Зарегистрируйтесь
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

