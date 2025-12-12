import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { BloggerProductDetailed } from '../types';
import Card from '../components/Card';
import Spinner from '../components/Spinner';

const BloggerProductsDetailedPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<BloggerProductDetailed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await api.getProductsForMeDetailed();
        setItems(data);
      } catch (err) {
        setError('Не удалось загрузить товары.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="large" /></div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="h-full w-full p-4 md:p-8 space-y-8">
      <h1 className="text-xl font-bold text-gray-900">Ваши товары</h1>
      {items.length === 0 ? (
        <p className="text-center text-gray-500">Пока нет товаров с партнёрскими ссылками.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((p) => (
            <Card 
              key={p.id} 
              className="h-120 flex flex-col cursor-pointer hover:shadow-xl transition-shadow duration-300"
              onClick={() => navigate(`/blogger/products/${p.id}`)}
            >
              {p.image_url && (
                <div className="h-48 w-full flex-shrink-0">
                  <img src={api.getImageUrl(p.image_url)} alt={p.name} className="h-full w-full object-cover rounded-t-lg" />
                </div>
              )}
              <div className="p-6 flex-grow flex flex-col min-h-0">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">{p.name}</h2>
                {p.description && (
                  <p className="text-gray-600 text-sm flex-grow overflow-hidden">
                    <span className="line-clamp-2">{p.description}</span>
                  </p>
                )}
                {p.blogger_task_description && (
                  <div className="mt-3 p-3 bg-blue-50 text-blue-800 rounded flex-shrink-0 overflow-hidden">
                    <div className="text-sm font-semibold mb-1">Задача от магазина</div>
                    <div className="text-sm line-clamp-2">{p.blogger_task_description}</div>
                  </div>
                )}
                <div className="mt-4 text-sm flex-shrink-0">
                  <span className="font-medium">Партнёрская ссылка: </span>
                  <a 
                    className="text-primary-text underline break-all" 
                    href={`${window.location.origin}/products/${p.affiliate_code}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {`${window.location.origin}/products/${p.affiliate_code}`}
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BloggerProductsDetailedPage;
