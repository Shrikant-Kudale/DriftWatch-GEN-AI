import React from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '', color }) => {
  const pixelSize = size === 'sm' ? '14px' : size === 'lg' ? '22px' : '16px';

  return (
    <span
      className={`spinner ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        borderColor: color ? `${color} transparent ${color} ${color}` : undefined,
      }}
      aria-label="Loading..."
      role="status"
    />
  );
};
