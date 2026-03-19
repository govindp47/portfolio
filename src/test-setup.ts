import '@testing-library/jest-dom'

// ResizeObserver is not available in jsdom — polyfill for tests that
// mount components that use ResizeObserver (e.g. GraphCanvas → useForceSimulation).
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}