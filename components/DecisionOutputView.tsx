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

/**
 * All 4 variants share the same envelope shape:
 *   output_data.content[0].text  → the real payload (markdown or JSON string)
 *
 * The `content` field on the root object is a Python-repr string like:
 *   "{'content': [{'type': 'text', 'text': '...'}]}"
 * We never need that — output_data is already properly parsed JSON.
 */
function extractText(outputData: Record<string, unknown> | null | undefined): string | null {
  if (!outputData) return null;

  // Primary path: output_data.content[].text  (already-parsed JSON array)
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

/**
 * Parses JSON from text, repairing truncated responses from the API.
 *
 * The API responses are often cut off mid-JSON (no closing brackets).
 * Strategy:
 *   1. Strip ```json ... ``` fence if present
 *   2. Try parsing as-is (works for complete responses)
 *   3. Repair by closing unclosed strings, arrays, and objects, then parse again
 */
function parseJson(text: string): unknown {
  const trimmed = text.trim();

  // Extract the raw JSON portion
  let raw = trimmed;
  const fenceMatch = trimmed.match(/^```(?:json)?\s*\n([\s\S]*)$/);
  if (fenceMatch) {
    // Strip trailing fence if present, keep if truncated (no closing fence = truncated)
    raw = fenceMatch[1].replace(/\n?```\s*$/, '').trim();
  } else {
    const start = trimmed.indexOf('{');
    if (start !== -1) raw = trimmed.slice(start);
  }

  // 1. Try as-is (complete response)
  try { return JSON.parse(raw); } catch { /* fall through to repair */ }

  // 2. Repair truncated JSON
  // Walk character-by-character tracking string/bracket state
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

  // Close any unclosed string
  if (inString) repaired += '"';

  // Remove trailing incomplete key-value pairs that would be invalid JSON:
  //   , "key": "partial_value    ← mid-value truncation
  //   , "key":                   ← key with no value
  //   , "key"                    ← dangling key
  //   ,                          ← trailing comma
  repaired = repaired.replace(/,\s*"[^"]*"?\s*:\s*"[^"]*$/, '');
  repaired = repaired.replace(/,\s*"[^"]*"?\s*:\s*$/, '');
  repaired = repaired.replace(/,\s*"[^"]*"?\s*$/, '');
  repaired = repaired.replace(/,\s*$/, '');

  // Close all unclosed brackets/braces in reverse open order
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

// ─── Markdown Renderer (hypothesis_generator) ────────────────────────────────

/**
 * Renders the raw markdown text output from hypothesis_generator.
 * Handles: # headings, **bold**, > blockquotes, - lists, | tables, --- dividers.
 */
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

    // H1
    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-2xl font-bold text-gray-900 mt-6 mb-3 pb-2 border-b border-gray-200">{renderInline(line.slice(2))}</h1>);
    }
    // H2
    else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-xl font-semibold text-gray-800 mt-6 mb-2">{renderInline(line.slice(3))}</h2>);
    }
    // H3
    else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-base font-semibold text-gray-700 mt-4 mb-1">{renderInline(line.slice(4))}</h3>);
    }
    // Divider
    else if (line.trim() === '---') {
      elements.push(<hr key={i} className="my-4 border-gray-200" />);
    }
    // Blockquote
    else if (line.startsWith('> ')) {
      const content = line.slice(2);
      const isWarning = content.includes('⚠️') || content.toLowerCase().includes('critical') || content.toLowerCase().includes('risk');
      elements.push(
        <blockquote key={i} className={`my-3 px-4 py-3 rounded-r border-l-4 text-sm ${isWarning ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-blue-400 bg-blue-50 text-blue-800'}`}>
          {renderInline(content)}
        </blockquote>
      );
    }
    // Table
    else if (line.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(<React.Fragment key={i}>{renderMarkdownTable(tableLines)}</React.Fragment>);
      continue;
    }
    // Unordered list
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
    // Non-empty paragraph
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
      {/* Context Analysis */}
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

      {/* Hypothesis */}
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

      {/* Segments */}
      {segments.length > 0 && (
        <section>
          <h3 className="decision-output__section-title">Primary Target Segments</h3>
          <div className="space-y-6">
            {segments.map((seg, i) => (
              <Card key={seg.segment_id ?? i} className="p-5 space-y-4">
                {/* Header */}
                {(seg.segment_name || seg.segment_id != null) && (
                  <h4 className="text-base font-semibold text-primary-text">
                    {seg.segment_id != null && `${seg.segment_id}. `}{seg.segment_name ?? 'Segment'}
                  </h4>
                )}
                {seg.description && <p className="text-gray-700 text-sm">{seg.description}</p>}

                {/* Why early adopters */}
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

                {/* Specific characteristics */}
                {seg.specific_characteristics && seg.specific_characteristics.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Specific Characteristics</h5>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {seg.specific_characteristics.map((c, j) => <li key={j}>{c}</li>)}
                    </ul>
                  </div>
                )}

                {/* Where to find them */}
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

                {/* Screening criteria */}
                {seg.screening_criteria_must_have && seg.screening_criteria_must_have.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Screening Criteria (Must Have)</h5>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {seg.screening_criteria_must_have.map((c, j) => <li key={j}>{c}</li>)}
                    </ul>
                  </div>
                )}

                {/* Red flags */}
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
  innovation_accounting?: Record<string, unknown>;
}

interface InterviewDesignerRoot { analysis?: AnalysisRoot }

const CustdevInterviewDesignerOutput: React.FC<{ text: string; t: (k: string) => string }> = ({ text, t }) => {
  const parsed = parseJson(text) as InterviewDesignerRoot | null;
  const analysis = parsed?.analysis;

  if (!analysis) return <MarkdownOutput text={text} />;

  const { meta, interview_data_summary, evidence_extraction, hypothesis_validation_analysis, interview_plan_compliance } = analysis;

  return (
    <div className="decision-output decision-output--custdev-interview-designer space-y-8">
      {/* Meta */}
      {meta && (
        <section>
          <h3 className="decision-output__section-title">Meta</h3>
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

      {/* Evidence extraction */}
      {evidence_extraction && Object.keys(evidence_extraction).length > 0 && (
        <section>
          <h3 className="decision-output__section-title">Evidence Extraction</h3>
          <div className="space-y-4">
            {Object.entries(evidence_extraction).map(([key, val]) => {
              if (val == null || typeof val !== 'object') return null;
              return (
                <Card key={key} className="p-4">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">{formatLabel(key)}</h5>
                  <RenderKeyValue data={val as Record<string, unknown>} t={t} />
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Hypothesis validation */}
      {hypothesis_validation_analysis && (
        <section>
          <h3 className="decision-output__section-title">Hypothesis Validation</h3>
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
                      {h.type && <p className="font-semibold text-gray-800">{h.type}</p>}
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
    </div>
  );
};

// ─── CustDev Insights Analyzer (Interview Guide) ──────────────────────────────

interface RiskItem {
  risk_id?: string;
  category?: string;
  description?: string;
  severity?: string;
  likelihood?: string;
  mitigation?: string;
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
      hypothesis_being_tested?: string;
      target_segment?: string;
      interview_goal?: string;
      duration?: string;
      format?: string;
      language?: string;
      product_name?: string;
      product_stage?: string;
      target_market?: string;
      methodology?: string;
    };
    risk_assessment?: {
      overall_risk_level?: string;
      risks?: RiskItem[];
      critical_risks?: RiskItem[];
    };
    pre_interview_preparation?: { what_you_are_actually_testing?: string[] };
    recommended_approach?: {
      phase?: string;
      rationale?: string;
      interview_batches?: InterviewBatch[];
    };
    [key: string]: unknown; // for batch_1_interview_guide etc.
  };
}

const severityColor = (s?: string) => {
  const l = (s ?? '').toLowerCase();
  if (l === 'critical') return 'border-red-500 bg-red-50';
  if (l === 'high') return 'border-orange-400 bg-orange-50';
  return 'border-yellow-300 bg-yellow-50';
};

const CustdevInsightsAnalyzerOutput: React.FC<{ text: string; t: (k: string) => string }> = ({ text, t }) => {
  const parsed = parseJson(text) as InterviewGuideRoot | null;
  const guide = parsed?.interview_guide;

  if (!guide) return <MarkdownOutput text={text} />;

  const { metadata, risk_assessment, pre_interview_preparation, recommended_approach } = guide;
  const risks = risk_assessment?.risks ?? risk_assessment?.critical_risks ?? [];

  // Any extra top-level keys (e.g. batch_1_interview_guide)
  const extraSections = Object.entries(guide).filter(
    ([k]) => !['metadata', 'risk_assessment', 'pre_interview_preparation', 'recommended_approach'].includes(k)
  );

  return (
    <div className="decision-output decision-output--custdev-insights-analyzer space-y-8">
      {/* Metadata */}
      {metadata && (
        <section>
          <h3 className="decision-output__section-title">Interview Guide Metadata</h3>
          <Card className="p-4 space-y-2 text-sm">
            {metadata.hypothesis_being_tested && (
              <p><span className="font-medium text-gray-600">Hypothesis:</span> {metadata.hypothesis_being_tested}</p>
            )}
            {metadata.target_segment && (
              <p><span className="font-medium text-gray-600">Target segment:</span> {metadata.target_segment}</p>
            )}
            {metadata.interview_goal && (
              <p><span className="font-medium text-gray-600">Goal:</span> {metadata.interview_goal}</p>
            )}
            {metadata.duration && <p><span className="font-medium text-gray-600">Duration:</span> {metadata.duration}</p>}
            {metadata.format && <p><span className="font-medium text-gray-600">Format:</span> {metadata.format}</p>}
            {metadata.language && <p><span className="font-medium text-gray-600">Language:</span> {metadata.language}</p>}
          </Card>
        </section>
      )}

      {/* Risk Assessment */}
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
                    <span className={`ml-auto text-xs font-bold uppercase px-2 py-0.5 rounded ${r.severity === 'critical' ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'}`}>
                      {r.severity}
                    </span>
                  )}
                </div>
                {r.description && <p className="text-gray-700">{r.description}</p>}
                {r.mitigation && (
                  <p className="text-gray-700"><span className="font-medium">Mitigation:</span> {r.mitigation}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pre-interview Preparation */}
      {pre_interview_preparation?.what_you_are_actually_testing &&
        pre_interview_preparation.what_you_are_actually_testing.length > 0 && (
          <section>
            <h3 className="decision-output__section-title">Pre-Interview Preparation</h3>
            <Card className="p-4">
              <h5 className="text-sm font-semibold text-gray-700 mb-2">What You Are Actually Testing</h5>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {pre_interview_preparation.what_you_are_actually_testing.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </Card>
          </section>
        )}

      {/* Recommended Approach */}
      {recommended_approach && (
        <section>
          <h3 className="decision-output__section-title">Recommended Approach</h3>
          <Card className="p-4 space-y-4">
            {recommended_approach.phase && (
              <p className="font-semibold text-primary-text">{recommended_approach.phase}</p>
            )}
            {recommended_approach.rationale && (
              <p className="text-sm text-gray-700">{recommended_approach.rationale}</p>
            )}
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

      {/* Extra sections (e.g. batch_1_interview_guide) */}
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

// ─── Main Component ───────────────────────────────────────────────────────────

const DecisionOutputView: React.FC<DecisionOutputViewProps> = ({ outputData, variant, fallback, t }) => {
  // 1. Extract the real text payload from output_data.content[].text
  const text = extractText(outputData);

  // 2. If we have text, dispatch to the right renderer
  if (text) {
    if (variant === 'hypothesis_generator') return <MarkdownOutput text={text} />;
    if (variant === 'custdev_target_planner') return <CustdevTargetPlannerOutput text={text} t={t} />;
    if (variant === 'custdev_interview_designer') return <CustdevInterviewDesignerOutput text={text} t={t} />;
    if (variant === 'custdev_insights_analyzer') return <CustdevInsightsAnalyzerOutput text={text} t={t} />;
  }

  // 3. Fallback: render raw string as markdown
  if (fallback) return <MarkdownOutput text={fallback} />;

  // 4. Nothing to show
  return (
    <div className="decision-output decision-output__empty text-gray-500 italic text-sm">
      {t('decisions.noOutput')}
    </div>
  );
};

export default DecisionOutputView;