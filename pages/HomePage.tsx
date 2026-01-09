import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';

const HomePage: React.FC = () => {
  return (
    <div className="auth-landing-container">
      <div className="max-w-4xl w-full">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Добро пожаловать в Follox</h1>
          <p className="text-lg text-gray-600">Выберите модуль для работы</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-8 flex flex-col hover:shadow-xl transition-shadow">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Affiliate Sales & Analytics</h2>
              <p className="text-gray-600">
                Управляйте продажами через партнёрскую программу. Добавляйте товары, отслеживайте аналитику, 
                управляйте заказами, работайте с блогерами и создавайте партнёрские ссылки.
              </p>
            </div>
            <div className="mt-auto pt-4">
              <Link to="/login">
                <Button className="w-full">Перейти к модулю</Button>
              </Link>
            </div>
          </Card>

          <Card className="p-8 flex flex-col hover:shadow-xl transition-shadow">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">GTM Strategy Generator</h2>
              <p className="text-gray-600">
                Генерируйте стратегии выхода на рынок, валидируйте гипотезы и создавайте прогнозы. 
                Ответьте на вопросы о вашем продукте и получите персонализированные рекомендации.
              </p>
            </div>
            <div className="mt-auto pt-4">
              <Link to="/login">
                <Button className="w-full">Перейти к модулю</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
