import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:             'var(--color-bg)',
        surface:        'var(--color-surface)',
        accent:         'var(--color-accent)',
        'accent-muted': 'var(--color-accent-muted)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary':'var(--color-text-secondary)',
        'text-muted':   'var(--color-text-muted)',
        border:         'var(--color-border)',
        'border-glow':  'var(--color-border-glow)',
        error:          'var(--color-error)',
        success:        'var(--color-success)',
      },
      fontFamily: {
        mono: 'var(--font-mono)',
        sans: 'var(--font-sans)',
      },
      fontSize: {
        xs:   'var(--text-xs)',
        sm:   'var(--text-sm)',
        base: 'var(--text-base)',
        lg:   'var(--text-lg)',
        xl:   'var(--text-xl)',
        '2xl':'var(--text-2xl)',
      },
      spacing: {
        1:  'var(--space-1)',
        2:  'var(--space-2)',
        3:  'var(--space-3)',
        4:  'var(--space-4)',
        5:  'var(--space-5)',
        6:  'var(--space-6)',
        8:  'var(--space-8)',
        10: 'var(--space-10)',
        12: 'var(--space-12)',
        16: 'var(--space-16)',
      },
      borderRadius: {
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        'glow-accent':        'var(--glow-accent)',
        'glow-accent-strong': 'var(--glow-accent-strong)',
        glass:                'var(--shadow-glass)',
      },
      transitionDuration: {
        fast:   'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow:   'var(--duration-slow)',
      },
      zIndex: {
        ambient: 'var(--z-ambient)',
        zone:    'var(--z-zone)',
        hud:     'var(--z-hud)',
        overlay: 'var(--z-overlay)',
      },
    },
  },
  plugins: [],
}

export default config