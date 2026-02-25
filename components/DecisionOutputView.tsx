import React from 'react';
import Card from './Card';

export type DecisionVariant =
  | 'hypothesis_generator'
  | 'custdev_target_planner'
  | 'custdev_insights_analyzer'
  | 'custdev_interview_designer';

interface DecisionOutputViewProps {
  outputData: Record<string, unknown> | null | undefined;
  variant: DecisionVariant;
  fallback?: string | null;
  t: (key: string) => string;
}

// ─── Data Extraction ──────────────────────────────────────────────────────────

function extractText(outputData: Record<string, unknown> | null | undefined): string | null {
  if (!outputData) return null;

  const content = outputData.content;
  if (Array.isArray(content) && content.length > 0) {
    const texts = content
      .filter((item): item is Record<string, unknown> =>
        item != null && typeof item === 'object' && typeof (item as any).text === 'string'
      )
      .map((item) => (item.text as string).trim())
      .filter(Boolean);
    if (texts.length > 0) return texts.join('\n\n');
  }

  return null;
}

function parseJson(text: string): unknown {
  const trimmed = text.trim();

  let raw = trimmed;
  const fenceMatch = trimmed.match(/^```(?:json)?\s*\n([\s\S]*)$/);
  if (fenceMatch) {
    raw = fenceMatch[1].replace(/\n?```\s*$/, '').trim();
  } else {
    const start = trimmed.indexOf('{');
    if (start !== -1) raw = trimmed.slice(start);
  }

  try { return JSON.parse(raw); } catch { /* fall through to repair */ }

  let i = 0;
  let inString = false;
  let escaped = false;
  const stack: string[] = [];

  while (i < raw.length) {
    const ch = raw[i];
    if (escaped) { escaped = false; i++; continue; }
    if (ch === '\\' && inString) { escaped = true; i++; continue; }
    if (ch === '"') { inString = !inString; i++; continue; }
    if (inString) { i++; continue; }
    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') stack.pop();
    i++;
  }

  let repaired = raw;

  if (inString) repaired += '"';

  repaired = repaired.replace(/,\s*"[^"]*"?\s*:\s*"[^"]*$/, '');
  repaired = repaired.replace(/,\s*"[^"]*"?\s*:\s*$/, '');
  repaired = repaired.replace(/,\s*"[^"]*"?\s*$/, '');
  repaired = repaired.replace(/,\s*$/, '');

  repaired += stack.reverse().join('');

  try { return JSON.parse(repaired); } catch { return null; }
}

// ─── Shared Helpers ───────────────────────────────────────────────────────────

