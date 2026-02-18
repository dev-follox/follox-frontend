import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import Spinner from '../components/Spinner';
import { CompanyAnswers } from '../types';

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

interface Question {
  field: keyof CompanyAnswers['answers'];
  label: string;
  isRequired?: boolean;
  isMultiline?: boolean;
}

const QUESTIONS: Question[] = [
  { field: 'name', label: 'dashboard.chatbot.questions.product.name', isRequired: true },
  { field: 'product', label: 'dashboard.chatbot.questions.product.description', isRequired: true, isMultiline: true },
  { field: 'client', label: 'dashboard.chatbot.questions.customer.client', isRequired: true },
  { field: 'problem', label: 'dashboard.chatbot.questions.problem.mainPain', isRequired: true, isMultiline: true },
  { field: 'value_proposition', label: 'dashboard.chatbot.questions.solution.coreValue', isMultiline: true },
  { field: 'competitive_advantage', label: 'dashboard.chatbot.questions.solution.differentiator', isMultiline: true },
  { field: 'business_model', label: 'dashboard.chatbot.questions.pricing.model', isMultiline: true },
];

const TOOLS = [
  { id: 'hypothesisGenerator', path: '/tools/hypothesis-generator', nameKey: 'sidebar.hypothesisGenerator', descKey: 'landing.tools.hypothesisGenerator.para1' },
  { id: 'custdevTargetPlanner', path: '/tools/custdev-target-planner', nameKey: 'sidebar.custdevTargetPlanner', descKey: 'landing.tools.custdevTargetPlanner.para1' },
  { id: 'custdevInterviewDesigner', path: '/tools/custdev-interview-designer', nameKey: 'sidebar.custdevInterviewDesigner', descKey: 'landing.tools.custdevInterviewDesigner.para1' },
  { id: 'custdevInsightsAnalyzer', path: '/tools/custdev-insights-analyzer', nameKey: 'sidebar.custdevInsightsAnalyzer', descKey: 'landing.tools.custdevInsightsAnalyzer.para1' },
];

