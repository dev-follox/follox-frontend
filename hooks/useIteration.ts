import { useContext } from 'react';
import { IterationContext } from '../contexts/IterationContext';

export const useIteration = () => {
  const ctx = useContext(IterationContext);
  if (!ctx) {
    throw new Error('useIteration must be used within an IterationProvider');
  }
  return ctx;
};

