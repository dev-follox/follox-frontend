
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-white rounded-xl border border-[rgba(228,228,231,1)] overflow-hidden ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
