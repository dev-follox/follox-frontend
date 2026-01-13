import React, { useEffect, useState } from 'react';
import { Blogger, Product } from '../types';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Spinner from '../components/Spinner';
import Dialog from '../components/Dialog';
import { useTranslation } from '../hooks/useTranslation';

const BloggersPage: React.FC = () => {
  const { t } = useTranslation();
  const [bloggers, setBloggers] = useState<Blogger[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New blogger form
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [newBlogger, setNewBlogger] = useState({
    name: '',
    email: '',
    bio: '',
    password: '',
  });

  // Affiliate link creation
  const [selectedBlogger, setSelectedBlogger] = useState<Blogger | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [linkGenerated, setLinkGenerated] = useState(false);
  const [newLinkCode, setNewLinkCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [bloggersData, productsData] = await Promise.all([
          api.getBloggers(),
          api.getProducts()
        ]);
        setBloggers(bloggersData);
        setProducts(productsData);
      } catch (err) {
        setError(t('bloggers.loadError'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateBlogger = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const blogger = await api.createBlogger(newBlogger);
      setBloggers(prev => [...prev, blogger]);
      setNewBlogger({ name: '', email: '', bio: '', password: '' });
      setIsDialogOpen(false);
    } catch (err) {
      setError(t('bloggers.createError'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!selectedBlogger || !selectedProduct) return;
    setIsCreatingLink(true);
    try {
      const link = await api.createAffiliateLink({
        blogger_id: selectedBlogger.id,
        product_id: selectedProduct.id
      });
      setLinkGenerated(true);
      setNewLinkCode(link.code);
    } catch (err) {
      setError(t('bloggers.linkError'));
    } finally {
      setIsCreatingLink(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="large" /></div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="h-full w-full space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">{t('bloggers.title')}</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsDialogOpen(true)}>{t('bloggers.addBlogger')}</Button>
          <Button onClick={() => setIsLinkDialogOpen(true)} variant="secondary">{t('bloggers.createAffiliateLink')}</Button>
        </div>
      </div>

      {/* Create Blogger Dialog */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={t('bloggers.addNewBlogger')}
        onSubmit={handleCreateBlogger}
      >
        <Input
          id="name"
          label={t('common.name')}
          value={newBlogger.name}
          onChange={e => setNewBlogger(prev => ({ ...prev, name: e.target.value }))}
          required
        />
        <Input
          id="email"
          label={t('common.email')}
          type="email"
          value={newBlogger.email}
          onChange={e => setNewBlogger(prev => ({ ...prev, email: e.target.value }))}
          required
        />
        <Input
          id="password"
          label={t('common.password')}
          type="password"
          value={newBlogger.password}
          onChange={e => setNewBlogger(prev => ({ ...prev, password: e.target.value }))}
          required
        />
        <Input
          id="bio"
          label={t('auth.bio')}
          multiline
          rows={3}
          value={newBlogger.bio}
          onChange={e => setNewBlogger(prev => ({ ...prev, bio: e.target.value }))}
        />
      </Dialog>

      {/* Create Affiliate Link Dialog */}
      <Dialog
        isOpen={isLinkDialogOpen}
        onClose={() => {
          setIsLinkDialogOpen(false);
          setSelectedBlogger(null);
          setSelectedProduct(null);
          setLinkGenerated(false);
          setNewLinkCode(null);
        }}
        title={t('bloggers.createAffiliateLink')}
        onSubmit={handleGenerateLink}
        actions={linkGenerated
          ? [
              {
                label: t('common.close'),
                variant: 'secondary',
                onClick: () => {
                  setIsLinkDialogOpen(false);
                  setSelectedBlogger(null);
                  setSelectedProduct(null);
                  setLinkGenerated(false);
                  setNewLinkCode(null);
                },
              },
            ]
          : [
              { label: t('common.cancel'), variant: 'secondary', onClick: () => setIsLinkDialogOpen(false) },
              { label: t('bloggers.generate'), variant: 'primary', type: 'button', onClick: handleGenerateLink },
            ]}
      >
        <div className="space-y-4">
          <Select
            id="blogger"
            label={t('bloggers.selectBlogger')}
            value={selectedBlogger?.id?.toString() || ''}
            onChange={e => setSelectedBlogger(bloggers.find(b => b.id === Number(e.target.value)) || null)}
            options={bloggers.map(blogger => ({
              value: blogger.id.toString(),
              label: blogger.name
            }))}
          />
          <Select
            id="product"
            label={t('bloggers.selectProduct')}
            value={selectedProduct?.id?.toString() || ''}
            onChange={e => setSelectedProduct(products.find(p => p.id === Number(e.target.value)) || null)}
            options={products.map(product => ({
              value: product.id.toString(),
              label: product.name
            }))}
          />
          {linkGenerated && newLinkCode && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800 font-medium">{t('bloggers.linkCreated')}</p>
              <div className="mt-2 flex items-center gap-2">
                <p className="font-mono text-sm break-all flex-1">
                  {`${window.location.origin}/products/${newLinkCode}`}
                </p>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/products/${newLinkCode}`;
                      navigator.clipboard?.writeText(url).then(() => {
                        setCopied(true);
                        window.setTimeout(() => setCopied(false), 1500);
                      });
                    }}
                    className="inline-flex items-center justify-center p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
                    title={t('bloggers.copyLink')}
                    aria-label={t('bloggers.copyLink')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 4a3 3 0 013-3h4a3 3 0 013 3v4a3 3 0 01-3 3h-1v-2h1a1 1 0 001-1V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v1H8V4z" />
                      <path d="M4 7a3 3 0 00-3 3v6a3 3 0 003 3h6a3 3 0 003-3v-6a3 3 0 00-3-3H4zm0 2h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6a1 1 0 011-1z" />
                    </svg>
                  </button>
                  {copied && (
                    <div className="absolute -top-9 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow">
                      {t('bloggers.linkCopied')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Dialog>

      {/* Bloggers List */}
      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('bloggers.table.name')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('bloggers.table.email')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('bloggers.table.bio')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('bloggers.table.created')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bloggers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  {t('bloggers.noBloggers')}
                </td>
              </tr>
            ) : bloggers.map((blogger) => (
              <tr key={blogger.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{blogger.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{blogger.email}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {blogger.bio || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(blogger.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BloggersPage;
