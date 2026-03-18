import React from 'react';

interface DismissButtonProps {
  onClick: () => void;
  ariaLabel: string;
  className?: string;
}

export const DismissButton: React.FC<DismissButtonProps> = ({
  onClick,
  ariaLabel,
  className = '',
}) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.75rem',
    height: '1.75rem',
    borderRadius: 'var(--radius-sm)',
    background: 'transparent',
    border: 'none',
    color: 'var(--color-text-muted)',
    fontSize: 'var(--text-base)',
    cursor: 'pointer',
    transition: 'color var(--duration-fast) ease',
    padding: 0,
    lineHeight: 1,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.color = 'var(--color-accent)';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.color = 'var(--color-text-muted)';
  };

  return (
    <button
      style={baseStyle}
      onClick={onClick}
      aria-label={ariaLabel}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      ×
    </button>
  );
};