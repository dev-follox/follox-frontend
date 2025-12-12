import React from 'react';
import { Link } from 'react-router-dom';

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="h-full w-full">
      {children}
    </div>
  );
};

export default PublicLayout;
