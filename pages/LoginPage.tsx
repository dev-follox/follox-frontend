
import React, { useState, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  
  if (isLoggedIn) {
      if (user?.role === 'COMPANY') {
        navigate('/shop/dashboard', { replace: true });
      } else if (user?.role === 'BLOGGER') {
        navigate('/blogger/products', { replace: true });
      }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      // Navigation is handled inside the auth context based on role
    } catch (err) {
      setError('Не удалось войти. Проверьте почту и пароль.');
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Вход в аккаунт
          </h2>
        </div>
        <Card className="p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            <Input
              id="email"
              label="Электронная почта"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              id="password"
              label="Пароль"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="text-center mt-4">
              <Link
                to="/"
                className="font-medium text-primary-text hover:text-primary-text-600"
              >
                Нет аккаунта? Зарегистрируйтесь
              </Link>
            </div>
            <div>
              <Button type="submit" isLoading={isLoading} className="w-full">
                Войти
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
