import React from 'react';

interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  children,
  className = '',
}) => {
  const style: React.CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-weight-bold)',
    color: 'var(--color-text-primary)',
    paddingBottom: 'var(--space-3)',
    borderBottom: '1px solid var(--color-border)',
    margin: 0,
  };

  return (
    <h2 style={style} className={className}>
      {children}
    </h2>
  );
};