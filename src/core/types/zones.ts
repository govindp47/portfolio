export type ZoneId =
  | 'control-room'
  | 'memory-vault'
  | 'neural-graph'
  | 'timeline-tunnel'
  | 'arena'
  | 'gateway'

export interface ZoneMeta {
  id: ZoneId
  displayName: string
  navLabel: string
}