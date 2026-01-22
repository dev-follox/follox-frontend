import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const TOOL_IDS = ['icp', 'positioning', 'channelRisk', 'experiment', 'decisionReview'] as const;

const ToolsOverviewBlock: React.FC = () => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<(typeof TOOL_IDS)[number]>('icp');

  return (
    <div className="landing-tools">
      <div className="landing-tools__buttons">
        {TOOL_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className={`landing-tools__btn ${selected === id ? 'landing-tools__btn--active' : ''}`}
            onClick={() => setSelected(id)}
          >
            {t(`landing.tools.${id}.name`)}
          </button>
        ))}
      </div>
      <div className="landing-tools__content">
        <div className="landing-tools__info">
          <h3 className="landing-tools__heading">{t(`landing.tools.${selected}.heading`)}</h3>
          <p className="landing-tools__para">{t(`landing.tools.${selected}.para1`)}</p>
          {t(`landing.tools.${selected}.para2`) && (
            <p className="landing-tools__para">{t(`landing.tools.${selected}.para2`)}</p>
          )}
        </div>
        <div className="landing-tools__screenshot">
          {/* Space for screenshot per tool */}
        </div>
      </div>
    </div>
  );
};

export default ToolsOverviewBlock;