const formatLabel = (key: string): string =>
  key.split(/[_\s]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

const RenderKeyValue: React.FC<{ data: Record<string, unknown>; t: (k: string) => string }> = ({ data, t }) => (
  <dl className="space-y-2">
    {Object.entries(data).map(([k, v]) => {
      if (v == null) return null;
      if (Array.isArray(v)) {
        return (
          <div key={k}>
            <dt className="font-medium text-gray-700">{formatLabel(k)}</dt>
            <dd className="mt-1 text-gray-600">
              <ul className="list-disc list-inside space-y-1">
                {v.map((item, i) => (
                  <li key={i}>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</li>
                ))}
              </ul>
            </dd>
          </div>
        );
      }
      if (typeof v === 'object') {
        return (
          <div key={k}>
            <dt className="font-medium text-gray-700">{formatLabel(k)}</dt>
            <dd className="mt-1 text-gray-600 pl-3 border-l-2 border-gray-200">
              <RenderKeyValue data={v as Record<string, unknown>} t={t} />
            </dd>
          </div>
        );
      }
      return (
        <div key={k}>
          <dt className="font-medium text-gray-700">{formatLabel(k)}</dt>
          <dd className="mt-1 text-gray-600">{String(v)}</dd>
        </div>
      );
    })}
  </dl>
);

// ─── Hypothesis Generator ─────────────────────────────────────────────────────

interface HypothesisAnalysisRoot {
  hypothesis_analysis?: {
    startup_summary?: {
      product_name?: string;
      stage?: string;
      critical_observation?: string;
    };
    leap_of_faith_assumptions?: Array<{
      id?: number;
      assumption?: string;
      risk_level?: string;
      risk_emoji?: string;
    }>;
    hypotheses?: Array<{
      hypothesis_id?: string;
      title?: string;
      type?: string;
      statement?: string;
      assumption_being_tested?: string;
      if_true_expect?: string[];
      if_false_see?: string[];
      minimum_success_criteria?: {
        metrics?: Array<{ metric_name?: string; target?: string }>;
        qualitative_signals?: string[];
      };
      risk_level?: string;
      why_this_matters?: string;
    }>;
    recommended_testing_sequence?: {
      phases?: Array<{
        phase_number?: number;
        phase_name?: string;
        timeline?: string;
        hypotheses_to_test?: string[];
        method?: string;
        sample_size?: string;
        rationale?: string;
      }>;
    };
    metrics_to_track?: {
        leading_indicators?: string[];
        lagging_indicators?: string[];
        innovation_accounting_baseline?: string;
    };
    mvp_recommendation?: {
      mvp_type?: string;
      purpose?: string;
      success_metric?: string;
      timeline?: string;
    };
  };
}

const HypothesisGeneratorOutput: React.FC<{ text: string; t: (k: string) => string }> = ({ text, t }) => {
  const parsed = parseJson(text) as HypothesisAnalysisRoot | null;
  const data = parsed?.hypothesis_analysis;

  if (!data) return <MarkdownOutput text={text} />;

  return (
    <div className="decision-output decision-output--hypothesis-generator space-y-8">
      {/* Startup Summary */}
      {data.startup_summary && (
        <section>
          <h3 className="decision-output__section-title">Startup Summary</h3>
          <Card className="p-4 space-y-2 text-sm">
            {data.startup_summary.product_name && (
              <p><span className="font-medium text-gray-600">Product:</span> {data.startup_summary.product_name}</p>
            )}
            {data.startup_summary.stage && (
              <p><span className="font-medium text-gray-600">Stage:</span> {data.startup_summary.stage}</p>
            )}
            {data.startup_summary.critical_observation && (
              <blockquote className="mt-2 p-3 border-l-4 border-amber-400 bg-amber-50 text-amber-800 text-sm">
                ⚠️ {data.startup_summary.critical_observation}
              </blockquote>
            )}
          </Card>
        </section>
      )}

      {/* Leap-of-Faith Assumptions */}
      {data.leap_of_faith_assumptions && data.leap_of_faith_assumptions.length > 0 && (
        <section>
          <h3 className="decision-output__section-title">Leap-of-Faith Assumptions</h3>
          <div className="space-y-2">
            {data.leap_of_faith_assumptions.map((assumption) => (
              <Card key={assumption.id} className="p-3 flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{assumption.risk_emoji ?? '🔴'}</span>
                <div className="flex-1 text-sm">
                  <p className="font-medium text-gray-800">{assumption.id}. {assumption.assumption}</p>
                  <p className="text-xs text-gray-600 mt-1 uppercase font-semibold">{assumption.risk_level}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Hypotheses */}
      {data.hypotheses && data.hypotheses.length > 0 && (
        <section>
          <h3 className="decision-output__section-title">Hypotheses to Test</h3>
          <div className="space-y-6">
            {data.hypotheses.map((h) => (
              <Card key={h.hypothesis_id} className="p-5 space-y-4">
                <div>
                  <h4 className="text-base font-bold text-primary-text">
                    {h.hypothesis_id}: {h.title}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">Type: <span className="font-medium">{h.type}</span></p>
                </div>

                <div>
                  <h5 className="text-sm font-semibold text-gray-700 mb-1">Statement</h5>
                  <p className="text-sm text-gray-700 italic">{h.statement}</p>
                </div>

                <div>
                  <h5 className="text-sm font-semibold text-gray-700 mb-1">Assumption Being Tested</h5>
                  <p className="text-sm text-gray-700">{h.assumption_being_tested}</p>
                </div>

                {h.if_true_expect && h.if_true_expect.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-green-700 mb-1">If True, We Expect</h5>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {h.if_true_expect.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                )}

                {h.if_false_see && h.if_false_see.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-red-700 mb-1">If False, We'll See</h5>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {h.if_false_see.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                )}

                {h.minimum_success_criteria && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Minimum Success Criteria</h5>
                    {h.minimum_success_criteria.metrics && h.minimum_success_criteria.metrics.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-gray-600 mb-1">Metrics</p>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                          {h.minimum_success_criteria.metrics.map((m, i) => (
                            <li key={i}><span className="font-medium">{m.metric_name}:</span> {m.target}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {h.minimum_success_criteria.qualitative_signals && h.minimum_success_criteria.qualitative_signals.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Qualitative Signals</p>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                          {h.minimum_success_criteria.qualitative_signals.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {h.risk_level && <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                    h.risk_level.toLowerCase() === 'critical' ? 'bg-red-100 text-red-800' :
                    h.risk_level.toLowerCase() === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {h.risk_level}
                  </span>
                </div>}

                <div className="text-sm text-gray-700">
                  <span className="font-medium">Why This Matters:</span> {h.why_this_matters}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Testing Sequence */}
      {data.recommended_testing_sequence?.phases && data.recommended_testing_sequence.phases.length > 0 && (
        <section>
          <h3 className="decision-output__section-title">Recommended Testing Sequence</h3>
          <div className="space-y-3">
            {data.recommended_testing_sequence.phases.map((phase) => (
              <Card key={phase.phase_number} className="p-4 space-y-2 text-sm">
                <h5 className="font-semibold text-gray-800">
                  Phase {phase.phase_number}: {phase.phase_name}
                </h5>
                <p className="text-gray-600">Timeline: {phase.timeline}</p>
                <p className="text-gray-700">Hypotheses: {phase.hypotheses_to_test.join(', ')}</p>
                <p className="text-gray-700">Method: {phase.method}</p>
                <p className="text-gray-700">Sample Size: {phase.sample_size}</p>
                <p className="text-gray-600 italic">{phase.rationale}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* MVP Recommendation */}
      {data.mvp_recommendation && (
        <section>
          <h3 className="decision-output__section-title">MVP Recommendation</h3>
          <Card className="p-4 space-y-2 text-sm">
            <p><span className="font-medium text-gray-600">Type:</span> {data.mvp_recommendation.mvp_type}</p>
            <p><span className="font-medium text-gray-600">Purpose:</span> {data.mvp_recommendation.purpose}</p>
            <p><span className="font-medium text-gray-600">Success Metric:</span> {data.mvp_recommendation.success_metric}</p>
            <p><span className="font-medium text-gray-600">Timeline:</span> {data.mvp_recommendation.timeline}</p>
          </Card>
        </section>
      )}
    </div>
  );
};

// ─── Markdown Renderer (Fallback) ─────────────────────────────────────────────

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.*?)\*\*|\*(.*?)\*|`(.*?)`/g;
  let last = 0; let match; let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(<span key={key++}>{text.slice(last, match.index)}</span>);
    if (match[1] != null) parts.push(<strong key={key++}>{match[1]}</strong>);
    else if (match[2] != null) parts.push(<em key={key++}>{match[2]}</em>);
    else if (match[3] != null) parts.push(<code key={key++} className="bg-gray-100 text-gray-800 px-1 rounded text-sm font-mono">{match[3]}</code>);
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(<span key={key++}>{text.slice(last)}</span>);
  return parts;
}

function renderMarkdownTable(lines: string[]): React.ReactNode {
  const rows = lines
    .filter((l) => !l.match(/^\|[\s-|]+\|$/))
    .map((l) => l.split('|').slice(1, -1).map((cell) => cell.trim()));

  if (rows.length === 0) return null;
  const [header, ...body] = rows;

  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {header.map((cell, i) => (
              <th key={i} className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">
                {renderInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {row.map((cell, j) => (
                <td key={j} className="border border-gray-200 px-3 py-2 text-gray-700">
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const MarkdownOutput: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-2xl font-bold text-gray-900 mt-6 mb-3 pb-2 border-b border-gray-200">{renderInline(line.slice(2))}</h1>);
    }
    else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-xl font-semibold text-gray-800 mt-6 mb-2">{renderInline(line.slice(3))}</h2>);
    }
    else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-base font-semibold text-gray-700 mt-4 mb-1">{renderInline(line.slice(4))}</h3>);
    }
    else if (line.trim() === '---') {
      elements.push(<hr key={i} className="my-4 border-gray-200" />);
    }
    else if (line.startsWith('> ')) {
      const content = line.slice(2);
      const isWarning = content.includes('⚠️') || content.toLowerCase().includes('critical') || content.toLowerCase().includes('risk');
      elements.push(
        <blockquote key={i} className={`my-3 px-4 py-3 rounded-r border-l-4 text-sm ${isWarning ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-blue-400 bg-blue-50 text-blue-800'}`}>
          {renderInline(content)}
        </blockquote>
      );
    }
    else if (line.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(<React.Fragment key={i}>{renderMarkdownTable(tableLines)}</React.Fragment>);
      continue;
    }
    else if (line.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={i} className="list-disc list-inside space-y-1 my-2 text-gray-700">
          {items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
        </ul>
      );
      continue;
    }
    else if (line.trim() !== '') {
      elements.push(<p key={i} className="text-gray-700 leading-relaxed my-1">{renderInline(line)}</p>);
    }

    i++;
  }

  return <div className="decision-output decision-output--hypothesis-generator space-y-1">{elements}</div>;
};

// ─── CustDev Target Planner ───────────────────────────────────────────────────

interface TargetSegment {
  segment_id?: number;
  segment_name?: string;
  description?: string;
  why_early_adopters?: {
    pain_level?: string;
    current_spend?: string;
    willingness_to_try_new_solutions?: string;
    can_articulate_the_problem?: string;
  };
  specific_characteristics?: string[];
  where_to_find_them?: {
    online?: string[];
    offline?: string[];
    through?: string[];
  };
  screening_criteria_must_have?: string[];
  red_flags_exclude_if?: string[];
}

interface CustomerSegmentationRoot {
  customer_segmentation_for_validation?: {
    context_analysis?: { startup_name?: string; stage?: string; critical_gap?: string; approach?: string };
    context_note?: string;
    hypothesis_being_tested?: string;
    assumption_risk_level?: string;
    rationale?: string;
    primary_target_segments?: TargetSegment[];
    primary_target_segments_early_adopters?: TargetSegment[];
  };
}

const CustdevTargetPlannerOutput: React.FC<{ text: string; t: (k: string) => string }> = ({ text, t }) => {
  const parsed = parseJson(text) as CustomerSegmentationRoot | null;
  const data = parsed?.customer_segmentation_for_validation;

  if (!data) return <MarkdownOutput text={text} />;

  const segments = data.primary_target_segments_early_adopters ?? data.primary_target_segments ?? [];
  const ctx = data.context_analysis;

  return (
    <div className="decision-output decision-output--custdev-target-planner space-y-8">
      {ctx && (ctx.critical_gap || ctx.approach) && (
        <section>
          <h3 className="decision-output__section-title">Context Analysis</h3>
          <Card className="p-4 space-y-2 text-sm">
            {ctx.startup_name && <p><span className="font-medium text-gray-600">Startup:</span> {ctx.startup_name}</p>}
            {ctx.stage && <p><span className="font-medium text-gray-600">Stage:</span> {ctx.stage}</p>}
            {ctx.critical_gap && <p className="text-gray-700 mt-1">{ctx.critical_gap}</p>}
            {ctx.approach && <p className="text-gray-700 mt-1 italic">{ctx.approach}</p>}
          </Card>
        </section>
      )}

      {data.hypothesis_being_tested && (
        <section>
          <h3 className="decision-output__section-title">Hypothesis Being Tested</h3>
          <p className="text-gray-700">{data.hypothesis_being_tested}</p>
          {data.assumption_risk_level && (
            <p className="mt-1 text-sm font-medium text-red-600">Risk level: {data.assumption_risk_level}</p>
          )}
          {data.rationale && <p className="mt-2 text-sm text-gray-600">{data.rationale}</p>}
        </section>
      )}

      {segments.length > 0 && (
        <section>
          <h3 className="decision-output__section-title">Primary Target Segments</h3>
          <div className="space-y-6">
            {segments.map((seg, i) => (
              <Card key={seg.segment_id ?? i} className="p-5 space-y-4">
                {(seg.segment_name || seg.segment_id != null) && (
                  <h4 className="text-base font-semibold text-primary-text">
                    {seg.segment_id != null && `${seg.segment_id}. `}{seg.segment_name ?? 'Segment'}
                  </h4>
                )}
                {seg.description && <p className="text-gray-700 text-sm">{seg.description}</p>}

                {seg.why_early_adopters && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Why Early Adopters</h5>
                    <dl className="grid gap-2 text-sm">
                      {Object.entries(seg.why_early_adopters).map(([k, v]) =>
                        v ? (
                          <div key={k}>
                            <dt className="font-medium text-gray-600">{formatLabel(k)}</dt>
                            <dd className="text-gray-700">{v}</dd>
                          </div>
                        ) : null
                      )}
                    </dl>
                  </div>
                )}

                {seg.specific_characteristics && seg.specific_characteristics.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Specific Characteristics</h5>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {seg.specific_characteristics.map((c, j) => <li key={j}>{c}</li>)}
                    </ul>
                  </div>
                )}

                {seg.where_to_find_them && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Where to Find Them</h5>
                    <div className="space-y-2 text-sm">
                      {(['online', 'offline', 'through'] as const).map((channel) => {
                        const items = seg.where_to_find_them![channel];
                        if (!items?.length) return null;
                        return (
                          <div key={channel}>
                            <span className="font-medium text-gray-600 capitalize">{channel}: </span>
                            <ul className="list-disc list-inside text-gray-700 mt-1 ml-2">
                              {items.map((s, j) => <li key={j}>{s}</li>)}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {seg.screening_criteria_must_have && seg.screening_criteria_must_have.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Screening Criteria (Must Have)</h5>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {seg.screening_criteria_must_have.map((c, j) => <li key={j}>{c}</li>)}
                    </ul>
                  </div>
                )}

                {seg.red_flags_exclude_if && seg.red_flags_exclude_if.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-red-600 mb-2">Red Flags (Exclude If)</h5>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {seg.red_flags_exclude_if.map((c, j) => <li key={j}>{c}</li>)}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// ─── CustDev Interview Designer ───────────────────────────────────────────────

interface RiskItem {
  risk_id?: string;
  category?: string;
  description?: string;
  severity?: string;
  likelihood?: string;
  mitigation?: string;
}

interface InterviewSection {
  section_number?: number;
  section_name?: string;
  duration?: string;
  goal?: string;
  key_questions?: Array<{
    question?: string;
    why_this_works?: string;
    listen_for?: string[];
    follow_ups?: string[];
  }>;
  what_not_to_ask?: Array<{
    bad_question?: string;
    why_bad?: string;
  }>;
}

interface InterviewBatch {
  batch_number?: number;
  batch_name?: string;
  num_interviews?: string | number;
  goal?: string;
  duration_per_interview?: string;
  format_preference?: string[];
  format_rationale?: string;
  prerequisite?: string;
}

interface InterviewGuideRoot {
  interview_guide?: {
    metadata?: {
      startup_name?: string;
      product_stage?: string;
      hypothesis_being_tested?: string;
      target_segment?: string;
      interview_goal?: string;
      duration?: string;
      format?: string;
      language?: string;
    };
    risk_assessment?: {
      overall_risk_level?: string;
      risks?: RiskItem[];
      critical_risks?: RiskItem[];
    };
    pre_interview_preparation?: {
      what_you_are_actually_testing?: string[];
      success_looks_like?: string[];
      failure_looks_like?: string[];
    };
    recommended_approach?: {
      phase?: string;
      rationale?: string;
      interview_batches?: InterviewBatch[];
    };
    interview_sections?: InterviewSection[];
    post_interview_capture?: {
      immediate_notes?: string[];
      validation_scoring?: {
        criteria?: Array<{ criterion?: string; scale?: string }>;
      };
      quality_checklist?: {
        good_signs?: string[];
        bad_signs?: string[];
      };
    };
    [key: string]: unknown;
  };
}

const severityColor = (s?: string) => {
  const l = (s ?? '').toLowerCase();
  if (l === 'critical') return 'border-red-500 bg-red-50';
  if (l === 'high') return 'border-orange-400 bg-orange-50';
  return 'border-yellow-300 bg-yellow-50';
};

const CustdevInterviewDesignerOutput: React.FC<{ text: string; t: (k: string) => string }> = ({ text, t }) => {
  const parsed = parseJson(text) as InterviewGuideRoot | null;
  const guide = parsed?.interview_guide;

  if (!guide) return <MarkdownOutput text={text} />;

  const { metadata, risk_assessment, pre_interview_preparation, recommended_approach, interview_sections, post_interview_capture } = guide;
  const risks = risk_assessment?.risks ?? risk_assessment?.critical_risks ?? [];

  const extraSections = Object.entries(guide).filter(
    ([k]) => !['metadata', 'risk_assessment', 'pre_interview_preparation', 'recommended_approach', 'interview_sections', 'post_interview_capture'].includes(k)
  );

  return (
    <div className="decision-output decision-output--custdev-interview-designer space-y-8">
      {metadata && (
        <section>
          <h3 className="decision-output__section-title">Interview Guide Metadata</h3>
          <Card className="p-4 space-y-2 text-sm">
            {metadata.startup_name && <p><span className="font-medium text-gray-600">Startup:</span> {metadata.startup_name}</p>}
            {metadata.product_stage && <p><span className="font-medium text-gray-600">Stage:</span> {metadata.product_stage}</p>}
            {metadata.hypothesis_being_tested && (
              <p className="text-gray-700 mt-2"><span className="font-medium text-gray-600">Hypothesis:</span> {metadata.hypothesis_being_tested}</p>
            )}
            {metadata.target_segment && <p><span className="font-medium text-gray-600">Target segment:</span> {metadata.target_segment}</p>}
            {metadata.interview_goal && (
              <p className="text-gray-700"><span className="font-medium text-gray-600">Goal:</span> {metadata.interview_goal}</p>
            )}
            {metadata.duration && <p><span className="font-medium text-gray-600">Duration:</span> {metadata.duration}</p>}
            {metadata.format && <p><span className="font-medium text-gray-600">Format:</span> {metadata.format}</p>}
          </Card>
        </section>
      )}

      {(risk_assessment?.overall_risk_level || risks.length > 0) && (
        <section>
          <h3 className="decision-output__section-title">Risk Assessment</h3>
          <div className="space-y-3">
            {risk_assessment?.overall_risk_level && (
              <p className="text-sm font-semibold text-red-600">
                Overall Risk Level: {risk_assessment.overall_risk_level}
              </p>
            )}
            {risks.map((r, i) => (
              <div key={r.risk_id ?? i} className={`p-4 border-l-4 rounded-r text-sm space-y-1 ${severityColor(r.severity)}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  {r.risk_id && <span className="font-mono font-bold text-gray-700">{r.risk_id}</span>}
                  {r.category && <span className="font-semibold text-gray-800">{r.category}</span>}
                  {r.severity && (
                    <span className={`ml-auto text-xs font-bold uppercase px-2 py-0.5 rounded ${
                      r.severity === 'critical' ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'
                    }`}>
                      {r.severity}
                    </span>
                  )}
                </div>
                {r.description && <p className="text-gray-700">{r.description}</p>}
                {r.likelihood && <p className="text-xs text-gray-600">Likelihood: {r.likelihood}</p>}
                {r.mitigation && (
                  <p className="text-gray-700 mt-2"><span className="font-medium">Mitigation:</span> {r.mitigation}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {pre_interview_preparation && (
        <section>
          <h3 className="decision-output__section-title">Pre-Interview Preparation</h3>
          <Card className="p-4 space-y-3">
            {pre_interview_preparation.what_you_are_actually_testing &&
              pre_interview_preparation.what_you_are_actually_testing.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">What You Are Actually Testing</h5>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {pre_interview_preparation.what_you_are_actually_testing.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            {pre_interview_preparation.success_looks_like && pre_interview_preparation.success_looks_like.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-green-700 mb-2">Success Looks Like</h5>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {pre_interview_preparation.success_looks_like.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}
            {pre_interview_preparation.failure_looks_like && pre_interview_preparation.failure_looks_like.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-red-700 mb-2">Failure Looks Like</h5>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {pre_interview_preparation.failure_looks_like.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}
          </Card>
        </section>
      )}

      {recommended_approach && (
        <section>
          <h3 className="decision-output__section-title">Recommended Approach</h3>
          <Card className="p-4 space-y-4">
            {recommended_approach.phase && <p className="font-semibold text-primary-text">{recommended_approach.phase}</p>}
            {recommended_approach.rationale && <p className="text-sm text-gray-700">{recommended_approach.rationale}</p>}
            {recommended_approach.interview_batches && recommended_approach.interview_batches.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-gray-700">Interview Batches</h5>
                {recommended_approach.interview_batches.map((b, i) => (
                  <Card key={i} className="p-3 space-y-1 text-sm">
                    <p className="font-semibold text-gray-800">
                      Batch {b.batch_number}{b.batch_name ? `: ${b.batch_name}` : ''}
                    </p>
                    {b.num_interviews && <p className="text-gray-600">Interviews: {b.num_interviews}</p>}
                    {b.goal && <p className="text-gray-700">{b.goal}</p>}
                    {b.duration_per_interview && <p className="text-gray-600">Duration: {b.duration_per_interview}</p>}
                    {b.format_preference && <p className="text-gray-600">Format: {b.format_preference.join(', ')}</p>}
                    {b.format_rationale && <p className="text-gray-600 italic text-xs">{b.format_rationale}</p>}
                    {b.prerequisite && (
                      <p className="text-amber-700"><span className="font-medium">Prerequisite:</span> {b.prerequisite}</p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </section>
      )}

      {interview_sections && interview_sections.length > 0 && (
        <section>
          <h3 className="decision-output__section-title">Interview Sections</h3>
          <div className="space-y-4">
            {interview_sections.map((section) => (
              <Card key={section.section_number} className="p-4 space-y-3">
                <div>
                  <h5 className="font-semibold text-gray-800">
                    Section {section.section_number}: {section.section_name}
                  </h5>
                  <p className="text-xs text-gray-600 mt-1">
                    Duration: {section.duration} • Goal: {section.goal}
                  </p>
                </div>

                {section.key_questions && section.key_questions.length > 0 && (
                  <div className="space-y-3">
                    {section.key_questions.map((q, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded border border-gray-200 space-y-2 text-sm">
                        <p className="font-medium text-gray-800">{q.question}</p>
                        {q.why_this_works && (
                          <p className="text-xs text-gray-600 italic">Why: {q.why_this_works}</p>
                        )}
                        {q.listen_for && q.listen_for.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-600">Listen for:</p>
                            <ul className="list-disc list-inside text-xs text-gray-700">
                              {q.listen_for.map((item, j) => <li key={j}>{item}</li>)}
                            </ul>
                          </div>
                        )}
                        {q.follow_ups && q.follow_ups.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-600">Follow-ups:</p>
                            <ul className="list-disc list-inside text-xs text-gray-700">
                              {q.follow_ups.map((item, j) => <li key={j}>{item}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {section.what_not_to_ask && section.what_not_to_ask.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded space-y-2">
                    <p className="text-sm font-semibold text-red-700">❌ What NOT to Ask</p>
                    {section.what_not_to_ask.map((bad, i) => (
                      <div key={i} className="text-xs text-gray-700">
                        <p className="font-medium text-red-600">{bad.bad_question}</p>
                        <p className="text-gray-600 italic">Why: {bad.why_bad}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {post_interview_capture && (
        <section>
          <h3 className="decision-output__section-title">Post-Interview Capture</h3>
          <Card className="p-4 space-y-3 text-sm">
            {post_interview_capture.immediate_notes && post_interview_capture.immediate_notes.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-1">Immediate Notes to Capture</h5>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {post_interview_capture.immediate_notes.map((note, i) => <li key={i}>{note}</li>)}
                </ul>
              </div>
            )}
            {post_interview_capture.quality_checklist && (
              <div className="grid md:grid-cols-2 gap-3">
                {post_interview_capture.quality_checklist.good_signs && post_interview_capture.quality_checklist.good_signs.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-green-700 mb-1">✅ Good Interview Signs</p>
                    <ul className="list-disc list-inside text-xs text-gray-700">
                      {post_interview_capture.quality_checklist.good_signs.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {post_interview_capture.quality_checklist.bad_signs && post_interview_capture.quality_checklist.bad_signs.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-700 mb-1">❌ Bad Interview Signs</p>
                    <ul className="list-disc list-inside text-xs text-gray-700">
                      {post_interview_capture.quality_checklist.bad_signs.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card>
        </section>
      )}

      {extraSections.map(([key, val]) => {
        if (!val || typeof val !== 'object') return null;
        return (
          <section key={key}>
            <h3 className="decision-output__section-title">{formatLabel(key)}</h3>
            <Card className="p-4">
              <RenderKeyValue data={val as Record<string, unknown>} t={t} />
            </Card>
          </section>
        );
      })}
    </div>
  );
};

// ─── CustDev Insights Analyzer — Evidence helpers ─────────────────────────────

/**
 * Renders one item from an evidence_from_past (or similar) array.
 * Gives special treatment to `quote` (blockquote), `behavior` (headline),
 * `frequency` and `last_occurrence` (meta chips).
 * Any remaining keys are rendered as labelled rows.
 */
const EvidencePastItem: React.FC<{ item: Record<string, unknown>; index: number }> = ({ item, index }) => {
  const { quote, behavior, frequency, last_occurrence, ...rest } = item;

  return (
    <div className="p-3 rounded-lg border border-gray-100 bg-white shadow-sm space-y-2">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">#{index + 1}</p>

      {behavior && (
        <p className="text-sm text-gray-800 font-medium">{String(behavior)}</p>
      )}

      {(frequency || last_occurrence) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {frequency && (
            <p className="text-xs text-gray-500">
              <span className="font-semibold text-gray-600">Frequency: </span>{String(frequency)}
            </p>
          )}
          {last_occurrence && (
            <p className="text-xs text-gray-500">
              <span className="font-semibold text-gray-600">Last seen: </span>{String(last_occurrence)}
            </p>
          )}
        </div>
      )}

      {/* Any extra keys not explicitly handled above */}
      {Object.entries(rest).map(([k, v]) => (
        v != null && (
          <p key={k} className="text-xs text-gray-500">
            <span className="font-semibold text-gray-600 capitalize">{formatLabel(k)}: </span>
            {typeof v === 'object' ? JSON.stringify(v) : String(v)}
          </p>
        )
      ))}

      {quote && (
        <blockquote className="mt-1 pl-3 border-l-4 border-purple-300 bg-purple-50 rounded-r py-2 pr-2">
          <p className="text-sm text-purple-900 italic leading-relaxed">"{String(quote)}"</p>
        </blockquote>
      )}
    </div>
  );
};

/**
 * Recursively renders any evidence value without ever falling back to JSON.stringify.
 *
 * - primitive      → plain text
 * - string[]       → bulleted list
 * - object[] where items have behavior/quote → EvidencePastItem cards
 * - object[]       → generic left-bordered blocks
 * - object         → recurse key/value
 */
const EvidenceValue: React.FC<{ value: unknown }> = ({ value }) => {
  if (value == null) return null;

  if (typeof value !== 'object') {
    return <span className="text-gray-700">{String(value)}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-gray-400 italic">—</span>;

    const allPrimitive = value.every(v => v == null || typeof v !== 'object');
    if (allPrimitive) {
      return (
        <ul className="mt-1 space-y-1 list-none pl-0">
          {value.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="mt-0.5 text-blue-400 shrink-0">›</span>
              <span>{String(item ?? '—')}</span>
            </li>
          ))}
        </ul>
      );
    }

    // Detect evidence_from_past-style items (have behavior or quote key)
    const looksLikeEvidence = value.some(
      v => v != null && typeof v === 'object' && ('behavior' in v || 'quote' in v)
    );

    if (looksLikeEvidence) {
      return (
        <div className="mt-1 space-y-3">
          {value.map((item, i) =>
            item != null && typeof item === 'object' && !Array.isArray(item)
              ? <EvidencePastItem key={i} item={item as Record<string, unknown>} index={i} />
              : <p key={i} className="text-sm text-gray-700">{String(item)}</p>
          )}
        </div>
      );
    }

    // Generic array of objects
    return (
      <div className="mt-1 space-y-2">
        {value.map((item, i) => (
          <div key={i} className="pl-3 border-l-2 border-blue-200 space-y-0.5">
            {typeof item !== 'object' || item == null
              ? <p className="text-sm text-gray-700">{String(item)}</p>
              : Object.entries(item as Record<string, unknown>).map(([k, v]) => (
                  <p key={k} className="text-sm">
                    <span className="font-medium text-gray-500 capitalize mr-1">{formatLabel(k)}:</span>
                    <span className="text-gray-700">
                      {/* recurse so nested objects don't hit JSON.stringify */}
                      {typeof v === 'object'
                        ? <EvidenceValue value={v} />
                        : String(v ?? '—')}
                    </span>
                  </p>
                ))
            }
          </div>
        ))}
      </div>
    );
  }

  // Plain object → recurse
  return (
    <div className="mt-1 space-y-2 pl-2 border-l-2 border-gray-100">
      {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
        <div key={k}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{formatLabel(k)}</p>
          <EvidenceValue value={v} />
        </div>
      ))}
    </div>
  );
};

/**
 * One card per top-level evidence category with a colour-coded left border.
 */
const EVIDENCE_BORDER_COLORS: Record<string, string> = {
  confirmed: 'border-l-green-400',
  validated: 'border-l-green-400',
  refuted: 'border-l-red-400',
  invalidated: 'border-l-red-400',
  signals: 'border-l-blue-400',
  quotes: 'border-l-purple-400',
  pain_points: 'border-l-orange-400',
  problem_validation: 'border-l-amber-400',
  willingness_to_pay: 'border-l-emerald-400',
};

const EvidenceCard: React.FC<{ label: string; data: unknown }> = ({ label, data }) => {
  const colorClass = EVIDENCE_BORDER_COLORS[label.toLowerCase()] ?? 'border-l-gray-300';
  return (
    <Card className={`p-4 border-l-4 ${colorClass}`}>
      <h5 className="text-sm font-semibold text-gray-700 mb-3 capitalize">{formatLabel(label)}</h5>
      <EvidenceValue value={data} />
    </Card>
  );
};

// ─── CustDev Insights Analyzer (Analyzes Interview Data) ──────────────────────

interface HypothesisToDefine {
  type?: string;
  template?: string;
  status?: string;
  priority?: string;
}

interface AnalysisRoot {
  meta?: {
    startup_name?: string;
    product_stage?: string;
    target_market?: string;
    analysis_date?: string;
    analyst_note?: string;
  };
  interview_data_summary?: {
    status?: string;
    interviews_received?: number;
    interviews_analyzed?: number;
    assessment?: string;
  };
  evidence_extraction?: Record<string, unknown>;
  hypothesis_validation_analysis?: {
    hypotheses_provided?: number;
    status?: string;
    critical_gap?: string;
    hypotheses_that_need_to_be_defined?: HypothesisToDefine[];
  };
  interview_plan_compliance?: { status?: string; assessment?: string };
  pivot_or_persevere?: {
    recommendation?: string;
    reasoning?: string;
    confidence?: string;
    next_actions?: Array<{ action: string; timeline: string; priority: string }>;
  };
  innovation_accounting?: Record<string, unknown>;
}

interface InsightsAnalyzerRoot { analysis?: AnalysisRoot }

const CustdevInsightsAnalyzerOutput: React.FC<{ text: string; t: (k: string) => string }> = ({ text, t }) => {
  const parsed = parseJson(text) as InsightsAnalyzerRoot | null;
  const analysis = parsed?.analysis;

  if (!analysis) return <MarkdownOutput text={text} />;

  const { meta, interview_data_summary, evidence_extraction, hypothesis_validation_analysis, interview_plan_compliance, pivot_or_persevere } = analysis;

  return (
    <div className="decision-output decision-output--custdev-insights-analyzer space-y-8">
      {/* Meta */}
      {meta && (
        <section>
          <h3 className="decision-output__section-title">Analysis Meta</h3>
          <Card className="p-4 space-y-2 text-sm">
            {meta.startup_name && <p><span className="font-medium text-gray-600">Startup:</span> {meta.startup_name}</p>}
            {meta.product_stage && <p><span className="font-medium text-gray-600">Stage:</span> {meta.product_stage}</p>}
            {meta.target_market && <p><span className="font-medium text-gray-600">Target market:</span> {meta.target_market}</p>}
            {meta.analysis_date && <p><span className="font-medium text-gray-600">Date:</span> {meta.analysis_date}</p>}
            {meta.analyst_note && (
              <p className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded text-amber-800">{meta.analyst_note}</p>
            )}
          </Card>
        </section>
      )}

      {/* Interview data summary */}
      {interview_data_summary && (
        <section>
          <h3 className="decision-output__section-title">Interview Data Summary</h3>
          <Card className="p-4 space-y-2 text-sm">
            {interview_data_summary.status && (
              <p><span className="font-medium text-gray-600">Status:</span>{' '}
                <span className={interview_data_summary.status.startsWith('NO') ? 'text-red-600 font-medium' : 'text-gray-700'}>
                  {interview_data_summary.status}
                </span>
              </p>
            )}
            {interview_data_summary.interviews_received != null && (
              <p><span className="font-medium text-gray-600">Interviews received:</span> {interview_data_summary.interviews_received}</p>
            )}
            {interview_data_summary.interviews_analyzed != null && (
              <p><span className="font-medium text-gray-600">Interviews analyzed:</span> {interview_data_summary.interviews_analyzed}</p>
            )}
            {interview_data_summary.assessment && (
              <p className="mt-2 text-gray-700">{interview_data_summary.assessment}</p>
            )}
          </Card>
        </section>
      )}

      {/* Evidence extraction — uses EvidenceCard + EvidenceValue, never JSON.stringify */}
      {evidence_extraction && Object.keys(evidence_extraction).length > 0 && (
        <section>
          <h3 className="decision-output__section-title">Evidence Extraction</h3>
          <div className="space-y-4">
            {Object.entries(evidence_extraction).map(([key, val]) => {
              if (val == null) return null;
              return <EvidenceCard key={key} label={key} data={val} />;
            })}
          </div>
        </section>
      )}

      {/* Hypothesis validation */}
      {hypothesis_validation_analysis && (
        <section>
          <h3 className="decision-output__section-title">Hypothesis Validation Analysis</h3>
          <Card className="p-4 space-y-4">
            {hypothesis_validation_analysis.status && (
              <p className="text-sm font-medium">
                Status:{' '}
                <span className={hypothesis_validation_analysis.status.startsWith('NO') ? 'text-red-600' : 'text-gray-700'}>
                  {hypothesis_validation_analysis.status}
                </span>
              </p>
            )}
            {hypothesis_validation_analysis.critical_gap && (
              <p className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-sm">
                {hypothesis_validation_analysis.critical_gap}
              </p>
            )}
            {hypothesis_validation_analysis.hypotheses_that_need_to_be_defined &&
              hypothesis_validation_analysis.hypotheses_that_need_to_be_defined.length > 0 && (
                <div className="space-y-3">
                  <h5 className="text-sm font-semibold text-gray-700">Hypotheses That Need to Be Defined</h5>
                  {hypothesis_validation_analysis.hypotheses_that_need_to_be_defined.map((h, i) => (
                    <div key={i} className="p-3 border-l-4 border-amber-300 bg-amber-50/60 rounded-r space-y-1 text-sm">
                      {h.type && <p className="font-semibold text-gray-800 capitalize">{h.type}</p>}
                      {h.template && <p className="text-gray-700 italic">{h.template}</p>}
                      {h.priority && (
                        <p className={`font-medium ${h.priority.toLowerCase().includes('critical') ? 'text-red-600' : 'text-amber-700'}`}>
                          Priority: {h.priority}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </Card>
        </section>
      )}

      {/* Interview plan compliance */}
      {interview_plan_compliance && (
        <section>
          <h3 className="decision-output__section-title">Interview Plan Compliance</h3>
          <Card className="p-4 text-sm space-y-2">
            {interview_plan_compliance.status && (
              <p><span className="font-medium text-gray-600">Status:</span>{' '}
                <span className={interview_plan_compliance.status.startsWith('NO') ? 'text-red-600' : 'text-gray-700'}>
                  {interview_plan_compliance.status}
                </span>
              </p>
            )}
            {interview_plan_compliance.assessment && (
              <p className="text-gray-700">{interview_plan_compliance.assessment}</p>
            )}
          </Card>
        </section>
      )}

      {/* Pivot or Persevere */}
      {pivot_or_persevere && (
        <section>
          <h3 className="decision-output__section-title">Pivot or Persevere Decision</h3>
          <Card className="p-4 space-y-3">
            {pivot_or_persevere.recommendation && (
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {pivot_or_persevere.recommendation === 'PERSEVERE' ? '🎯' :
                   pivot_or_persevere.recommendation === 'PIVOT' ? '🔀' :
                   pivot_or_persevere.recommendation === 'ITERATE' ? '🔄' : '⛔'}
                </span>
                <div>
                  <p className="font-bold text-lg text-primary-text">{pivot_or_persevere.recommendation}</p>
                  {pivot_or_persevere.confidence && (
                    <p className="text-xs text-gray-600">Confidence: {pivot_or_persevere.confidence}</p>
                  )}
                </div>
              </div>
            )}
            {pivot_or_persevere.reasoning && (
              <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded">{pivot_or_persevere.reasoning}</p>
            )}
            {pivot_or_persevere.next_actions && pivot_or_persevere.next_actions.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-2">Next Actions</h5>
                <div className="space-y-2">
                  {pivot_or_persevere.next_actions.map((action, i) => (
                    <div key={i} className="p-2 bg-blue-50 rounded text-sm">
                      <p className="font-medium text-gray-800">{action.action}</p>
                      <p className="text-xs text-gray-600">Timeline: {action.timeline} • Priority: {action.priority}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </section>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const DecisionOutputView: React.FC<DecisionOutputViewProps> = ({ outputData, variant, fallback, t }) => {
  const text = extractText(outputData);

  if (text) {
    if (variant === 'hypothesis_generator') return <HypothesisGeneratorOutput text={text} t={t} />;
    if (variant === 'custdev_target_planner') return <CustdevTargetPlannerOutput text={text} t={t} />;
    if (variant === 'custdev_interview_designer') return <CustdevInterviewDesignerOutput text={text} t={t} />;
    if (variant === 'custdev_insights_analyzer') return <CustdevInsightsAnalyzerOutput text={text} t={t} />;
  }

  if (fallback) return <MarkdownOutput text={fallback} />;

  return (
    <div className="decision-output decision-output__empty text-gray-500 italic text-sm">
      {t('decisions.noOutput')}
    </div>
  );
};

export default DecisionOutputView;