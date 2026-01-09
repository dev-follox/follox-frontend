import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import api from '../services/api';

const ShopRegistrationPage: React.FC = () => {
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
      setError('Не удалось зарегистрироваться. Проверьте данные и попробуйте снова.');
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
    <div className="h-full w-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Button variant="secondary" size="sm" aria-label="Назад">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L8.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </Button>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Создайте аккаунт компании
          </h2>
          <span className="w-9" />
        </div>
        <Card className="p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            
            <Input
              id="full_name"
              name="full_name"
              label="Полное имя"
              type="text"
              required
              value={formData.full_name}
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
              id="phone_number"
              name="phone_number"
              label="Номер телефона (необязательно)"
              type="tel"
              value={formData.phone_number}
              onChange={handleChange}
            />

            <Input
              id="professional_profile_link"
              name="professional_profile_link"
              label="Ссылка на LinkedIn (необязательно)"
              type="url"
              value={formData.professional_profile_link}
              onChange={handleChange}
            />

            <Input
              id="company_name"
              name="company_name"
              label="Название компании"
              type="text"
              required
              value={formData.company_name}
              onChange={handleChange}
            />

            <div>
              <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-1">
                Стадия компании (необязательно)
              </label>
              <select
                id="stage"
                name="stage"
                value={formData.stage}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="">Выберите стадию</option>
                <option value="idea">Идея</option>
                <option value="pre-revenue">Pre-revenue</option>
                <option value="post-PMF">Post-PMF</option>
                <option value="scaling">Scaling</option>
              </select>
            </div>

            <Input
              id="description"
              name="description"
              label="Описание (необязательно)"
              multiline
              rows={3}
              value={formData.description}
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

            <div>
              <Button type="submit" isLoading={isLoading} className="w-full">
                Создать аккаунт
              </Button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="font-medium text-primary-text hover:text-primary-text-600"
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
