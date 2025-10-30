
import React, { useEffect, useState, FormEvent } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Product, AffiliateLink } from '../types';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Spinner from '../components/Spinner';

const ProductLandingPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [affiliateLink, setAffiliateLink] = useState<AffiliateLink | null>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    if (!code) {
      setError('Отсутствует код партнёрской ссылки.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Get affiliate link details
        const linkResponse = await api.getAffiliateLink(code);
        setAffiliateLink(linkResponse);
        
        // Get product details (visit will be tracked through the affiliate link)
        const productResponse = await api.getProduct(
          linkResponse.product_id,
          linkResponse.blogger_id
        );
        setProduct(productResponse);
      } catch (err) {
        setError('Не удалось загрузить данные товара.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [code]);

  const handleOrderSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!affiliateLink || !phoneNumber || quantity < 1) {
      alert('Пожалуйста, заполните поля корректно.');
      return;
    }
    setIsOrdering(true);
    try {
      await api.createOrder({
        product_id: affiliateLink.product_id,
        blogger_id: affiliateLink.blogger_id,
        client_phone: phoneNumber,
        quantity: quantity,
        price_per_item: product.price,
      });
      setOrderSuccess(true);
    } catch (err) {
      alert('Не удалось оформить заказ.');
    } finally {
      setIsOrdering(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="large" /></div>;
  }

  if (error) {
    return <div className="text-center text-red-500 text-xl">{error}</div>;
  }

  if (!product) {
    return <div className="text-center text-gray-500 text-xl">Товар не найден.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="grid md:grid-cols-2 gap-8">
        <div className="relative h-full min-h-[300px] bg-gray-100 rounded-lg overflow-hidden">
          {product.image_url ? (
            <img
              src={api.getImageUrl(product.image_url)}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        <div className="p-8 flex flex-col justify-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
          <p className="text-gray-600 mb-4">{product.description}</p>
          <p className="text-4xl font-extrabold text-indigo-600 mb-6">₸{product.price.toFixed(2)}</p>
          
          {orderSuccess ? (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md" role="alert">
              <p className="font-bold">Заказ оформлен!</p>
              <p>Спасибо! Ваш заказ принят и скоро будет обработан.</p>
            </div>
          ) : (
            <form onSubmit={handleOrderSubmit} className="space-y-4">
              <Input
                id="phone"
                label="Номер телефона"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="например, 8 777 123 4567"
                required
              />
              <Input
                id="quantity"
                label="Количество"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                required
              />
              <Button type="submit" isLoading={isOrdering} className="w-full">
                Оформить заказ
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProductLandingPage;
