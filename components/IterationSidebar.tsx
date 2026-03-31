import React, { useEffect, useMemo, useState } from 'react';
import { useIteration } from '../hooks/useIteration';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import type { Iteration, ToolOutput, ToolType } from '../types';

const TOOL_SLOTS: { id: ToolType; label: string }[] = [
  { id: 'hypothesis_generator', label: 'Hypotheses' },
  { id: 'custdev_target_planner', label: 'Target Plan' },
  { id: 'custdev_interview_designer', label: 'Interview Design' },
  { id: 'custdev_insights_analyzer', label: 'Insights' },
];

type OutputsByIteration = Record<number, Partial<Record<ToolType, ToolOutput[]>>>;

const IterationSidebar: React.FC = () => {
  const { user } = useAuth();
  const { iterations, currentIteration, setCurrentIterationId, refreshIterations, isLoading } = useIteration();
  const [sectionCollapsed, setSectionCollapsed] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [outputsByIteration, setOutputsByIteration] = useState<OutputsByIteration>({});
  const [loadingNewIteration, setLoadingNewIteration] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const companyId = user?.company?.id;

  useEffect(() => {
    // Mobile-first: collapse on small screens by default
    if (typeof window !== 'undefined') {
      setSectionCollapsed(window.innerWidth < 768);
    }
  }, []);

  useEffect(() => {
    if (companyId) {
      void refreshIterations();
    }
  }, [companyId, refreshIterations]);

  const toggleSection = () => {
    setSectionCollapsed((prev) => !prev);
  };

  const toggleExpanded = (iterationId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(iterationId)) {
        next.delete(iterationId);
      } else {
        next.add(iterationId);
      }
      return next;
    });
  };

  const loadToolOutputsIfNeeded = async (iteration: Iteration) => {
    if (!companyId) return;
    if (outputsByIteration[iteration.id]) return;

    const toolTypes: ToolType[] = [
      'hypothesis_generator',
      'custdev_target_planner',
      'custdev_interview_designer',
      'custdev_insights_analyzer',
    ];

    try {
      const results = await Promise.all(
        toolTypes.map((toolType) => api.getToolOutputs(iteration.id, toolType).catch(() => [] as ToolOutput[]))
      );

      setOutputsByIteration((prev) => {
        const next: Partial<Record<ToolType, ToolOutput[]>> = {};
        toolTypes.forEach((toolType, index) => {
          next[toolType] = results[index];
        });
        return {
          ...prev,
          [iteration.id]: next,
        };
      });
    } catch {
      // Silent failure – dots will just appear empty
    }
  };

  const handleIterationClick = (iteration: Iteration) => {
    setCurrentIterationId(iteration.id);
  };

  const handleStartNewIteration = async () => {
    if (!companyId) return;
    setLoadingNewIteration(true);
    setActionMessage(null);
    setActionError(null);
    try {
      await api.startNewIteration(companyId);
      await refreshIterations();
      setActionMessage('New iteration started');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (e) {
      console.error(e);
      setActionError('Failed to start new iteration');
    } finally {
      setLoadingNewIteration(false);
    }
  };

  const formatDateShort = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });

  const toolOutputsForIteration = useMemo(
    () => (iteration: Iteration): Partial<Record<ToolType, ToolOutput[]>> | undefined =>
      iteration.tool_outputs
        ? TOOL_SLOTS.reduce<Partial<Record<ToolType, ToolOutput[]>>>((acc, slot) => {
            acc[slot.id] = iteration.tool_outputs!.filter((o) => o.tool_type === slot.id);
            return acc;
          }, {})
        : outputsByIteration[iteration.id],
    [outputsByIteration]
  );

  if (!companyId) return null;

  return (
    <div className="sidebar-iterations mt-4 px-4">
      <button
        type="button"
        className="w-full flex items-center justify-between text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2"
        onClick={toggleSection}
      >
        <span>Iterations</span>
        <span className="text-gray-400">
          {sectionCollapsed ? (
            <span>&#9654;</span>
          ) : (
            <span>&#9660;</span>
          )}
        </span>
      </button>

      {!sectionCollapsed && (
        <div className="sidebar-iterations__body space-y-2">
          {isLoading && iterations.length === 0 && (
            <div className="text-xs text-gray-400 py-2">Loading iterations…</div>
          )}

          {iterations.map((iteration) => {
            const isCurrent = currentIteration?.id === iteration.id;
            const isExpanded = expandedIds.has(iteration.id);
            const outputs = toolOutputsForIteration(iteration);

            const statusLabel = iteration.is_current
              ? 'Current'
              : iteration.is_past
              ? 'Past'
              : 'Archived';

            const statusClass = iteration.is_current
              ? 'bg-green-100 text-green-700'
              : iteration.is_past
              ? 'bg-gray-100 text-gray-600'
              : 'bg-gray-100 text-gray-500';

            return (
              <div
                key={iteration.id}
                className={`sidebar-iterations__item rounded-md border border-gray-200 bg-white text-xs ${
                  isCurrent ? 'ring-1 ring-primary' : ''
                }`}
              >
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2"
                  onClick={() => {
                    handleIterationClick(iteration);
                    toggleExpanded(iteration.id);
                    void loadToolOutputsIfNeeded(iteration);
                  }}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-gray-800 truncate">{iteration.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${statusClass}`}>{statusLabel}</span>
                      <span className="text-[10px] text-gray-400">{formatDateShort(iteration.created_at)}</span>
                    </div>
                  </div>
                  <span className="text-gray-400 text-xs ml-2">{isExpanded ? '▾' : '▸'}</span>
                </button>

                {isExpanded && (
                  <div className="sidebar-iterations__tools px-3 pb-2 space-y-1">
                    {TOOL_SLOTS.map((slot) => {
                      const slotOutputs = outputs?.[slot.id] ?? [];
                      const hasSelected =
                        Array.isArray(slotOutputs) &&
                        slotOutputs.some((o) => o.is_selected && o.output_json != null);

                      return (
                        <div key={slot.id} className="flex items-center justify-between text-[11px] text-gray-600">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex h-2.5 w-2.5 rounded-full border ${
                                hasSelected ? 'bg-primary border-primary' : 'bg-gray-100 border-gray-300'
                              }`}
                            />
                            <span>{slot.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-1">
            <button
              type="button"
              onClick={handleStartNewIteration}
              disabled={loadingNewIteration}
              className="w-full text-xs font-medium text-primary-text bg-primary/10 hover:bg-primary/20 rounded-md px-3 py-2 flex items-center justify-between"
            >
              <span>Start New Iteration</span>
              <span className="text-sm">→</span>
            </button>
            {loadingNewIteration && (
              <div className="text-[11px] text-gray-500 mt-1">Starting new iteration…</div>
            )}
            {actionMessage && (
              <div className="text-[11px] text-green-600 mt-1">{actionMessage}</div>
            )}
            {actionError && (
              <div className="text-[11px] text-red-600 mt-1">{actionError}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IterationSidebar;

