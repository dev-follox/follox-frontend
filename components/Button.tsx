
import React from 'react';
import Spinner from './Spinner';

// FIX: Add 'size' prop to allow for different button sizes.
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  isLoading?: boolean;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  size = 'md',
  icon,
  ...props
}) => {
  // FIX: Remove size-specific styles from baseStyles to be handled by the size prop.
  const baseStyles =
    'inline-flex items-center justify-center gap-2 border font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    // Landing/Home styles
    primary: 'border-transparent bg-primary text-white hover:bg-primary/90',
    secondary: 'border border-border font-semibold text-foreground hover:border-primary/50',
    danger: 'border-transparent text-white bg-danger hover:bg-danger-600',
    success: 'border-transparent text-white bg-green-600 hover:bg-green-700',
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
      {isLoading ? <Spinner size="small" /> : icon ? <>{icon}{children}</> : children}
    </button>
  );
};

export default Button;
