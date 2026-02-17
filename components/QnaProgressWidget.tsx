import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import type { CompanyAnswers } from '../types';

const QNA_FIELD_KEYS: (keyof CompanyAnswers['answers'])[] = [
  'name',
  'product',
  'client',
  'problem',
  'value_proposition',
  'competitive_advantage',
  'business_model',
];

function getQnaFilledPercent(answers: CompanyAnswers['answers']): number {
  let filled = 0;
  for (const key of QNA_FIELD_KEYS) {
    const value = answers[key];
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && value.trim().length > 0) filled++;
  }
  return QNA_FIELD_KEYS.length === 0 ? 0 : Math.round((filled / QNA_FIELD_KEYS.length) * 100);
}

interface QnaProgressWidgetProps {
  className?: string;
}

const QnaProgressWidget: React.FC<QnaProgressWidgetProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [qnaPercent, setQnaPercent] = useState<number | null>(null);

  const fetchQnaPercent = useCallback(() => {
    if (user?.role !== 'COMPANY' || !user?.company?.id) return;
    api.getCompanyAnswers(user.company.id).then((data) => {
      if (data?.answers) setQnaPercent(getQnaFilledPercent(data.answers));
    }).catch(() => setQnaPercent(null));
  }, [user?.role, user?.company?.id]);

  useEffect(() => {
    if (user?.role !== 'COMPANY' || !user?.company?.id) {
      setQnaPercent(null);
      return;
    }
    let cancelled = false;
    api.getCompanyAnswers(user.company.id).then((data) => {
      if (!cancelled && data?.answers) setQnaPercent(getQnaFilledPercent(data.answers));
    }).catch(() => {
      if (!cancelled) setQnaPercent(null);
    });
    return () => { cancelled = true; };
  }, [user?.role, user?.company?.id]);

  useEffect(() => {
    const onAnswersUpdated = () => fetchQnaPercent();
    window.addEventListener('company-answers-updated', onAnswersUpdated);
    return () => window.removeEventListener('company-answers-updated', onAnswersUpdated);
  }, [fetchQnaPercent]);

  if (user?.role !== 'COMPANY' || qnaPercent === null) return null;

  return (
    <div className={className}>
      <div className="rounded-lg bg-gray-50 p-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-xs font-medium text-gray-600">{t('sidebar.qnaProgress')}</span>
          <span className="text-xs font-semibold text-gray-800 tabular-nums">{qnaPercent}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${qnaPercent}%` }}
            role="progressbar"
            aria-valuenow={qnaPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('sidebar.qnaProgress')}
          />
        </div>
      </div>
    </div>
  );
};

export default QnaProgressWidget;
