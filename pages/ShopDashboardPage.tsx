
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Product } from '../types';
import api from '../services/api';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import Button from '../components/Button';
import Input from '../components/Input';
import Dialog from '../components/Dialog';

const ShopDashboardPage: React.FC = () => {
  const { shop } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    image: null as File | null,
    imagePreview: '',
  });

  useEffect(() => {
    if (shop?.id) {
      const fetchProducts = async () => {
        try {
          setLoading(true);
          const data = await api.getProducts();
          setProducts(data);
        } catch (err) {
          setError('Не удалось загрузить товары.');
        } finally {
          setLoading(false);
        }
      };
      fetchProducts();
    }
  }, [shop]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="large" /></div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewProduct(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop?.id) return;

    setIsCreating(true);
    try {
      let imageUrl;
      if (newProduct.image) {
        const uploadResult = await api.uploadProductImage(newProduct.image);
        imageUrl = uploadResult.image_url;
      }

      const createdProduct = await api.createProduct({
        name: newProduct.name,
        description: newProduct.description || undefined,
        price: parseFloat(newProduct.price),
        shop_id: shop.id,
        image_url: imageUrl
      });
      setProducts(prev => [createdProduct, ...prev]);
      setNewProduct({ name: '', description: '', price: '', image: null, imagePreview: '' });
      setIsDialogOpen(false);
    } catch (err) {
      setError('Не удалось создать товар.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Ваши товары</h1>
        <Button onClick={() => setIsDialogOpen(true)}>Добавить товар</Button>
      </div>

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Добавить новый товар"
        onSubmit={handleCreateProduct}
      >
        <Input
          id="name"
          label="Название"
          type="text"
          required
          value={newProduct.name}
          onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
        />
        <Input
          id="description"
          label="Описание"
          multiline
          rows={3}
          value={newProduct.description}
          onChange={e => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
        />
          <Input
            id="price"
            label="Цена"
            type="number"
            step="0.01"
            required
            value={newProduct.price}
            onChange={e => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Изображение товара
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100"
            />
            {newProduct.imagePreview && (
              <div className="mt-2">
                <img
                  src={newProduct.imagePreview}
                  alt="Предпросмотр товара"
                  className="h-32 w-32 object-cover rounded-md"
                />
              </div>
            )}
          </div>
      </Dialog>

      {products.length === 0 ? (
        <p className="text-center text-gray-500">Вы еще не добавили ни одного товара.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <Link key={product.id} to={`/shop/products/${product.id}`}>
              <Card className="h-full flex flex-col hover:shadow-xl transition-shadow duration-300">
                <div className="flex flex-col h-full">
                  {product.image_url && (
                    <div className="h-48 w-full">
                      <img
                        src={api.getImageUrl(product.image_url)}
                        alt={product.name}
                        className="h-full w-full object-cover rounded-t-lg"
                      />
                    </div>
                  )}
                  <div className="p-6 flex-grow flex flex-col">
                    <h2 className="text-lg font-semibold text-gray-800">{product.name}</h2>
                    <p className="text-gray-600 mt-2 flex-grow">{product.description}</p>
                    <p className="mt-4 text-2xl font-bold text-indigo-600">₸{product.price.toFixed(2)}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopDashboardPage;
