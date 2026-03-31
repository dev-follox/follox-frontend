import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { Iteration, ToolOutput, ToolType } from '../types';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

interface IterationContextValue {
  iterations: Iteration[];
  currentIteration: Iteration | null;
  selectedOutputs: Partial<Record<ToolType, number>>;
  refreshIterations: () => Promise<void>;
  setCurrentIterationId: (id: number | null) => void;
  setSelectedOutput: (toolType: ToolType, outputId: number) => void;
  isLoading: boolean;
}

export const IterationContext = createContext<IterationContextValue | undefined>(undefined);

export const IterationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const companyId = user?.company?.id;

  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [currentIterationId, setCurrentIterationId] = useState<number | null>(null);
  const [selectedOutputs, setSelectedOutputs] = useState<Partial<Record<ToolType, number>>>({});
  const [isLoading, setIsLoading] = useState(false);

  const refreshIterations = useCallback(async () => {
    if (!companyId) {
      setIterations([]);
      setCurrentIterationId(null);
      return;
    }
    setIsLoading(true);
    try {
      const list = (await api.getIterations(companyId))?.iterations ?? [];
      setIterations(list);
      // Derive current iteration id if not explicitly set or no longer exists
      const currentFromFlag = list?.find((it: any) => it?.is_current);
      setCurrentIterationId((prev) => {
        if (prev && list?.some((it: any) => it?.id === prev)) return prev;
        return currentFromFlag ? currentFromFlag.id : list?.[0]?.id ?? null;
      });

      // Derive selected outputs mapping from tool_outputs on current iteration (if provided)
      const current = currentFromFlag ?? list?.[0];
      if (current && Array.isArray(current?.tool_outputs)) {
        const nextSelected: Partial<Record<ToolType, number>> = {};
        current?.tool_outputs?.forEach((out: ToolOutput) => {
          if (out?.is_selected && out?.output_json != null) {
            nextSelected[out?.tool_type] = out?.id;
          }
        });
        setSelectedOutputs(nextSelected);
      }
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    // Reset state when company changes
    setIterations([]);
    setCurrentIterationId(null);
    setSelectedOutputs({});
    if (companyId) {
      void refreshIterations();
    }
  }, [companyId, refreshIterations]);

  const setSelectedOutput = useCallback((toolType: ToolType, outputId: number) => {
    setSelectedOutputs((prev) => ({
      ...prev,
      [toolType]: outputId,
    }));
  }, []);

  const value: IterationContextValue = useMemo(
    () => ({
      iterations,
      currentIteration: iterations?.find((it: any) => it?.id === currentIterationId) ?? null,
      selectedOutputs,
      refreshIterations,
      setCurrentIterationId,
      setSelectedOutput,
      isLoading,
    }),
    [iterations, currentIterationId, selectedOutputs, refreshIterations, isLoading]
  );

  return <IterationContext.Provider value={value}>{children}</IterationContext.Provider>;
};

