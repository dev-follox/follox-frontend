import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { BloggerProductDetailed } from '../types';
import Card from '../components/Card';
import Spinner from '../components/Spinner';

const BloggerProductsDetailedPage: React.FC = () => {
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
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-gray-900">Ваши товары</h1>
      {items.length === 0 ? (
        <p className="text-center text-gray-500">Пока нет товаров с партнёрскими ссылками.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((p) => (
            <Card key={p.id} className="h-full flex flex-col">
              {p.image_url && (
                <div className="h-48 w-full">
                  <img src={api.getImageUrl(p.image_url)} alt={p.name} className="h-full w-full object-cover rounded-t-lg" />
                </div>
              )}
              <div className="p-6 flex-grow flex flex-col">
                <h2 className="text-lg font-semibold text-gray-800">{p.name}</h2>
                <p className="text-gray-600 mt-2">{p.description}</p>
                {p.blogger_task_description && (
                  <div className="mt-3 p-3 bg-blue-50 text-blue-800 rounded">
                    <div className="text-sm font-semibold">Задача от магазина</div>
                    <div className="text-sm">{p.blogger_task_description}</div>
                  </div>
                )}
                <div className="mt-4 text-sm">
                  <span className="font-medium">Партнёрская ссылка: </span>
                  <a className="text-indigo-600 underline break-all" href={`${window.location.origin}/#/products/${p.affiliate_code}`} target="_blank" rel="noopener noreferrer">
                    {`${window.location.origin}/#/products/${p.affiliate_code}`}
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
