import React from 'react';

interface MonoTextProps {
  children: React.ReactNode;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

const sizeMap: Record<NonNullable<MonoTextProps['size']>, string> = {
  xs: 'var(--text-xs)',
  sm: 'var(--text-sm)',
  md: 'var(--text-base)',
};

export const MonoText: React.FC<MonoTextProps> = ({
  children,
  className = '',
  size = 'sm',
}) => {
  const style: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: sizeMap[size],
    color: 'var(--color-text-primary)',
  };

  return (
    <span style={style} className={className}>
      {children}
    </span>
  );
};