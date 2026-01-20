import React from 'react';
import Card from './Card';

export type DecisionVariant = 'icp_diagnostician' | 'positioning' | 'channel_risk' | 'experiment' | 'decision_review';

interface RecommendationItem {
  category?: string;
  recommendation?: string;
  confidence?: string;
  rationale?: string;
}

interface IdealCustomerProfile {
  company_size?: string;
  industry?: string;
  role?: string;
  pain_points?: string[];
}

interface DecisionOutputViewProps {
  outputData: Record<string, unknown> | null | undefined;
  variant: DecisionVariant;
  /** Fallback when output_data is empty; e.g. content */
  fallback?: string | null;
  t: (key: string) => string;
}

const formatLabel = (key: string): string => {
  return key
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

/** Renders a generic object as key-value rows */
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
                  <li key={i}>{typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item)}</li>
                ))}
              </ul>
            </dd>
          </div>
        );
      }
      if (typeof v === 'object' && v !== null) {
        return (
          <div key={k}>
            <dt className="font-medium text-gray-700">{formatLabel(k)}</dt>
            <dd className="mt-1 text-gray-600">
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

/** ICP-specific: recommendations, ideal_customer_profile, next_steps */
const IcpDiagnosticianOutput: React.FC<{ data: Record<string, unknown>; t: (k: string) => string }> = ({ data, t }) => {
  const recommendations = (data.recommendations as RecommendationItem[] | undefined) ?? [];
  const icp = (data.ideal_customer_profile as IdealCustomerProfile | undefined) ?? {};
  const nextSteps = (data.next_steps as string[] | undefined) ?? [];

  return (
    <div className="decision-output decision-output--icp space-y-8">
      {/* 1. Recommendations */}
      {recommendations.length > 0 && (
        <section className="decision-output__section">
          <h3 className="decision-output__section-title">{t('decisions.icp.recommendations')}</h3>
          <div className="space-y-4">
            {recommendations.map((r, i) => (
              <Card key={i} className="p-4 decision-output__card">
                {r.category && <p className="font-semibold text-primary-text mb-2">{r.category}</p>}
                <p className="text-gray-700 mb-2">{r.recommendation}</p>
                {r.confidence && <p className="text-sm text-gray-500"><strong>{t('decisions.icp.confidence')}:</strong> {r.confidence}</p>}
                {r.rationale && <p className="text-sm text-gray-600 mt-2">{r.rationale}</p>}
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* 2. Ideal Customer Profile */}
      {(icp.company_size || icp.industry || icp.role || (icp.pain_points && icp.pain_points.length > 0)) && (
        <section className="decision-output__section">
          <h3 className="decision-output__section-title">{t('decisions.icp.idealCustomerProfile')}</h3>
          <Card className="p-4">
            <dl className="grid gap-3 sm:grid-cols-1">
              {icp.company_size && (
                <>
                  <dt className="font-medium text-gray-700">{t('decisions.icp.companySize')}</dt>
                  <dd className="text-gray-600">{icp.company_size}</dd>
                </>
              )}
              {icp.industry && (
                <>
                  <dt className="font-medium text-gray-700">{t('decisions.icp.industry')}</dt>
                  <dd className="text-gray-600">{icp.industry}</dd>
                </>
              )}
              {icp.role && (
                <>
                  <dt className="font-medium text-gray-700">{t('decisions.icp.role')}</dt>
                  <dd className="text-gray-600">{icp.role}</dd>
                </>
              )}
              {icp.pain_points && icp.pain_points.length > 0 && (
                <>
                  <dt className="font-medium text-gray-700">{t('decisions.icp.painPoints')}</dt>
                  <dd className="text-gray-600">
                    <ul className="list-disc list-inside space-y-1">
                      {icp.pain_points.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </dd>
                </>
              )}
            </dl>
          </Card>
        </section>
      )}

      {/* 3. Next Steps */}
      {nextSteps.length > 0 && (
        <section className="decision-output__section">
          <h3 className="decision-output__section-title">{t('decisions.icp.nextSteps')}</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            {nextSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
};

/** Resolve data: backend may put payload in output_data.output or at top level */
const resolveData = (outputData: Record<string, unknown> | null | undefined): Record<string, unknown> => {
  if (!outputData || typeof outputData !== 'object') return {};
  const o = (outputData as { output?: unknown }).output;
  if (o && typeof o === 'object' && o !== null) return o as Record<string, unknown>;
  return outputData;
};

// --- Positioning ---
interface ValueProposition {
  proposition?: string;
  target_segment?: string;
  proof_points?: string[];
}
interface MessagingFramework {
  primary_message?: string;
  supporting_messages?: string[];
}
const PositioningOutput: React.FC<{ data: Record<string, unknown>; t: (k: string) => string }> = ({ data, t }) => {
  const decisionType = (data.decision_type as string) || '';
  const statement = (data.positioning_statement as string) || '';
  const valueProps = (data.value_propositions as ValueProposition[]) ?? [];
  const messaging = (data.messaging_framework as MessagingFramework) ?? {};
  const nextSteps = (data.next_steps as string[]) ?? [];
  return (
    <div className="decision-output decision-output--positioning space-y-8">
      {statement && (
        <section className="decision-output__section">
          <h3 className="decision-output__section-title">{t('decisions.positioningView.positioningStatement')}</h3>
          <p className="text-gray-700">{statement}</p>
        </section>
      )}
      {valueProps.length > 0 && (
        <section className="decision-output__section">
          <h3 className="decision-output__section-title">{t('decisions.positioningView.valuePropositions')}</h3>
          <div className="space-y-4">
            {valueProps.map((v, i) => (
              <Card key={i} className="p-4 decision-output__card">
                {v.proposition && <p className="font-semibold text-primary-text mb-2">{v.proposition}</p>}
                {v.target_segment && <p className="text-sm text-gray-600 mb-2">{v.target_segment}</p>}
                {v.proof_points && v.proof_points.length > 0 && (
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    {v.proof_points.map((p, j) => <li key={j}>{p}</li>)}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}
      {(messaging.primary_message || (messaging.supporting_messages && messaging.supporting_messages.length > 0)) && (
        <section className="decision-output__section">
          <h3 className="decision-output__section-title">{t('decisions.positioningView.messagingFramework')}</h3>
          <Card className="p-4">
            {messaging.primary_message && <p className="font-medium text-gray-800 mb-2">{messaging.primary_message}</p>}
            {messaging.supporting_messages && messaging.supporting_messages.length > 0 && (
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {messaging.supporting_messages.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            )}
          </Card>
        </section>
      )}
      {nextSteps.length > 0 && (
        <section className="decision-output__section">
          <h3 className="decision-output__section-title">{t('decisions.positioningView.nextSteps')}</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">{nextSteps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </section>
      )}
    </div>
  );
};

// --- Channel Risk ---
interface ChannelAssessment {
  channel?: string;
  risk_level?: string;
  opportunity_score?: number;
  rationale?: string;
  estimated_cac?: string;
  recommended_priority?: number;
}
interface RiskFactor {
  factor?: string;
  impact?: string;
  mitigation?: string;
}
const ChannelRiskOutput: React.FC<{ data: Record<string, unknown>; t: (k: string) => string }> = ({ data, t }) => {
  const decisionType = (data.decision_type as string) || '';
  const assessments = (data.channel_assessments as ChannelAssessment[]) ?? [];
  const riskFactors = (data.risk_factors as RiskFactor[]) ?? [];
  const recommended = (data.recommended_channels as string[]) ?? [];
  const nextSteps = (data.next_steps as string[]) ?? [];
  return (
    <div className="decision-output decision-output--channel-risk space-y-8">
      {assessments.length > 0 && (
        <section className="decision-output__section">
          <h3 className="decision-output__section-title">{t('decisions.channelRiskView.channelAssessments')}</h3>
          <div className="space-y-4">
            {assessments.map((a, i) => (
              <Card key={i} className="p-4 decision-output__card">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {a.channel && <span className="font-semibold text-primary-text">{a.channel}</span>}
                  {a.risk_level != null && <span className="text-sm text-gray-500">{t('decisions.channelRiskView.riskLevel')}: {a.risk_level}</span>}
                  {a.opportunity_score != null && <span className="text-sm text-gray-500">{t('decisions.channelRiskView.opportunityScore')}: {a.opportunity_score}</span>}
                  {a.recommended_priority != null && <span className="text-sm text-gray-500">{t('decisions.channelRiskView.priority')}: {a.recommended_priority}</span>}
                </div>
                {a.rationale && <p className="text-gray-700 mb-1">{a.rationale}</p>}
                {a.estimated_cac && <p className="text-sm text-gray-600">{t('decisions.channelRiskView.estimatedCac')}: {a.estimated_cac}</p>}
              </Card>
            ))}
          </div>
        </section>
      )}
      {riskFactors.length > 0 && (
        <section className="decision-output__section">
          <h3 className="decision-output__section-title">{t('decisions.channelRiskView.riskFactors')}</h3>
          <div className="space-y-4">
            {riskFactors.map((r, i) => (
              <Card key={i} className="p-4 decision-output__card">
                {r.factor && <p className="font-semibold text-primary-text mb-2">{r.factor}</p>}
                {r.impact && <p className="text-gray-700 mb-1">{r.impact}</p>}
                {r.mitigation && <p className="text-sm text-gray-600">{t('decisions.channelRiskView.mitigation')}: {r.mitigation}</p>}
              </Card>
            ))}
          </div>
        </section>
      )}
      {recommended.length > 0 && (
        <section className="decision-output__section">
          <h3 className="decision-output__section-title">{t('decisions.channelRiskView.recommendedChannels')}</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-1">{recommended.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </section>
      )}
      {nextSteps.length > 0 && (
        <section className="decision-output__section">
          <h3 className="decision-output__section-title">{t('decisions.channelRiskView.nextSteps')}</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">{nextSteps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </section>
      )}
    </div>
  );
};

// --- Experiment ---
interface SuccessMetric {
  metric?: string;
  target?: string;
  measurement?: string;
}
interface ExperimentItem {
  experiment_id?: string;
  hypothesis?: string;
  methodology?: string;
  success_metrics?: SuccessMetric[];
  duration?: string;
  budget?: string;
  risk_level?: string;
}
interface PrioritizationItem {
  experiment_id?: string;
  priority?: number;
  rationale?: string;
}
const ExperimentOutput: React.FC<{ data: Record<string, unknown>; t: (k: string) => string }> = ({ data, t }) => {
  const decisionType = (data.decision_type as string) || '';
  const experiments = (data.experiments as ExperimentItem[]) ?? [];
  const prioritization = (data.prioritization as PrioritizationItem[]) ?? [];
  const nextSteps = (data.next_steps as string[]) ?? [];
  return (
    <div className="decision-output decision-output--experiment space-y-8">
      {experiments.length > 0 && (
        <section className="decision-output__section">
          <h3 className="decision-output__section-title">{t('decisions.experimentView.experiments')}</h3>
          <div className="space-y-4">
            {experiments.map((e, i) => (
              <Card key={i} className="p-4 decision-output__card">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {e.experiment_id && <span className="font-semibold text-primary-text">{e.experiment_id}</span>}
                  {e.duration != null && <span className="text-sm text-gray-500">{t('decisions.experimentView.duration')}: {e.duration}</span>}
                  {e.budget != null && <span className="text-sm text-gray-500">{t('decisions.experimentView.budget')}: {e.budget}</span>}
                  {e.risk_level != null && <span className="text-sm text-gray-500">{t('decisions.experimentView.riskLevel')}: {e.risk_level}</span>}
                </div>
                {e.hypothesis && <p className="font-medium text-gray-800 mb-2">{e.hypothesis}</p>}
                {e.methodology && <p className="text-gray-700 mb-2">{e.methodology}</p>}
                {e.success_metrics && e.success_metrics.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">{t('decisions.experimentView.successMetrics')}</p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                      {e.success_metrics.map((m, j) => (
                        <li key={j}>{m.metric} — {m.target} ({m.measurement})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}
      {prioritization.length > 0 && (
        <section className="decision-output__section">
          <h3 className="decision-output__section-title">{t('decisions.experimentView.prioritization')}</h3>
          <div className="space-y-2">
            {prioritization.map((p, i) => (
              <div key={i} className="flex gap-2 items-baseline">
                {p.experiment_id != null && <span className="font-medium text-primary-text w-12">{p.experiment_id}</span>}
                {p.priority != null && <span className="text-gray-500">#{p.priority}</span>}
                {p.rationale && <span className="text-gray-700">{p.rationale}</span>}
              </div>
            ))}
          </div>
        </section>
      )}
      {nextSteps.length > 0 && (
        <section className="decision-output__section">
          <h3 className="decision-output__section-title">{t('decisions.experimentView.nextSteps')}</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">{nextSteps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </section>
      )}
    </div>
  );
};

// --- Decision Review ---
interface RiskItem {
  risk?: string;
  severity?: string;
  mitigation?: string;
}
interface RecommendationItemDr {
  area?: string;
  recommendation?: string;
  priority?: string;
  impact?: string;
}
const DecisionReviewOutput: React.FC<{ data: Record<string, unknown>; t: (k: string) => string }> = ({ data, t }) => {
  const decisionType = (data.decision_type as string) || '';
  const score = data.decision_quality_score as number | undefined;
  const strengths = (data.strengths as string[]) ?? [];
  const weaknesses = (data.weaknesses as string[]) ?? [];
  const risks = (data.risks as RiskItem[]) ?? [];
  const recommendations = (data.recommendations as RecommendationItemDr[]) ?? [];
  const nextSteps = (data.next_steps as string[]) ?? [];
  return (
    <div className="decision-output decision-output--decision-review space-y-8">
      {score != null && (
        <section className="decision-output__section">
          <h3 className="decision-output__section-title">{t('decisions.decisionReviewView.qualityScore')}</h3>
          <p className="text-gray-700">{score}/10</p>
        </section>
      )}
      {strengths.length > 0 && (
        <section className="decision-output__section">
          <h3 className="decision-output__section-title">{t('decisions.decisionReviewView.strengths')}</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-1">{strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </section>
      )}
      {weaknesses.length > 0 && (
        <section className="decision-output__section">
          <h3 className="decision-output__section-title">{t('decisions.decisionReviewView.weaknesses')}</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-1">{weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </section>
      )}
      {risks.length > 0 && (
        <section className="decision-output__section">
          <h3 className="decision-output__section-title">{t('decisions.decisionReviewView.risks')}</h3>
          <div className="space-y-4">
            {risks.map((r, i) => (
              <Card key={i} className="p-4 decision-output__card">
                {r.risk && <p className="font-semibold text-primary-text mb-2">{r.risk}</p>}
                {r.severity != null && <p className="text-sm text-gray-500 mb-1">{t('decisions.decisionReviewView.severity')}: {r.severity}</p>}
                {r.mitigation && <p className="text-gray-700">{t('decisions.decisionReviewView.mitigation')}: {r.mitigation}</p>}
              </Card>
            ))}
          </div>
        </section>
      )}
      {recommendations.length > 0 && (
        <section className="decision-output__section">
          <h3 className="decision-output__section-title">{t('decisions.decisionReviewView.recommendations')}</h3>
          <div className="space-y-4">
            {recommendations.map((r, i) => (
              <Card key={i} className="p-4 decision-output__card">
                {r.area && <p className="font-semibold text-primary-text mb-2">{r.area}</p>}
                {r.recommendation && <p className="text-gray-700 mb-1">{r.recommendation}</p>}
                <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                  {r.priority != null && <span>{t('decisions.decisionReviewView.priority')}: {r.priority}</span>}
                  {r.impact != null && <span>{t('decisions.decisionReviewView.impact')}: {r.impact}</span>}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
      {nextSteps.length > 0 && (
        <section className="decision-output__section">
          <h3 className="decision-output__section-title">{t('decisions.decisionReviewView.nextSteps')}</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">{nextSteps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </section>
      )}
    </div>
  );
};

/** Generic: each top-level key as a step/section */
const GenericDecisionOutput: React.FC<{ data: Record<string, unknown>; t: (k: string) => string }> = ({ data, t }) => (
  <div className="decision-output decision-output--generic space-y-8">
    {Object.entries(data).map(([key, value], idx) => {
      if (value == null) return null;
      const title = formatLabel(key);
      return (
        <section key={key} className="decision-output__section">
          <h3 className="decision-output__section-title">
            {t('decisions.step')} {idx + 1}: {title}
          </h3>
          {Array.isArray(value) ? (
            value.every((v) => typeof v === 'string') ? (
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                {(value as string[]).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            ) : (
              <div className="space-y-4">
                {(value as unknown[]).map((item, i) =>
                  typeof item === 'object' && item !== null && !Array.isArray(item) ? (
                    <Card key={i} className="p-4">
                      <RenderKeyValue data={item as Record<string, unknown>} t={t} />
                    </Card>
                  ) : (
                    <div key={i} className="text-gray-700">
                      {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                    </div>
                  )
                )}
              </div>
            )
          ) : typeof value === 'object' && value !== null ? (
            <Card className="p-4">
              <RenderKeyValue data={value as Record<string, unknown>} t={t} />
            </Card>
          ) : (
            <p className="text-gray-700">{String(value)}</p>
          )}
        </section>
      );
    })}
  </div>
);

const DecisionOutputView: React.FC<DecisionOutputViewProps> = ({ outputData, variant, fallback, t }) => {
  if (outputData && Object.keys(outputData).length > 0) {
    const data = resolveData(outputData);
    const hasData = data && Object.keys(data).length > 0;
    if (hasData) {
      if (variant === 'icp_diagnostician') return <IcpDiagnosticianOutput data={data} t={t} />;
      if (variant === 'positioning') return <PositioningOutput data={data} t={t} />;
      if (variant === 'channel_risk') return <ChannelRiskOutput data={data} t={t} />;
      if (variant === 'experiment') return <ExperimentOutput data={data} t={t} />;
      if (variant === 'decision_review') return <DecisionReviewOutput data={data} t={t} />;
    }
    return <GenericDecisionOutput data={outputData} t={t} />;
  }

  if (fallback) {
    return (
      <div className="decision-output decision-output--fallback">
        <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded">
          {fallback}
        </pre>
      </div>
    );
  }

  return (
    <div className="decision-output decision-output__empty text-gray-500 italic">
      {t('decisions.noOutput')}
    </div>
  );
};

export default DecisionOutputView;
