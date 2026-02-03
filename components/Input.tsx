import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'multiline'> {
  label?: string;
  id: string;
  multiline?: boolean;
  rows?: number;
  error?: string;
}

const inputBaseClasses =
  'appearance-none block w-full px-3 py-2 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary sm:text-sm text-gray-900 ';
const inputDefaultBorder = 'border border-gray-300 focus:border-primary';
const inputErrorBorder = 'border-2 border-red-500 focus:border-red-500 focus:ring-red-500';

const Input: React.FC<InputProps> = ({ label, id, multiline = false, rows = 3, error, className, ...props }) => {
  const hasError = Boolean(error);
  const borderClass = hasError ? inputErrorBorder : inputDefaultBorder;
  const disabledClass = props.disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : '';

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
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
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;
