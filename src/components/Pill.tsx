import React from 'react';

export interface PillProps {
  status: 'green' | 'amber' | 'red' | 'neutral';
  label: string;
  tooltip?: string;
  className?: string;
}

export const Pill: React.FC<PillProps> = ({ status, label, tooltip, className = '' }) => {
  const statusClass = `pill-${status}`;

  return (
    <span
      className={`pill ${statusClass} ${className}`}
      title={tooltip}
      role="status"
    >
      <span className="pill-dot" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};
