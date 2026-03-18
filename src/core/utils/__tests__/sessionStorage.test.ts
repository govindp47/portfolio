import { describe, it, expect, beforeEach } from 'vitest'
import { readSession, writeSession, clearSession } from '../sessionStorage'

describe('sessionStorage helpers', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('readSession returns null for absent keys', () => {
    expect(readSession('missing-key')).toBeNull()
  })

  it('writeSession + readSession round-trip', () => {
    writeSession('test-key', 'hello')
    expect(readSession('test-key')).toBe('hello')
  })

  it('clearSession removes the key', () => {
    writeSession('to-delete', 'value')
    clearSession('to-delete')
    expect(readSession('to-delete')).toBeNull()
  })
})