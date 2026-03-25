import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { GlassPanel, SectionHeading, ActionButton } from '@/core/design-system/components'
import { BodyText, MonoText } from '@/core/design-system/typography'
import { useMeta } from '@/core/hooks/useContent'
import { useReducedMotion } from '@/core/hooks/useReducedMotion'
import { useMode } from '@/core/hooks/useMode'
import { zoneEntryVariants } from '@/core/utils/animationVariants'

export default function GatewayZone() {
  const meta          = useMeta()
  const reducedMotion = useReducedMotion()
  const { capabilities } = useMode()

  const [copied, setCopied]       = useState(false)
  const dismissTimerRef           = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEmailCopy = useCallback(() => {
    if (!meta) return
    navigator.clipboard.writeText(meta.contact.email).then(() => {
      setCopied(true)
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = setTimeout(() => setCopied(false), 2000)
    })
  }, [meta])

  const motionProps = reducedMotion || !capabilities.animationsEnabled
    ? {}
    : {
        variants: zoneEntryVariants,
        initial:  'initial' as const,
        animate:  'animate' as const,
        exit:     'exit'    as const,
      }

  if (meta === null) {
    return (
      <motion.div style={outerStyle} {...motionProps}>
        <GlassPanel elevated>
          <div style={panelStyle} />
        </GlassPanel>
      </motion.div>
    )
  }

  return (
    <motion.div style={outerStyle} {...motionProps}>
      <GlassPanel elevated bordered>
        <div style={panelStyle}>

          {/* Header */}
          <SectionHeading>Gateway</SectionHeading>
          <BodyText muted>
            <span style={{ fontSize: 'var(--text-sm)' }}>
              Connect, collaborate, or just say hello.
            </span>
          </BodyText>

          <div style={dividerStyle} />

          {/* Social Links */}
          <section style={sectionStyle}>
            <span style={sectionLabelStyle}>Social</span>
            <div style={linkRowStyle}>
              <a
                href={meta.links.github}
                target="_blank"
                rel="noopener noreferrer"
                style={externalLinkStyle}
                aria-label="GitHub profile"
              >
                GitHub →
              </a>
              <a
                href={meta.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                style={externalLinkStyle}
                aria-label="LinkedIn profile"
              >
                LinkedIn →
              </a>
            </div>
          </section>

          <div style={dividerStyle} />

          {/* Contact */}
          <section style={sectionStyle}>
            <span style={sectionLabelStyle}>Contact</span>
            {meta.contact.preferCopy ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <ActionButton variant="secondary" onClick={handleEmailCopy}>
                  Copy Email
                </ActionButton>
                {copied && (
                  <MonoText size="xs">
                    <span style={{ color: 'var(--color-success)' }}>Copied!</span>
                  </MonoText>
                )}
              </div>
            ) : (
              <a
                href={`mailto:${meta.contact.email}`}
                style={externalLinkStyle}
                aria-label={`Email ${meta.contact.email}`}
              >
                {meta.contact.email} →
              </a>
            )}
          </section>

          <div style={dividerStyle} />

          {/* Resume */}
          <section style={sectionStyle}>
            <span style={sectionLabelStyle}>Resume</span>
            <a
              href={meta.resumeAssetPath}
              download
              style={resumeLinkStyle}
              aria-label="Download resume PDF"
            >
              Download Resume (PDF)
            </a>
          </section>

        </div>
      </GlassPanel>
    </motion.div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const outerStyle: React.CSSProperties = {
  width:          '100%',
  height:         '100%',
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  padding:        'var(--space-8)',
  boxSizing:      'border-box',
}

const panelStyle: React.CSSProperties = {
  padding:       'var(--space-8)',
  display:       'flex',
  flexDirection: 'column',
  gap:           'var(--space-4)',
  minWidth:      '300px',
  maxWidth:      '420px',
}

const dividerStyle: React.CSSProperties = {
  height:     '1px',
  background: 'var(--color-border)',
}

const sectionStyle: React.CSSProperties = {
  display:       'flex',
  flexDirection: 'column',
  gap:           'var(--space-3)',
}

const sectionLabelStyle: React.CSSProperties = {
  fontFamily:    'var(--font-mono)',
  fontSize:      'var(--text-xs)',
  color:         'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

const linkRowStyle: React.CSSProperties = {
  display:       'flex',
  flexDirection: 'column',
  gap:           'var(--space-2)',
}

const externalLinkStyle: React.CSSProperties = {
  fontFamily:     'var(--font-sans)',
  fontSize:       'var(--text-base)',
  color:          'var(--color-accent)',
  textDecoration: 'none',
  cursor:         'pointer',
}

const resumeLinkStyle: React.CSSProperties = {
  display:        'inline-flex',
  alignItems:     'center',
  padding:        'var(--space-2) var(--space-4)',
  background:     'var(--color-accent)',
  color:          '#0a0b0f',
  fontFamily:     'var(--font-sans)',
  fontSize:       'var(--text-sm)',
  fontWeight:     'var(--font-weight-medium)',
  borderRadius:   'var(--radius-md)',
  textDecoration: 'none',
  cursor:         'pointer',
}