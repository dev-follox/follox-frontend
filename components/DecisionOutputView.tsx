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
                {r.category && <p className="font-semibold text-primary mb-2">{r.category}</p>}
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

      {/* Any extra keys in output_data */}
      {(() => {
        const known = new Set(['recommendations', 'ideal_customer_profile', 'next_steps']);
        const rest: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(data)) {
          if (!known.has(k) && v != null) rest[k] = v;
        }
        if (Object.keys(rest).length === 0) return null;
        return (
          <section className="decision-output__section">
            <h3 className="decision-output__section-title">{t('decisions.extra')}</h3>
            <Card className="p-4">
              <RenderKeyValue data={rest} t={t} />
            </Card>
          </section>
        );
      })()}
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
    if (variant === 'icp_diagnostician') {
      return <IcpDiagnosticianOutput data={outputData} t={t} />;
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
