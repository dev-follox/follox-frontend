
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

const NotFoundPage: React.FC = () => {
  return (
    <div className="text-center">
      <h1 className="text-6xl font-extrabold text-indigo-600">404</h1>
      <p className="text-2xl font-semibold text-gray-800 mt-4">Страница не найдена</p>
      <p className="text-gray-600 mt-2">
        Извините, запрашиваемая страница не существует.
      </p>
      <div className="mt-6">
        <Link to="/">
          <Button>На главную</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
