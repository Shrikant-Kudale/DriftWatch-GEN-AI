import React from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  badge?: { label: string; status: 'green' | 'amber' | 'red' | 'neutral' };
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, subtext, badge }) => {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="stat-card-label">{label}</span>
        {badge && (
          <span
            className={`pill pill-${badge.status}`}
            style={{ fontSize: '0.75rem', padding: '2px 8px' }}
          >
            {badge.label}
          </span>
        )}
      </div>
      <span className="stat-card-value">{value}</span>
      {subtext && <span className="stat-card-subtext">{subtext}</span>}
    </div>
  );
};
