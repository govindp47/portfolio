import React from 'react';

interface ActionButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
}) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-weight-medium)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    pointerEvents: disabled ? 'none' : undefined,
    opacity: disabled ? 0.4 : 1,
    transition:
      'box-shadow var(--duration-fast) ease, background var(--duration-fast) ease',
    outline: 'none',
  };

  const primaryStyle: React.CSSProperties = {
    ...baseStyle,
    background: 'var(--color-accent)',
    color: '#0a0b0f',
    border: 'none',
  };

  const secondaryStyle: React.CSSProperties = {
    ...baseStyle,
    background: 'transparent',
    color: 'var(--color-accent)',
    border: '1px solid var(--color-accent)',
  };

  const style = variant === 'primary' ? primaryStyle : secondaryStyle;

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.currentTarget.style.boxShadow =
      variant === 'primary'
        ? 'var(--glow-accent-strong)'
        : 'var(--glow-accent)';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <button
      style={style}
      onClick={onClick}
      disabled={disabled}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </button>
  );
};