const makeId = (prefix: string) => `${prefix}-${Date.now()}`;

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [chatStarted, setChatStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [answers, setAnswers] = useState<CompanyAnswers['answers']>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const companyId = user?.company?.id;
  const getSessionKey = () => `dashboard_chat_${companyId || 'default'}`;

  // ─── Derived state ────────────────────────────────────────────────────────
  const isComplete = currentQuestionIndex >= QUESTIONS.length;
  const currentQuestion = isComplete ? null : QUESTIONS[currentQuestionIndex];
  const showInitialCentered = !chatStarted && messages.length === 0;

  // ─── Scroll to bottom on new messages ─────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Persist chat to sessionStorage ───────────────────────────────────────
  useEffect(() => {
    if (messages.length === 0 || !companyId) return;
    try {
      sessionStorage.setItem(
        getSessionKey(),
        JSON.stringify({
          messages: messages.map((m) => ({ ...m, timestamp: m.timestamp.toISOString() })),
          currentQuestionIndex,
          chatStarted,
        })
      );
    } catch (err) {
      console.error('Failed to save chat to session storage:', err);
    }
  }, [messages, currentQuestionIndex, chatStarted, companyId]);

  // ─── Load answers + session on mount ──────────────────────────────────────
  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const companyAnswers = await api.getCompanyAnswers(companyId);
        if (companyAnswers.answers) setAnswers(companyAnswers.answers);
      } catch (err: any) {
        if (err.response?.status !== 404) console.error('Failed to fetch answers:', err);
      }

      const saved = sessionStorage.getItem(getSessionKey());
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.messages)) {
            setMessages(
              parsed.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
            );
            setCurrentQuestionIndex(parsed.currentQuestionIndex ?? 0);
            setChatStarted(parsed.chatStarted ?? false);
          }
        } catch (err) {
          console.error('Failed to parse saved chat history:', err);
        }
      }

      setLoading(false);
    };

    load();
  }, [companyId]);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /** Append one or more messages to the chat. */
  const addMessages = useCallback((...newMessages: Message[]) => {
    setMessages((prev) => [...prev, ...newMessages]);
  }, []);

  /** Build a bot message object. */
  const botMessage = (content: string, idPrefix = 'bot'): Message => ({
    id: makeId(idPrefix),
    type: 'bot',
    content,
    timestamp: new Date(),
  });

  /** Build a user message object. */
  const userMessage = (content: string): Message => ({
    id: makeId('user'),
    type: 'user',
    content,
    timestamp: new Date(),
  });

  /**
   * Ask the question at `index`. If index is past the end, show completion.
   * This is the single source of truth for advancing the conversation.
   */
  const askQuestion = useCallback(
    (index: number) => {
      if (index >= QUESTIONS.length) {
        addMessages(botMessage(t('dashboard.chatbot.completion'), 'completion'));
        return;
      }

      const question = QUESTIONS[index];
      const optionalSuffix = question.isRequired ? '' : ` (${t('common.optional')})`;
      addMessages(botMessage(`${t(question.label)}${optionalSuffix}`, `question-${index}`));
      inputRef.current?.focus();
    },
    [addMessages, t]
  );

  // ─── Save answer to backend ────────────────────────────────────────────────
  const saveAnswer = useCallback(
    async (question: Question, value: string) => {
      if (!companyId) return;
      const updatedAnswers = { ...answers, [question.field]: value };
      setAnswers(updatedAnswers);
      setSaving(true);
      try {
        await api.updateCompanyAnswers(companyId, { answers: updatedAnswers });
        localStorage.setItem(`answers_last_updated_${companyId}`, new Date().toISOString());
      } catch (err) {
        console.error('Failed to save answer:', err);
        showToast({ message: t('qa.saveError'), type: 'error', duration: 3000 });
      } finally {
        setSaving(false);
      }
    },
    [companyId, answers, showToast, t]
  );

  // ─── Start / restart chat ─────────────────────────────────────────────────
  const startChat = useCallback(() => {
    setChatStarted(true);
    setCurrentQuestionIndex(0);
    setInputValue('');
    addMessages(
      userMessage('Start'),
      botMessage(t('dashboard.chatbot.welcome'), 'welcome')
    );
    // Small delay so the welcome message renders before the first question
    setTimeout(() => askQuestion(0), 400);
  }, [addMessages, askQuestion, t]);

  // ─── Advance to the next question ─────────────────────────────────────────
  const advance = useCallback(
    (nextIndex: number) => {
      setCurrentQuestionIndex(nextIndex);
      setTimeout(() => askQuestion(nextIndex), 300);
    },
    [askQuestion]
  );

  // ─── Form submit (initial "Start" screen) ─────────────────────────────────
  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim().toLowerCase();
    if (trimmed === 'start') {
      startChat();
    } else if (trimmed) {
      showToast({ message: t('dashboard.chatbot.typeStartHint'), type: 'info', duration: 3000 });
    }
  };

  // ─── Main chat submit ──────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    const lower = trimmed.toLowerCase();

    // "Start" when complete → restart
    if (lower === 'start' && isComplete) {
      setMessages([]);
      startChat();
      return;
    }

    if (isComplete) return;

    // "Finish" → jump to completion
    if (lower === 'finish') {
      addMessages(userMessage('Finish'));
      setInputValue('');
      advance(QUESTIONS.length);
      return;
    }

    // "Skip" → move on without saving
    if (lower === 'skip') {
      if (currentQuestion?.isRequired) {
        showToast({ message: t('dashboard.chatbot.required'), type: 'error', duration: 3000 });
        return;
      }
      addMessages(userMessage('Skip'));
      setInputValue('');
      advance(currentQuestionIndex + 1);
      return;
    }

    // Empty + required → block
    if (!trimmed && currentQuestion?.isRequired) {
      showToast({ message: t('dashboard.chatbot.required'), type: 'error', duration: 3000 });
      return;
    }

    // Empty + optional → treat as skip
    if (!trimmed && !currentQuestion?.isRequired) {
      advance(currentQuestionIndex + 1);
      return;
    }

    // Normal answer
    addMessages(userMessage(trimmed));
    saveAnswer(currentQuestion!, trimmed);
    setInputValue('');
    advance(currentQuestionIndex + 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatStarted ? handleSubmit(e) : handleInitialSubmit(e);
    }
  };

  // ─── Click-to-skip / click-to-finish buttons ───────────────────────────────
  const handleSkipClick = () => {
    if (isComplete || !currentQuestion) return;
    if (currentQuestion.isRequired) {
      showToast({ message: t('dashboard.chatbot.required'), type: 'error', duration: 3000 });
      return;
    }
    addMessages(userMessage('Skip'));
    advance(currentQuestionIndex + 1);
  };

  const handleFinishClick = () => {
    if (isComplete) return;
    addMessages(userMessage('Finish'));
    setInputValue('');
    advance(QUESTIONS.length);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="large" />
      </div>
    );
  }

  if (!companyId) {
    return <div className="text-center text-red-500 p-8">{t('qa.companyNotFound')}</div>;
  }

  const submitDisabled = showInitialCentered
    ? saving || inputValue.trim().toLowerCase() !== 'start'
    : isComplete
    ? inputValue.trim().toLowerCase() !== 'start'
    : saving || (!inputValue.trim() && !!currentQuestion?.isRequired);

  return (
    <div className={`dashboard-chatbot ${showInitialCentered ? 'dashboard-chatbot--initial' : ''}`}>
      {/* Header */}
      {!showInitialCentered && (
        <div className="dashboard-chatbot__header">
          <h1 className="dashboard-chatbot__title">{t('dashboard.title')}</h1>
          {saving && <span className="dashboard-chatbot__saving">{t('common.saving')}...</span>}
        </div>
      )}

      {/* Initial centered state */}
      {showInitialCentered ? (
        <div className="dashboard-chatbot__initial-container">
          <div className="dashboard-chatbot__logo-section">
            <img src="/assets/logo.png" alt="Follox" className="dashboard-chatbot__logo-img" />
            <span className="dashboard-chatbot__logo-name">Follox</span>
          </div>
        </div>
      ) : (
        /* Chat messages */
        <div className="dashboard-chatbot__messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`dashboard-chatbot__message dashboard-chatbot__message--${message.type}`}
            >
              <div className="dashboard-chatbot__message-content">{message.content}</div>
              <div className="dashboard-chatbot__message-time">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}

          {/* Tools widget after completion */}
          {isComplete && (
            <div className="dashboard-chatbot__tools-widget">
              <h3 className="dashboard-chatbot__tools-title">{t('dashboard.chatbot.tools.title')}</h3>
              <div className="dashboard-chatbot__tools-grid">
                {TOOLS.map((tool) => (
                  <a
                    key={tool.id}
                    href={tool.path}
                    className="dashboard-chatbot__tool-card"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(tool.path);
                    }}
                  >
                    <h4 className="dashboard-chatbot__tool-name">{t(tool.nameKey)}</h4>
                    <p className="dashboard-chatbot__tool-desc">{t(tool.descKey)}</p>
                    <span className="dashboard-chatbot__tool-link">
                      {t('dashboard.chatbot.tools.openTool')} →
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input form */}
      <form
        className={`dashboard-chatbot__input-form ${showInitialCentered ? 'dashboard-chatbot__input-form--centered' : ''}`}
        onSubmit={showInitialCentered ? handleInitialSubmit : handleSubmit}
      >
        <div className={`dashboard-chatbot__input-wrapper ${showInitialCentered ? 'dashboard-chatbot__input-wrapper--centered' : ''}`}>
          <textarea
            ref={inputRef}
            className={`dashboard-chatbot__input ${showInitialCentered ? 'dashboard-chatbot__input--centered' : ''}`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              showInitialCentered || isComplete
                ? t('dashboard.chatbot.typeStartPlaceholder')
                : currentQuestion?.isMultiline
                ? t('dashboard.chatbot.multilinePlaceholder')
                : currentQuestion?.isRequired
                ? t('dashboard.chatbot.placeholder')
                : t('dashboard.chatbot.placeholderWithSkip')
            }
            rows={showInitialCentered ? 4 : currentQuestion?.isMultiline ? 3 : 1}
            disabled={isComplete && !showInitialCentered}
          />

          {/* "Start" hint in initial state */}
          {showInitialCentered && (
            <div className="dashboard-chatbot__hint-inside" onClick={startChat}>
              Start
            </div>
          )}

          {/* Skip / Finish action hints */}
          {!showInitialCentered && !isComplete && (
            <div className="dashboard-chatbot__hints-inside">
              {!currentQuestion?.isRequired && (
                <div className="dashboard-chatbot__hints-inside__hint" onClick={handleSkipClick}>
                  Skip
                </div>
              )}
              <div className="dashboard-chatbot__hints-inside__hint" onClick={handleFinishClick}>
                Finish
              </div>
            </div>
          )}

          <button type="submit" className="dashboard-chatbot__submit" disabled={submitDisabled}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        {/* Progress indicator */}
        {!showInitialCentered && !isComplete && currentQuestion && (
          <div className="dashboard-chatbot__progress">
            <span className="dashboard-chatbot__progress-text">
              {t('dashboard.chatbot.progress')
                .replace('{current}', String(currentQuestionIndex + 1))
                .replace('{total}', String(QUESTIONS.length))}
            </span>
          </div>
        )}
      </form>

      {/* Bottom callout on initial screen */}
      {showInitialCentered && (
        <div className="dashboard-chatbot__callout-bottom">
          <div className="dashboard-chatbot__callout">
            <div className="dashboard-chatbot__callout-icon">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="dashboard-chatbot__callout-content">
              <h3 className="dashboard-chatbot__callout-title">{t('dashboard.chatbot.callout.title')}</h3>
              <p className="dashboard-chatbot__callout-text">{t('dashboard.chatbot.callout.text')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;