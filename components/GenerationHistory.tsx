import React, { useEffect, useMemo, useState } from 'react';
import DecisionOutputView, { DecisionVariant } from './DecisionOutputView';
import api from '../services/api';
import type { ToolOutput, ToolType } from '../types';
import { useIteration } from '../hooks/useIteration';
import { useTranslation } from '../hooks/useTranslation';

interface GenerationHistoryProps {
  iterationId: number | null;
  toolType: ToolType;
  variant: DecisionVariant;
  refreshToken: number;
  onSelectOutput: (output: ToolOutput) => void;
}

const GenerationHistory: React.FC<GenerationHistoryProps> = ({
  iterationId,
  toolType,
  variant,
  refreshToken,
  onSelectOutput,
}) => {
  const { t } = useTranslation();
  const { setSelectedOutput } = useIteration();

  const [runs, setRuns] = useState<ToolOutput[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    if (!iterationId) {
      setRuns([]);
      setActiveId(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const list = await api.getToolOutputs(iterationId, toolType);
        if (cancelled) return;
        // Sort by created_at ascending for stable run numbering
        const sorted = [...list].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setRuns(sorted);
        const selected = sorted.find((r) => r.is_selected) ?? sorted[sorted.length - 1];
        if (selected) {
          setActiveId(selected.id);
          onSelectOutput(selected);
        } else {
          setActiveId(null);
        }
      } catch (e) {
        console.error('Failed to load generation history', e);
        setRuns([]);
        setActiveId(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [iterationId, toolType, refreshToken, onSelectOutput]);

  const activeRun = useMemo(
    () => runs.find((r) => r.id === activeId) ?? null,
    [runs, activeId]
  );

  const handleUseThisVersion = async (run: ToolOutput) => {
    try {
      const updated = await api.selectToolOutput(run.id);
      const updatedRuns = runs.map((r) =>
        r.id === updated.id ? updated : { ...r, is_selected: false }
      );
      setRuns(updatedRuns);
      setActiveId(updated.id);
      setSelectedOutput(toolType, updated.id);
      onSelectOutput(updated);
    } catch (e) {
      console.error('Failed to select tool output', e);
    }
  };

  if (!iterationId) return null;

  const toggleExpanded = () => setExpanded((prev) => !prev);

  const pillsLabel = expanded
    ? t('decisions.generationHistory.hide', { count: runs.length })
    : t('decisions.generationHistory.show', { count: runs.length });

  return (
    <section className="generation-history mt-6">
      <button
        type="button"
        className="text-sm text-primary-text underline-offset-2 hover:underline"
        onClick={toggleExpanded}
        disabled={loading && runs.length === 0}
      >
        {loading && runs.length === 0
          ? t('decisions.generationHistory.loading')
          : pillsLabel}
      </button>

      {expanded && runs.length > 0 && (
        <div className="mt-3 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {runs.map((run, index) => {
              const isSelected = run.is_selected;
              const isActive = activeId === run.id;
              const baseClasses =
                'px-3 py-1 rounded-full border text-xs flex items-center gap-1 whitespace-nowrap cursor-pointer';
              const variantClasses = isActive
                ? 'bg-primary text-primary-text border-primary'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
              return (
                <button
                  key={run.id}
                  type="button"
                  className={`${baseClasses} ${variantClasses}`}
                  onClick={() => setActiveId(run.id)}
                >
                  <span>
                    {t('decisions.generationHistory.runLabel', {
                      index: index + 1,
                    })}
                  </span>
                  {isSelected && <span>✓</span>}
                </button>
              );
            })}
          </div>

          {activeRun && (
            <div className="generation-history__preview border border-gray-200 rounded-lg p-4 bg-white">
              <DecisionOutputView
                outputData={activeRun.output_json ?? undefined}
                variant={variant}
                fallback={activeRun.output_raw ?? undefined}
                t={t}
              />
              {!activeRun.is_selected && (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    className="text-xs font-medium text-primary-text border border-primary px-3 py-1 rounded-md hover:bg-primary/10"
                    onClick={() => handleUseThisVersion(activeRun)}
                  >
                    {t('decisions.generationHistory.useThisVersion')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default GenerationHistory;

