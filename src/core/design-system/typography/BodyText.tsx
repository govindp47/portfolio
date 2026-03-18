import React from 'react';

interface BodyTextProps {
  children: React.ReactNode;
  className?: string;
  muted?: boolean;
}

export const BodyText: React.FC<BodyTextProps> = ({
  children,
  className = '',
  muted = false,
}) => {
  const style: React.CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-base)',
    color: muted ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
    lineHeight: 1.6,
  };

  return (
    <p style={style} className={className}>
      {children}
    </p>
  );
};