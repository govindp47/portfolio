import React, { useState, useRef } from 'react';

interface MetricBadgeProps {
  value: string;
  label: string;
  tooltip: string;
  className?: string;
}

export const MetricBadge: React.FC<MetricBadgeProps> = ({
  value,
  label,
  tooltip,
  className = '',
}) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      setTooltipVisible(true);
    }, 200);
  };

  const handleMouseLeave = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setTooltipVisible(false);
  };

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-1)',
    cursor: 'default',
  };

  const valueStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--text-xl)',
    fontWeight: 'var(--font-weight-bold)',
    color: 'var(--color-accent)',
    lineHeight: 1,
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-weight-normal)',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  };

  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + var(--space-2))',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(10, 11, 15, 0.92)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    padding: 'var(--space-2) var(--space-3)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-secondary)',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    zIndex: 'var(--z-overlay)' as unknown as number,
    boxShadow: 'var(--shadow-glass)',
  };

  return (
    <div
      style={wrapperStyle}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span style={valueStyle}>{value}</span>
      <span style={labelStyle}>{label}</span>
      {tooltipVisible && <div style={tooltipStyle}>{tooltip}</div>}
    </div>
  );
};