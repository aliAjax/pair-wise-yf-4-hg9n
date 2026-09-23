export type SeatDirection = '左' | '右'

export type Weather = '晴' | '多云' | '阴' | '小雨' | '大雨' | '雪' | '雾'

export type TreeDensity = '稀疏' | '适中' | '茂密'

export type PedestrianStatus = '稀少' | '零星' | '密集'

export interface WindowScene {
  id: string
  routeName: string
  segment: string
  seatDirection: SeatDirection
  timestamp: string
  weather: Weather
  signText: string
  treeDensity: TreeDensity
  pedestrianStatus: PedestrianStatus
  note: string
  /** 续记来源记录的 id；来源被移除后此值保留，按无来源（独立记录）处理 */
  continuedFromId?: string
}

/** 续记时与来源对比的字段，至少改动其中一项才能保存 */
export const CONTINUATION_DIFF_KEYS = [
  'segment',
  'weather',
  'treeDensity',
  'pedestrianStatus',
  'note',
] as const

export type ContinuationDiffKey = (typeof CONTINUATION_DIFF_KEYS)[number]

export interface SceneFormData {
  routeName: string
  segment: string
  seatDirection: SeatDirection
  weather: Weather
  signText: string
  treeDensity: TreeDensity
  pedestrianStatus: PedestrianStatus
  note: string
}
