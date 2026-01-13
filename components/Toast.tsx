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
  duration = 5000 
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
    success: 'bg-green-50',
    error: 'bg-red-50',
    info: 'bg-blue-50',
  };

  return (
    <div
      className={`toast ${typeStyles[type]}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="toast__content">
        <p className="toast__message">{message}</p>
        {action && (
          <div className="toast__action">
            <Button
              onClick={action.onClick}
              variant="primary"
              size="sm"
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        className="toast__close"
        aria-label="Close"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};

export default Toast;
