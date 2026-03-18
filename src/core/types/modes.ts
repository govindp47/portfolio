export type UserMode = 'explorer' | 'recruiter' | 'deep' | 'safe'

export interface ModeCapabilities {
  ambientActive: boolean
  gameLayerActive: boolean
  animationsEnabled: boolean
  animationLevel: 'full' | 'reduced' | 'minimal' | 'none'
  miniMapAvailable: boolean
}