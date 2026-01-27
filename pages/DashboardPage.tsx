import React, { useEffect, useState, useRef } from 'react';
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
  section: keyof CompanyAnswers['answers'];
  field: string;
  label: string;
  isRequired?: boolean;
  isMultiline?: boolean;
}

const SECTION_ORDER = [
  'product',
  'market',
  'customer',
  'problem',
  'solution',
  'distribution',
  'pricing',
  'traction',
  'constraints',
] as const;

const QUESTIONS: Question[] = [
  // Product section
  { section: 'product', field: 'name', label: 'dashboard.chatbot.questions.product.name', isRequired: true },
  { section: 'product', field: 'description', label: 'dashboard.chatbot.questions.product.description', isRequired: true, isMultiline: true },
  { section: 'product', field: 'category', label: 'dashboard.chatbot.questions.product.category' },
  { section: 'product', field: 'stage', label: 'dashboard.chatbot.questions.product.stage' },
  // Market section
  { section: 'market', field: 'target_market', label: 'dashboard.chatbot.questions.market.targetMarket', isRequired: true },
  { section: 'market', field: 'geography', label: 'dashboard.chatbot.questions.market.geography' },
  { section: 'market', field: 'alternatives', label: 'dashboard.chatbot.questions.market.alternatives' },
  // Customer section
  { section: 'customer', field: 'role', label: 'dashboard.chatbot.questions.customer.role', isRequired: true },
  { section: 'customer', field: 'company_stage', label: 'dashboard.chatbot.questions.customer.companyStage' },
  { section: 'customer', field: 'team_size', label: 'dashboard.chatbot.questions.customer.teamSize' },
  // Problem section
  { section: 'problem', field: 'main_pain', label: 'dashboard.chatbot.questions.problem.mainPain', isRequired: true, isMultiline: true },
  { section: 'problem', field: 'frequency', label: 'dashboard.chatbot.questions.problem.frequency' },
  { section: 'problem', field: 'current_solution', label: 'dashboard.chatbot.questions.problem.currentSolution', isMultiline: true },
  // Solution section
  { section: 'solution', field: 'core_value', label: 'dashboard.chatbot.questions.solution.coreValue', isMultiline: true },
  { section: 'solution', field: 'differentiator', label: 'dashboard.chatbot.questions.solution.differentiator', isMultiline: true },
  // Distribution section
  { section: 'distribution', field: 'known_channels', label: 'dashboard.chatbot.questions.distribution.knownChannels' },
  { section: 'distribution', field: 'preferred_channel', label: 'dashboard.chatbot.questions.distribution.preferredChannel' },
  // Pricing section
  { section: 'pricing', field: 'model', label: 'dashboard.chatbot.questions.pricing.model' },
  { section: 'pricing', field: 'expected_price', label: 'dashboard.chatbot.questions.pricing.expectedPrice' },
  // Traction section
  { section: 'traction', field: 'users', label: 'dashboard.chatbot.questions.traction.users' },
  { section: 'traction', field: 'revenue', label: 'dashboard.chatbot.questions.traction.revenue' },
  { section: 'traction', field: 'signals', label: 'dashboard.chatbot.questions.traction.signals', isMultiline: true },
  // Constraints section
  { section: 'constraints', field: 'budget', label: 'dashboard.chatbot.questions.constraints.budget' },
  { section: 'constraints', field: 'time', label: 'dashboard.chatbot.questions.constraints.time' },
  { section: 'constraints', field: 'team', label: 'dashboard.chatbot.questions.constraints.team' },
];

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
  const [answers, setAnswers] = useState<CompanyAnswers['answers']>({
    product: {},
    market: {},
    customer: {},
    problem: {},
    solution: {},
    distribution: {},
    pricing: {},
    traction: {},
    constraints: {},
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Session storage key for chat history
  const getSessionKey = () => `dashboard_chat_${user?.company?.id || 'default'}`;

  // Save messages to session storage
  useEffect(() => {
    if (messages.length > 0 && user?.company?.id) {
      try {
        const sessionData = {
          messages: messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp.toISOString(), // Convert Date to string for storage
          })),
          currentQuestionIndex,
          chatStarted,
        };
        sessionStorage.setItem(getSessionKey(), JSON.stringify(sessionData));
      } catch (err) {
        console.error('Failed to save chat to session storage:', err);
      }
    }
  }, [messages, currentQuestionIndex, chatStarted, user?.company?.id]);

  // Load chat history from session storage
  useEffect(() => {
    if (!user?.company?.id) {
      setLoading(false);
      return;
    }

    const loadChatHistory = async () => {
      try {
        // Load answers from API
        try {
          const companyAnswers = await api.getCompanyAnswers(user.company.id);
          if (companyAnswers.answers) {
            setAnswers(companyAnswers.answers);
          }
        } catch (err: any) {
          if (err.response?.status !== 404) {
            console.error('Failed to fetch answers:', err);
          }
        }

        // Load chat history from session storage
        const savedData = sessionStorage.getItem(getSessionKey());
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            if (parsed.messages && Array.isArray(parsed.messages)) {
              const restoredMessages: Message[] = parsed.messages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp), // Convert back to Date
              }));
              setMessages(restoredMessages);
              setCurrentQuestionIndex(parsed.currentQuestionIndex || 0);
              setChatStarted(parsed.chatStarted || false);
            }
          } catch (err) {
            console.error('Failed to parse saved chat history:', err);
          }
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setLoading(false);
      }
    };

    loadChatHistory();
  }, [user?.company?.id]);

  // Clear session storage on logout (handled by AuthContext, but we can also clear on unmount if needed)

  const startChat = (startInput: string) => {
    // Only start if not already started or if starting fresh
    if (!chatStarted) {
      setChatStarted(true);
      setCurrentQuestionIndex(0); // Always start from the beginning
      const startMessage: Message = {
        id: `start-${Date.now()}`,
        type: 'user',
        content: startInput,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, startMessage]);
      // Add welcome message
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'bot',
        content: t('dashboard.chatbot.welcome'),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, welcomeMessage]);
      
      // Start asking questions
      setTimeout(() => {
        askNextQuestion();
      }, 500);
    } else {
      // If chat already started, just continue from where we left off
      if (currentQuestionIndex < QUESTIONS.length) {
        askNextQuestion();
      }
    }
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatStarted) {
      const trimmedInput = inputValue.trim().toLowerCase();
      
      // Only start if user types "start"
      if (trimmedInput === 'start') {
        setInputValue('');
        startChat(inputValue);
      } else if (trimmedInput) {
        // Show hint if they type something else
        showToast({ 
          message: t('dashboard.chatbot.typeStartHint'), 
          type: 'info', 
          duration: 3000 
        });
      }
    }
  };

  const handleInitialKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInitialSubmit(e);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const askNextQuestion = () => {
    if (currentQuestionIndex >= QUESTIONS.length) {
      // All questions answered - show completion and tools widget
      const completionMessage: Message = {
        id: `completion-${Date.now()}`,
        type: 'bot',
        content: t('dashboard.chatbot.completion'),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, completionMessage]);
      return;
    }

    const question = QUESTIONS[currentQuestionIndex];
    const questionText = t(question.label);
    const optionalText = question.isRequired ? '' : ` (${t('common.optional')})`;
    
    const questionMessage: Message = {
      id: `question-${currentQuestionIndex}-${Date.now()}`,
      type: 'bot',
      content: `${questionText}${optionalText}`,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, questionMessage]);
    
    inputRef.current?.focus();
  };

  const saveAnswer = async (question: Question, value: string) => {
    if (!user?.company?.id) return;

    const section = answers[question.section] || {};
    let processedValue: any = value.trim();

    // Handle array fields (alternatives, known_channels)
    if (question.field === 'alternatives' || question.field === 'known_channels') {
      processedValue = value.split(',').map((item) => item.trim()).filter(Boolean);
    } else if (question.field === 'expected_price' || question.field === 'users' || question.field === 'revenue') {
      processedValue = value ? Number(value) : undefined;
    }

    const updatedAnswers = {
      ...answers,
      [question.section]: {
        ...section,
        [question.field]: processedValue,
      },
    };

    setAnswers(updatedAnswers);

    // Auto-save to backend
    setSaving(true);
    try {
      await api.updateCompanyAnswers(user.company.id, { answers: updatedAnswers });
      // Mark answers as updated - this will trigger tool regeneration
      const updateTimestamp = new Date().toISOString();
      localStorage.setItem(`answers_last_updated_${user.company.id}`, updateTimestamp);
    } catch (err) {
      console.error('Failed to save answer:', err);
      showToast({ message: t('qa.saveError'), type: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const value = inputValue.trim().toLowerCase();

    // Handle "Start" command - restart chat if completed
    if (value === 'start' && isComplete) {
      setInputValue('');
      setCurrentQuestionIndex(0);
      setChatStarted(true);
      const startMessage: Message = {
        id: `start-${Date.now()}`,
        type: 'user',
        content: 'Start',
        timestamp: new Date(),
      };
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'bot',
        content: t('dashboard.chatbot.welcome'),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, startMessage, welcomeMessage]);
      setTimeout(() => {
        askNextQuestion();
      }, 500);
      return;
    }
    
    if (currentQuestionIndex >= QUESTIONS.length) {
      return;
    }

    const question = QUESTIONS[currentQuestionIndex];

    // Handle "Skip" command
    if (value === 'skip') {
      const skipMessage: Message = {
        id: `user-skip-${Date.now()}`,
        type: 'user',
        content: 'Skip',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, skipMessage]);
      
      // Move to next question without saving
      setCurrentQuestionIndex((prev) => prev + 1);
      setInputValue('');

      // Ask next question after a short delay
      setTimeout(() => {
        askNextQuestion();
      }, 300);
      return;
    }

    if (value === 'finish') {
      const finishMessage: Message = {
        id: `user-finish-${Date.now()}`,
        type: 'user',
        content: 'Finish',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, finishMessage]);
      
      // Move to completion state - this will trigger isComplete to be true
      setCurrentQuestionIndex(QUESTIONS.length);
      setInputValue('');

      // Add completion message and tools widget will appear automatically
      setTimeout(() => {
        const completionMessage: Message = {
          id: `completion-${Date.now()}`,
          type: 'bot',
          content: t('dashboard.chatbot.completion'),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, completionMessage]);
        // Scroll to bottom to show tools widget
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }, 300);
      
      return;
    }

    // Skip if empty and not required
    if (!inputValue.trim() && !question.isRequired) {
      setCurrentQuestionIndex((prev) => prev + 1);
      askNextQuestion();
      setInputValue('');
      return;
    }

    // Validate required fields
    if (question.isRequired && !inputValue.trim()) {
      showToast({ message: t('dashboard.chatbot.required'), type: 'error', duration: 3000 });
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Save answer
    saveAnswer(question, inputValue.trim());

    // Move to next question
    setCurrentQuestionIndex((prev) => prev + 1);
    setInputValue('');

    // Ask next question after a short delay
    setTimeout(() => {
      askNextQuestion();
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="large" />
      </div>
    );
  }

  if (!user?.company?.id) {
    return (
      <div className="text-center text-red-500 p-8">
        {t('qa.companyNotFound')}
      </div>
    );
  }

  const currentQuestion = currentQuestionIndex < QUESTIONS.length ? QUESTIONS[currentQuestionIndex] : null;
  const isComplete = currentQuestionIndex >= QUESTIONS.length;
  const hasHistory = messages.length > 0;

  // Always show chat view if there's history, otherwise show initial centered state
  const showInitialCentered = !chatStarted && !hasHistory;

  return (
    <div className={`dashboard-chatbot ${showInitialCentered ? 'dashboard-chatbot--initial' : ''}`}>
      {!showInitialCentered && (
        <div className="dashboard-chatbot__header">
          <h1 className="dashboard-chatbot__title">{t('dashboard.title')}</h1>
          {saving && (
            <span className="dashboard-chatbot__saving">{t('common.saving')}...</span>
          )}
        </div>
      )}

      {showInitialCentered ? (
        // Initial centered state
        <div className="dashboard-chatbot__initial-container">
          {/* Logo and name at the top */}
          <div className="dashboard-chatbot__logo-section">
            <img src="/assets/logo.png" alt="Follox" className="dashboard-chatbot__logo-img" />
            <span className="dashboard-chatbot__logo-name">Follox</span>
          </div>
        </div>
      ) : (
        // Chat messages view
        <div className="dashboard-chatbot__messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`dashboard-chatbot__message dashboard-chatbot__message--${message.type}`}
            >
              <div className="dashboard-chatbot__message-content">
                {message.content}
              </div>
              <div className="dashboard-chatbot__message-time">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          
          {/* Tools Widget - Show after completion */}
          {isComplete && (
            <div className="dashboard-chatbot__tools-widget">
              <h3 className="dashboard-chatbot__tools-title">{t('dashboard.chatbot.tools.title')}</h3>
              <div className="dashboard-chatbot__tools-grid">
                {[
                  { id: 'icp', path: '/tools/icp-diagnostician', nameKey: 'sidebar.icpDiagnostician', descKey: 'landing.tools.icp.para1' },
                  { id: 'positioning', path: '/tools/positioning', nameKey: 'sidebar.positioning', descKey: 'landing.tools.positioning.para1' },
                  { id: 'channelRisk', path: '/tools/channel-risk', nameKey: 'sidebar.channelRisk', descKey: 'landing.tools.channelRisk.para1' },
                  { id: 'experiment', path: '/tools/experiment', nameKey: 'sidebar.experiment', descKey: 'landing.tools.experiment.para1' },
                  { id: 'decisionReview', path: '/tools/decision-review', nameKey: 'sidebar.decisionReview', descKey: 'landing.tools.decisionReview.para1' },
                ].map((tool) => (
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

      {/* Input form - always shown */}
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
            onKeyDown={showInitialCentered ? handleInitialKeyDown : handleKeyDown}
            placeholder={
              showInitialCentered
                ? t('dashboard.chatbot.typeStartPlaceholder')
                : isComplete
                ? t('dashboard.chatbot.typeStartPlaceholder')
                : currentQuestion?.isMultiline
                ? t('dashboard.chatbot.multilinePlaceholder')
                : currentQuestion?.isRequired
                ? t('dashboard.chatbot.placeholder')
                : t('dashboard.chatbot.placeholderWithSkip')
            }
            rows={showInitialCentered ? 4 : (currentQuestion?.isMultiline ? 3 : 1)}
            disabled={!showInitialCentered && isComplete && !chatStarted}
          />
          {showInitialCentered && (
            <div 
              className="dashboard-chatbot__hint-inside"
              onClick={() => {
                const startInput = 'Start';
                setInputValue('');
                startChat(startInput);
              }}
            >
              Start
            </div>
          )}
          {!showInitialCentered && !isComplete && (
            <div className="dashboard-chatbot__hints-inside">
              <div 
                className="dashboard-chatbot__hints-inside__hint"
                onClick={() => {
                  if (currentQuestion && !isComplete) {
                    const skipValue = 'Skip';
                    setInputValue('');
                    
                    // Add user message
                    const skipMessage: Message = {
                      id: `user-skip-${Date.now()}`,
                      type: 'user',
                      content: skipValue,
                      timestamp: new Date(),
                    };
                    setMessages((prev) => [...prev, skipMessage]);
                    
                    // Move to next question without saving
                    setCurrentQuestionIndex((prev) => prev + 1);

                    // Ask next question after a short delay
                    setTimeout(() => {
                      askNextQuestion();
                    }, 300);
                  }
                }}
              >
                Skip
              </div>
              <div 
                className="dashboard-chatbot__hints-inside__hint"
                onClick={() => {
                  if (!isComplete) {
                    const finishValue = 'Finish';
                    setInputValue('');
                    
                    // Add user message
                    const finishMessage: Message = {
                      id: `user-finish-${Date.now()}`,
                      type: 'user',
                      content: finishValue,
                      timestamp: new Date(),
                    };
                    setMessages((prev) => [...prev, finishMessage]);
                    
                    // Move to completion state
                    setCurrentQuestionIndex(QUESTIONS.length);

                    // Add completion message and tools widget will appear automatically
                    setTimeout(() => {
                      const completionMessage: Message = {
                        id: `completion-${Date.now()}`,
                        type: 'bot',
                        content: t('dashboard.chatbot.completion'),
                        timestamp: new Date(),
                      };
                      setMessages((prev) => [...prev, completionMessage]);
                      // Scroll to bottom to show tools widget
                      setTimeout(() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }, 300);
                  }
                }}
              >
                Finish
              </div>
            </div>
          )}
          <button
            type="submit"
            className="dashboard-chatbot__submit"
            disabled={
              showInitialCentered
                ? (saving || inputValue.trim().toLowerCase() !== 'start')
                : (isComplete && inputValue.trim().toLowerCase() !== 'start') || saving || (inputValue.trim() === '' && currentQuestion?.isRequired)
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
        {!showInitialCentered && !isComplete && currentQuestion && (
          <div className="dashboard-chatbot__progress">
            <span className="dashboard-chatbot__progress-text">
              {t('dashboard.chatbot.progress').replace('{current}', String(currentQuestionIndex + 1)).replace('{total}', String(QUESTIONS.length))}
            </span>
          </div>
        )}
      </form>
      
      {/* Callout at the bottom when centered */}
      {showInitialCentered && (
        <div className="dashboard-chatbot__callout-bottom">
          <div className="dashboard-chatbot__callout">
            <div className="dashboard-chatbot__callout-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="dashboard-chatbot__callout-content">
              <h3 className="dashboard-chatbot__callout-title">
                {t('dashboard.chatbot.callout.title')}
              </h3>
              <p className="dashboard-chatbot__callout-text">
                {t('dashboard.chatbot.callout.text')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
