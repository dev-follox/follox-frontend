import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import Button from './Button';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'ru' ? 'en' : 'ru');
  };

  return (
    <Button
      onClick={toggleLanguage}
      variant="secondary"
      size="sm"
      aria-label="Switch language"
    >
      {language === 'ru' ? 'EN' : 'RU'}
    </Button>
  );
};

export default LanguageSwitcher;
