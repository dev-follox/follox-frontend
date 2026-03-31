import React, { useEffect, useState } from 'react';
import { DecisionVariant } from './DecisionOutputView';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import type { IterationContextSummary, ToolType } from '../types';

interface IterationContextBannerProps {
  variant: DecisionVariant;
  refreshToken: number;
}

const variantToToolType = (variant: DecisionVariant): ToolType => variant;

const IterationContextBanner: React.FC<IterationContextBannerProps> = ({ variant, refreshToken }) => {
  const { user } = useAuth();
  const companyId = user?.company?.id;
  const [context, setContext] = useState<IterationContextSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const toolType = variantToToolType(variant);
        const res = await api.getIterationContext(companyId, toolType);
        if (cancelled) return;
        setContext(res);
      } catch (e) {
        console.error('Failed to load iteration context', e);
        if (!cancelled) {
          setError(true);
          setContext(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [companyId, variant, refreshToken]);

  if (!companyId || error || (!loading && !context)) {
    return null;
  }

  const current = context?.current_iteration;
  const past = context?.past_iteration;

  let summaryText = '';
  if (context) {
    const toolType = context.type;
    if (toolType === 'hypothesis_generator') {
      if (!past || past.id == null) {
        summaryText = 'Starting fresh — no previous iteration to reference';
      } else if (past.hypotheses != null) {
        summaryText = 'Evolving from past iteration hypotheses';
      } else {
        summaryText = 'Past iteration exists but has no hypotheses yet';
      }
    } else if (toolType === 'custdev_target_planner') {
      const parts: string[] = [];
      if (current?.hypotheses != null) parts.push('Using current hypotheses');
      if (past?.hypotheses != null) parts.push('Referencing past hypotheses');
      if (past?.custdev_target_plan != null) parts.push('Referencing past target plan');
      summaryText = parts.join(' · ') || 'No hypotheses or target plans available yet';
    } else if (toolType === 'custdev_interview_designer') {
      const parts: string[] = [];
      if (current?.hypotheses != null) parts.push('Using current hypotheses');
      if (current?.custdev_target_plan != null) parts.push('Using current target plan');
      if (past?.hypotheses != null) parts.push('Referencing past hypotheses');
      if (past?.custdev_target_plan != null) parts.push('Referencing past target plan');
      if (past?.custdev_interview_design != null) parts.push('Referencing past interview design');
      summaryText = parts.join(' · ') || 'No related hypotheses, plans, or interviews yet';
    } else if (toolType === 'custdev_insights_analyzer') {
      const parts: string[] = [];
      if (current?.hypotheses != null) parts.push('Current hypotheses');
      if (current?.custdev_target_plan != null) parts.push('Current target plan');
      if (current?.custdev_interview_design != null) parts.push('Current interview design');
      if (current?.custdev_insights_analysis != null) parts.push('Current insights');
      if (past?.hypotheses != null) parts.push('Past hypotheses');
      if (past?.custdev_target_plan != null) parts.push('Past target plan');
      if (past?.custdev_interview_design != null) parts.push('Past interview design');
      if (past?.custdev_insights_analysis != null) parts.push('Past insights');
      summaryText = parts.join(' · ') || 'No current or past iteration data yet';
    }
  }

  const checklistItems: { key: string; label: string; filled: boolean }[] = [];
  if (context) {
    checklistItems.push(
      {
        key: 'current_hypotheses',
        label: 'Current hypotheses',
        filled: !!current?.hypotheses,
      },
      {
        key: 'current_target_plan',
        label: 'Current target plan',
        filled: !!current?.custdev_target_plan,
      },
      {
        key: 'current_interview_design',
        label: 'Current interview design',
        filled: !!current?.custdev_interview_design,
      },
      {
        key: 'current_insights',
        label: 'Current insights',
        filled: !!current?.custdev_insights_analysis,
      },
      {
        key: 'past_hypotheses',
        label: 'Past hypotheses',
        filled: !!past?.hypotheses,
      },
      {
        key: 'past_target_plan',
        label: 'Past target plan',
        filled: !!past?.custdev_target_plan,
      },
      {
        key: 'past_interview_design',
        label: 'Past interview design',
        filled: !!past?.custdev_interview_design,
      },
      {
        key: 'past_insights',
        label: 'Past insights',
        filled: !!past?.custdev_insights_analysis,
      }
    );
  }

  return (
    <div className="iteration-context-banner mb-4 rounded-md bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-900 flex flex-col gap-1">
      {loading && !context ? (
        <div className="h-4 bg-blue-100/70 rounded animate-pulse" />
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
            <p className="text-xs">{summaryText}</p>
            <button
              type="button"
              className="self-start md:self-auto text-[11px] font-medium text-blue-800 underline underline-offset-2"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? "Hide what's included" : "What's included?"}
            </button>
          </div>
          {expanded && checklistItems.length > 0 && (
            <ul className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
              {checklistItems.map((item) => (
                <li
                  key={item.key}
                  className={`flex items-center gap-1 ${
                    item.filled ? 'text-green-700' : 'text-gray-500 line-through'
                  }`}
                >
                  <span className="text-xs">{item.filled ? '✓' : '✗'}</span>
                  <span className="text-[11px]">{item.label}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default IterationContextBanner;

