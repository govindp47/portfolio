import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import GatewayZone from '../GatewayZone'

// ── Mock store hooks ──────────────────────────────────────────────────────────

const mockMeta = {
  name:    'Govind',
  version: '3.0',
  role:    'Software Engineer',
  stack:   'Kotlin | Android | Go',
  metrics: [],
  contact: { email: 'test@example.com', preferCopy: true },
  links:   { github: 'https://github.com/test', linkedin: 'https://linkedin.com/in/test' },
  resumeAssetPath: '/resume.pdf',
}

vi.mock('@/core/hooks/useContent', () => ({
  useMeta: vi.fn(() => mockMeta),
}))

vi.mock('@/core/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => true),
}))

vi.mock('@/core/hooks/useMode', () => ({
  useMode: vi.fn(() => ({
    activeMode: 'explorer',
    isMobile: false,
    capabilities: {
      ambientActive: true,
      gameLayerActive: true,
      animationsEnabled: true,
      animationLevel: 'full',
      miniMapAvailable: true,
    },
  })),
}))

import { useMeta } from '@/core/hooks/useContent'

// ── Clipboard mock ────────────────────────────────────────────────────────────

const writeTextMock = vi.fn(() => Promise.resolve())
beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value:      { writeText: writeTextMock },
    writable:   true,
    configurable: true,
  })
  vi.useFakeTimers()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  writeTextMock.mockReset()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GatewayZone — null meta guard', () => {
  it('renders without crashing when meta is null', () => {
    vi.mocked(useMeta).mockReturnValueOnce(null)
    const { container } = render(<GatewayZone />)
    expect(container.firstChild).toBeTruthy()
  })
})

describe('GatewayZone — GitHub link', () => {
  it('renders GitHub link with correct href', () => {
    render(<GatewayZone />)
    const link = screen.getByRole('link', { name: /github/i })
    expect(link).toHaveAttribute('href', 'https://github.com/test')
  })

  it('GitHub link opens in new tab', () => {
    render(<GatewayZone />)
    const link = screen.getByRole('link', { name: /github/i })
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('GitHub link has correct rel', () => {
    render(<GatewayZone />)
    const link = screen.getByRole('link', { name: /github/i })
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

describe('GatewayZone — LinkedIn link', () => {
  it('renders LinkedIn link with correct href', () => {
    render(<GatewayZone />)
    const link = screen.getByRole('link', { name: /linkedin/i })
    expect(link).toHaveAttribute('href', 'https://linkedin.com/in/test')
  })

  it('LinkedIn link opens in new tab', () => {
    render(<GatewayZone />)
    const link = screen.getByRole('link', { name: /linkedin/i })
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('LinkedIn link has correct rel', () => {
    render(<GatewayZone />)
    const link = screen.getByRole('link', { name: /linkedin/i })
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

describe('GatewayZone — Resume download', () => {
  it('resume link has download attribute', () => {
    render(<GatewayZone />)
    const link = screen.getByRole('link', { name: /download resume/i })
    expect(link).toHaveAttribute('download')
  })

  it('resume link has correct href', () => {
    render(<GatewayZone />)
    const link = screen.getByRole('link', { name: /download resume/i })
    expect(link).toHaveAttribute('href', '/resume.pdf')
  })

  it('resume link does NOT have target="_blank"', () => {
    render(<GatewayZone />)
    const link = screen.getByRole('link', { name: /download resume/i })
    expect(link).not.toHaveAttribute('target', '_blank')
  })
})

describe('GatewayZone — Email: preferCopy true', () => {
  it('renders a button (not a link) for copy email', () => {
    render(<GatewayZone />)
    const btn = screen.getByRole('button', { name: /copy email/i })
    expect(btn).toBeTruthy()
  })

  it('clicking Copy Email writes to clipboard', async () => {
    render(<GatewayZone />)
    const btn = screen.getByRole('button', { name: /copy email/i })
    fireEvent.click(btn)
    expect(writeTextMock).toHaveBeenCalledWith('test@example.com')
  })

  it('Copied! feedback appears after clipboard write', async () => {
    render(<GatewayZone />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy email/i }))
      // Flush the clipboard Promise resolution
      await Promise.resolve()
    })
    expect(screen.getByText('Copied!')).toBeTruthy()
  })

  it('Copied! feedback auto-dismisses after 2s', async () => {
    render(<GatewayZone />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy email/i }))
      await Promise.resolve()
    })
    expect(screen.getByText('Copied!')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.queryByText('Copied!')).toBeNull()
  })
})

describe('GatewayZone — Email: preferCopy false', () => {
  it('renders a mailto: link when preferCopy is false', () => {
    vi.mocked(useMeta).mockReturnValueOnce({
      ...mockMeta,
      contact: { email: 'test@example.com', preferCopy: false },
    })
    render(<GatewayZone />)
    const link = screen.getByRole('link', { name: /test@example\.com/i })
    expect(link).toHaveAttribute('href', 'mailto:test@example.com')
  })

  it('does NOT render a Copy Email button when preferCopy is false', () => {
    vi.mocked(useMeta).mockReturnValueOnce({
      ...mockMeta,
      contact: { email: 'test@example.com', preferCopy: false },
    })
    render(<GatewayZone />)
    expect(screen.queryByRole('button', { name: /copy email/i })).toBeNull()
  })
})