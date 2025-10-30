import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import api from '../services/api';

const ShopRegistrationPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
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
      await api.register(formData);
      // Redirect to login page after successful registration
      navigate('/shop/login');
    } catch (err) {
      setError('Не удалось зарегистрироваться. Проверьте данные и попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Создайте аккаунт магазина
          </h2>
        </div>
        <Card className="p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            
            <Input
              id="name"
              name="name"
              label="Название магазина"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
            />

            <Input
              id="email"
              name="email"
              label="Электронная почта"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
            />

            <Input
              id="password"
              name="password"
              label="Пароль"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
            />

            <Input
              id="description"
              name="description"
              label="Описание (необязательно)"
              multiline
              rows={3}
              value={formData.description}
              onChange={handleChange}
            />

            <div>
              <Button type="submit" isLoading={isLoading} className="w-full">
                Создать аккаунт
              </Button>
            </div>

            <div className="text-center">
              <Link
                to="/shop/login"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Уже есть аккаунт? Войти
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ShopRegistrationPage;
