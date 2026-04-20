import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'multiline'> {
  label?: string;
  id: string;
  multiline?: boolean;
  rows?: number;
  error?: string;
}

const inputBaseClasses =
  'appearance-none block w-full px-3 py-2 bg-card text-foreground placeholder:text-secondary-alpha focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm';
const inputDefaultBorder = 'border border-border focus:border-primary';
const inputErrorBorder = 'border-2 border-red-500 focus:border-red-500 focus:ring-red-500';

const Input: React.FC<InputProps> = ({ label, id, multiline = false, rows = 3, error, className, ...props }) => {
  const hasError = Boolean(error);
  const borderClass = hasError ? inputErrorBorder : inputDefaultBorder;
  const disabledClass = props.disabled ? 'cursor-not-allowed opacity-60' : '';

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-foreground/90 mb-1">
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          id={id}
          rows={rows}
          className={`${inputBaseClasses} ${borderClass} ${disabledClass} ${className ?? ''}`}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={id}
          className={`${inputBaseClasses} ${borderClass} ${disabledClass} ${className ?? ''}`}
          {...props}
        />
      )}
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
};

export default Input;
