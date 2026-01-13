
import React from 'react';
import Spinner from './Spinner';

// FIX: Add 'size' prop to allow for different button sizes.
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  isLoading?: boolean;
  size?: 'sm' | 'md';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  size = 'md',
  ...props
}) => {
  // FIX: Remove size-specific styles from baseStyles to be handled by the size prop.
  const baseStyles = 'inline-flex items-center justify-center border border-transparent font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'text-danger bg-primary hover:bg-primary-600 focus:ring-primary',
    secondary: 'text-danger bg-secondary hover:bg-secondary-600 focus:ring-secondary',
    danger: 'text-white bg-danger hover:bg-danger-600 focus:ring-danger',
    success: 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-500',
  };

  // FIX: Define styles for different button sizes.
  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Spinner size="small" /> : children}
    </button>
  );
};

export default Button;
