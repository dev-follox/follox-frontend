import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import api from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';

const CompanyTelegramPage: React.FC = () => {
  const { user, setCompanyData } = useAuth();
  const { t } = useTranslation();
  const companyId = user?.company?.id;

  const [telegramChatId, setTelegramChatId] = useState('');
  const [setupUrl, setSetupUrl] = useState<string | null>(null);
  const [isLoadingSetup, setIsLoadingSetup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    const current = user?.company?.telegram_chat_id;
    if (current) setTelegramChatId(current);

    const loadSetup = async () => {
      setIsLoadingSetup(true);
      try {
        const setup = await api.getTelegramSetup(companyId);
        if (typeof setup?.bot_link === 'string') setSetupUrl(setup.bot_link);
        else if (typeof setup?.bot_url === 'string') setSetupUrl(setup.bot_url);
      } catch {
        // Setup link is optional, keep page usable.
      } finally {
        setIsLoadingSetup(false);
      }
    };

    void loadSetup();
  }, [companyId, user?.company?.telegram_chat_id]);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    if (!telegramChatId.trim()) {
      setError(t('telegram.chatIdRequired'));
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await api.linkTelegram(companyId, telegramChatId.trim());
      setCompanyData(updated);
      setMessage(t('telegram.linkedMessage'));
    } catch {
      setError(t('telegram.linkError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!companyId) {
    return <div className="text-center text-red-500 p-8">{t('qa.companyNotFound')}</div>;
  }

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
        {setupUrl && (
          <a className="inline-block mt-3 text-primary-text underline" href={setupUrl} target="_blank" rel="noreferrer">
            {setupUrl}
          </a>
        )}
        {!setupUrl && isLoadingSetup && <p className="mt-2 text-xs text-gray-500">{t('common.loading')}</p>}
      </div>

      <form onSubmit={handleLink} className="space-y-4">
        <Input
          id="telegram-chat-id"
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

export default CompanyTelegramPage;
