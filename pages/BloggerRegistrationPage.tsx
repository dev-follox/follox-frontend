import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import api from '../services/api';

const BloggerRegistrationPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    bio: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.createBlogger(formData);
      navigate('/login');
    } catch (err) {
      setError('Не удалось зарегистрироваться. Проверьте данные и попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement;
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
            Создайте аккаунт блогера
          </h2>
          <span className="w-9" />
        </div>
        <Card className="p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <p className="text-center text-sm text-red-600">{error}</p>}

            <Input
              id="name"
              name="name"
              label="Имя"
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
              id="bio"
              name="bio"
              label="О себе (необязательно)"
              multiline
              rows={3}
              value={formData.bio}
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

export default BloggerRegistrationPage;
