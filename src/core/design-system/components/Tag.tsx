import React from 'react';

interface TagProps {
  label: string;
  className?: string;
}

export const Tag: React.FC<TagProps> = ({ label, className = '' }) => {
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: 'var(--space-1) var(--space-3)',
    borderRadius: 'var(--radius-full)',
    background: 'var(--color-surface)',
    color: 'var(--color-text-secondary)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-weight-medium)',
    border: '1px solid var(--color-border)',
    userSelect: 'none',
  };

  return (
    <span style={style} className={className}>
      {label}
    </span>
  );
};