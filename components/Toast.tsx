import React, { useEffect } from 'react';
import Button from './Button';

export interface ToastProps {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type = 'info',
  action,
  onClose,
  duration = 5000,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeStyles = {
    success: 'border-primary/50 bg-primary/15',
    error: 'border-danger/50 bg-danger/15',
    info: 'border-info/50 bg-info/15',
  };

  return (
    <div
      className={`toast border border-border bg-card text-foreground shadow-lg ${typeStyles[type]}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="toast__content">
        <p className="toast__message text-sm text-foreground">{message}</p>
        {action && (
          <div className="toast__action">
            <Button onClick={action.onClick} variant="primary" size="sm">
              {action.label}
            </Button>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="toast__close text-secondary-alpha hover:text-foreground"
        aria-label="Close"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default Toast;
