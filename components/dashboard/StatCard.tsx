import React from 'react';
import type { LucideIcon } from 'lucide-react';

/** Matches landing demo modal stat tiles (icon + label + mono value). */
const StatCard: React.FC<{ label: string; value: string; icon: LucideIcon }> = ({ label, value, icon: Icon }) => {
  return (
    <div className="border border-border bg-card p-4">
      <div className="mb-1 flex items-center gap-2 text-xs text-secondary-alpha">
        <Icon className="h-3.5 w-3.5 text-stone" strokeWidth={1.5} />
        {label}
      </div>
      <div className="font-mono text-lg font-bold tracking-tight text-foreground">{value}</div>
    </div>
  );
};

export default StatCard;
