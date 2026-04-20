import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import api from '../services/api';
import Input from './Input';
import Button from './Button';
import { useTranslation } from '../hooks/useTranslation';

interface ProductFormData {
  name: string;
  description: string;
  designerTaskDescription: string;
  price: string;
  image: File | null;
  imagePreview: string;
}

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSubmit: (data: {
    name: string;
    description?: string;
    designer_task_description?: string;
    price: number;
    image_url?: string;
  }) => void;
  isLoading?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
  isOpen,
  onClose,
  product,
  onSubmit,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    designerTaskDescription: '',
    price: '',
    image: null,
    imagePreview: '',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        designerTaskDescription: product.designer_task_description || '',
        price: product.price.toString(),
        image: null,
        imagePreview: product.image_url ? api.getImageUrl(product.image_url) : '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        designerTaskDescription: '',
        price: '',
        image: null,
        imagePreview: '',
      });
    }
  }, [product, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let imageUrl: string | undefined;
    if (formData.image) {
      try {
        const uploadResult = await api.uploadProductImage(formData.image);
        imageUrl = uploadResult.image_url;
      } catch {
        alert(t('productForm.uploadError'));
        return;
      }
    } else if (product?.image_url) {
      imageUrl = product.image_url;
    }

    onSubmit({
      name: formData.name,
      description: formData.description || undefined,
      designer_task_description: formData.designerTaskDescription || undefined,
      price: parseFloat(formData.price),
      image_url: imageUrl,
    });
  };

  if (!isOpen) return null;

  const title = product ? t('productForm.editProduct') : t('productForm.addProduct');

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      designerTaskDescription: '',
      price: '',
      image: null,
      imagePreview: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={handleClose} />

        <div className="inline-block align-bottom bg-card rounded-lg px-4 pt-5 pb-4 text-left overflow-y-auto border border-border transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 max-h-[calc(100vh-2rem)]">
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg font-bold leading-6 text-foreground mb-4">{title}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  id={product ? 'edit-name' : 'name'}
                  label={t('productForm.productName')}
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  id={product ? 'edit-description' : 'description'}
                  label={t('productForm.description')}
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                />
                <Input
                  id={product ? 'edit-designer_task_description' : 'designer_task_description'}
                  label={t('productForm.designerTask')}
                  multiline
                  rows={3}
                  value={formData.designerTaskDescription}
                  onChange={(e) => setFormData((prev) => ({ ...prev, designerTaskDescription: e.target.value }))}
                />
                <Input
                  id={product ? 'edit-price' : 'price'}
                  label={t('productForm.price')}
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                />
                <div>
                  <label className="block text-sm font-medium text-foreground/90 mb-1">{t('productForm.productImage')}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-secondary-alpha
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-background file:text-foreground
                      hover:file:bg-foreground/5"
                  />
                  {formData.imagePreview && (
                    <div className="mt-2">
                      <img
                        src={formData.imagePreview}
                        alt={t('productForm.imagePreview')}
                        className="h-32 w-32 object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-2">
                  <Button type="submit" isLoading={isLoading}>
                    {t('common.save')}
                  </Button>
                  <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
