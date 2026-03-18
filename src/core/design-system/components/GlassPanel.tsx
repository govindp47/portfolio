import React from 'react';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  bordered?: boolean;
}

/**
 * GlassPanel — primary container primitive for all zones.
 *
 * BROWSER COMPATIBILITY NOTE:
 * backdrop-filter is applied for glassmorphism. Do NOT add transform: translateZ(0)
 * directly to GlassPanel — it creates a new stacking context that breaks backdrop-filter
 * blur in Safari and some Chromium builds. If you need GPU-compositing on a parent,
 * apply it to a wrapper element outside GlassPanel, not on GlassPanel itself.
 */
export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = '',
  elevated = false,
  bordered = false,
}) => {
  const baseStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(12px) saturate(180%)',
    WebkitBackdropFilter: 'blur(12px) saturate(180%)',
    border: `1px solid ${bordered ? 'var(--color-border-glow)' : 'var(--color-border)'}`,
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    boxShadow: elevated ? 'var(--shadow-glass)' : undefined,
  };

  return (
    <div style={baseStyle} className={className}>
      {children}
    </div>
  );
};