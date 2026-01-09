import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import api from '../services/api';
import { CompanyAnswers } from '../types';

const CompanyQAPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [answers, setAnswers] = useState<CompanyAnswers['answers']>({
    product: {},
    market: {},
    customer: {},
    problem: {},
    solution: {},
    distribution: {},
    pricing: {},
    traction: {},
    constraints: {},
  });

  useEffect(() => {
    const fetchAnswers = async () => {
      if (!user?.company?.id) {
        setError('Компания не найдена');
        setLoading(false);
        return;
      }

      try {
        const companyAnswers = await api.getCompanyAnswers(user.company.id);
        if (companyAnswers.answers) {
          setAnswers(companyAnswers.answers);
        }
      } catch (err: any) {
        // If 404, answers don't exist yet, which is fine
        if (err.response?.status !== 404) {
          console.error('Failed to fetch answers:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnswers();
  }, [user]);

  const handleChange = (section: keyof typeof answers, field: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleArrayChange = (section: keyof typeof answers, field: string, value: string) => {
    const currentArray = (answers[section] as any)?.[field] || [];
    const newArray = value.split(',').map(item => item.trim()).filter(item => item);
    handleChange(section, field, newArray);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.company?.id) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await api.updateCompanyAnswers(user.company.id, { answers });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError('Не удалось сохранить ответы. Попробуйте снова.');
      console.error('Failed to save answers:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="large" />
      </div>
    );
  }

  if (!user?.company?.id) {
    return (
      <div className="text-center text-red-500 p-8">
        Компания не найдена. Пожалуйста, войдите в систему.
      </div>
    );
  }

  return (
    <div className="h-full w-full p-4 md:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Вопросы и ответы</h1>
        <Button onClick={() => navigate('/gtm/strategy')} variant="secondary">
          Перейти к генерации стратегии
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          Ответы успешно сохранены!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Product Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Продукт</h2>
          <div className="space-y-4">
            <Input
              id="product-name"
              label="Название продукта"
              value={answers.product?.name || ''}
              onChange={(e) => handleChange('product', 'name', e.target.value)}
            />
            <Input
              id="product-description"
              label="Описание продукта"
              multiline
              rows={3}
              value={answers.product?.description || ''}
              onChange={(e) => handleChange('product', 'description', e.target.value)}
            />
            <Input
              id="product-category"
              label="Категория (необязательно)"
              value={answers.product?.category || ''}
              onChange={(e) => handleChange('product', 'category', e.target.value)}
            />
            <Input
              id="product-stage"
              label="Стадия продукта (необязательно)"
              value={answers.product?.stage || ''}
              onChange={(e) => handleChange('product', 'stage', e.target.value)}
            />
          </div>
        </Card>

        {/* Market Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Рынок</h2>
          <div className="space-y-4">
            <Input
              id="market-target"
              label="Целевой рынок"
              value={answers.market?.target_market || ''}
              onChange={(e) => handleChange('market', 'target_market', e.target.value)}
            />
            <Input
              id="market-geography"
              label="География (необязательно)"
              value={answers.market?.geography || ''}
              onChange={(e) => handleChange('market', 'geography', e.target.value)}
            />
            <Input
              id="market-alternatives"
              label="Альтернативы (через запятую, необязательно)"
              value={answers.market?.alternatives?.join(', ') || ''}
              onChange={(e) => handleArrayChange('market', 'alternatives', e.target.value)}
            />
          </div>
        </Card>

        {/* Customer Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Клиент</h2>
          <div className="space-y-4">
            <Input
              id="customer-role"
              label="Роль клиента"
              value={answers.customer?.role || ''}
              onChange={(e) => handleChange('customer', 'role', e.target.value)}
            />
            <Input
              id="customer-company-stage"
              label="Стадия компании клиента (необязательно)"
              value={answers.customer?.company_stage || ''}
              onChange={(e) => handleChange('customer', 'company_stage', e.target.value)}
            />
            <Input
              id="customer-team-size"
              label="Размер команды (необязательно)"
              value={answers.customer?.team_size || ''}
              onChange={(e) => handleChange('customer', 'team_size', e.target.value)}
            />
          </div>
        </Card>

        {/* Problem Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Проблема</h2>
          <div className="space-y-4">
            <Input
              id="problem-main-pain"
              label="Основная боль"
              multiline
              rows={3}
              value={answers.problem?.main_pain || ''}
              onChange={(e) => handleChange('problem', 'main_pain', e.target.value)}
            />
            <Input
              id="problem-frequency"
              label="Частота проблемы (необязательно)"
              value={answers.problem?.frequency || ''}
              onChange={(e) => handleChange('problem', 'frequency', e.target.value)}
            />
            <Input
              id="problem-current-solution"
              label="Текущее решение (необязательно)"
              multiline
              rows={2}
              value={answers.problem?.current_solution || ''}
              onChange={(e) => handleChange('problem', 'current_solution', e.target.value)}
            />
          </div>
        </Card>

        {/* Solution Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Решение</h2>
          <div className="space-y-4">
            <Input
              id="solution-core-value"
              label="Основная ценность (необязательно)"
              multiline
              rows={3}
              value={answers.solution?.core_value || ''}
              onChange={(e) => handleChange('solution', 'core_value', e.target.value)}
            />
            <Input
              id="solution-differentiator"
              label="Отличительная особенность (необязательно)"
              multiline
              rows={2}
              value={answers.solution?.differentiator || ''}
              onChange={(e) => handleChange('solution', 'differentiator', e.target.value)}
            />
          </div>
        </Card>

        {/* Distribution Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Распределение</h2>
          <div className="space-y-4">
            <Input
              id="distribution-channels"
              label="Известные каналы (через запятую, необязательно)"
              value={answers.distribution?.known_channels?.join(', ') || ''}
              onChange={(e) => handleArrayChange('distribution', 'known_channels', e.target.value)}
            />
            <Input
              id="distribution-preferred"
              label="Предпочтительный канал (необязательно)"
              value={answers.distribution?.preferred_channel || ''}
              onChange={(e) => handleChange('distribution', 'preferred_channel', e.target.value)}
            />
          </div>
        </Card>

        {/* Pricing Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Ценообразование</h2>
          <div className="space-y-4">
            <Input
              id="pricing-model"
              label="Модель ценообразования (необязательно)"
              value={answers.pricing?.model || ''}
              onChange={(e) => handleChange('pricing', 'model', e.target.value)}
            />
            <Input
              id="pricing-expected"
              label="Ожидаемая цена (необязательно)"
              type="number"
              value={answers.pricing?.expected_price || ''}
              onChange={(e) => handleChange('pricing', 'expected_price', e.target.value ? Number(e.target.value) : '')}
            />
          </div>
        </Card>

        {/* Traction Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Тракция</h2>
          <div className="space-y-4">
            <Input
              id="traction-users"
              label="Количество пользователей (необязательно)"
              type="number"
              value={answers.traction?.users || ''}
              onChange={(e) => handleChange('traction', 'users', e.target.value ? Number(e.target.value) : undefined)}
            />
            <Input
              id="traction-revenue"
              label="Выручка (необязательно)"
              type="number"
              value={answers.traction?.revenue || ''}
              onChange={(e) => handleChange('traction', 'revenue', e.target.value ? Number(e.target.value) : undefined)}
            />
            <Input
              id="traction-signals"
              label="Сигналы (необязательно)"
              multiline
              rows={2}
              value={answers.traction?.signals || ''}
              onChange={(e) => handleChange('traction', 'signals', e.target.value)}
            />
          </div>
        </Card>

        {/* Constraints Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Ограничения</h2>
          <div className="space-y-4">
            <Input
              id="constraints-budget"
              label="Бюджет (необязательно)"
              value={answers.constraints?.budget || ''}
              onChange={(e) => handleChange('constraints', 'budget', e.target.value)}
            />
            <Input
              id="constraints-time"
              label="Время (необязательно)"
              value={answers.constraints?.time || ''}
              onChange={(e) => handleChange('constraints', 'time', e.target.value)}
            />
            <Input
              id="constraints-team"
              label="Команда (необязательно)"
              value={answers.constraints?.team || ''}
              onChange={(e) => handleChange('constraints', 'team', e.target.value)}
            />
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="submit" isLoading={saving}>
            Сохранить ответы
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CompanyQAPage;
