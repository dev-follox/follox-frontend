import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import api from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';

const BloggerTelegramPage: React.FC = () => {
  const { t } = useTranslation();
  const [telegramChatId, setTelegramChatId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramChatId.trim()) {
      setError(t('telegram.chatIdRequired'));
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      await api.linkBloggerTelegram(telegramChatId.trim());
      setMessage(t('telegram.linkedMessage'));
    } catch {
      setError(t('telegram.linkError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">{t('telegram.linkTitle')}</h1>
      <div className="mb-4 text-sm text-gray-600">
        <p className="mb-2">{t('telegram.instructions')}</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>{t('telegram.step1')}</li>
          <li>{t('telegram.step2')}</li>
          <li>{t('telegram.step3')}</li>
        </ol>
      </div>

      <form onSubmit={handleLink} className="space-y-4">
        <Input
          id="blogger-telegram-chat-id"
          label={t('telegram.chatId')}
          value={telegramChatId}
          onChange={(e) => setTelegramChatId(e.target.value)}
          placeholder={t('telegram.chatIdPlaceholder')}
          required
        />
        <Button type="submit" isLoading={isSubmitting}>
          {t('header.linkTelegram')}
        </Button>
      </form>

      {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default BloggerTelegramPage;
