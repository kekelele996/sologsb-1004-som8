export type ScriptStatus = 'draft' | 'review' | 'returned' | 'approved' | 'syncing'
export type DeviceKind = 'desktop' | 'tablet' | 'mobile' | 'kiosk'
export type SyncFieldKey = 'title' | 'narration' | 'accessibility'
export type SyncItemState = 'pending' | 'confirmed' | 'locked'

export interface Hall {
  id: string
  name: string
  description: string
}

export interface Segment {
  id: string
  label: string
  content: string
  locked: boolean
}

/** 中文主稿某一版定稿时冻结下来的内容快照 */
export interface MasterContent {
  title: string
  narration: string
  accessibility: string
  segments: Segment[]
}

/** 译稿定稿时所依据的中文内容，逐字段/逐段核对都以它为基准 */
export interface SyncBaseline extends MasterContent {}

/** 译稿侧的核对记录：值为确认时中文稿的当前内容；中文再改即自动回到待处理 */
export interface SyncConfirms {
  fields: Partial<Record<SyncFieldKey, string>>
  segments: Record<number, string>
}

export interface LanguageDraft {
  id: string
  languageId: string
  title: string
  narration: string
  accessibility: string
  durationMinutes: number
  sources: string
  status: ScriptStatus
  segments: Segment[]
  updatedAt: string
  /** 非中文稿：定稿时依据的中文快照；未定稿则为 null */
  syncBaseline: SyncBaseline | null
  /** 非中文稿：定稿基线对应的中文主稿版本号 */
  syncBaselineVersion: number
  /** 非中文稿：逐字段/逐段的同步确认进度 */
  syncConfirms: SyncConfirms
}

export interface Exhibit {
  id: string
  hallId: string
  code: string
  title: string
  order: number
  drafts: LanguageDraft[]
  /** 中文主稿语言（默认 zh） */
  masterLanguageId: string
  /** 中文主稿当前定稿版本号：每次中文重新定稿递增，未定稿为 0 */
  masterVersion: number
  /** 中文主稿最近一次定稿时间 */
  masterFrozenAt: string | null
  /** 中文主稿最近一次定稿时冻结的内容 */
  masterContent: MasterContent | null
}

export interface Language {
  id: string
  code: string
  label: string
  shortLabel: string
}

export interface VersionSnapshot {
  id: string
  exhibitId: string
  languageId: string
  name: string
  createdAt: string
  draft: LanguageDraft
}

export interface PersistedState {
  halls: Hall[]
  exhibits: Exhibit[]
  versions: VersionSnapshot[]
  selectedHallId: string
  selectedExhibitId: string
  selectedLanguageId: string
  lastSavedAt: string
}

export interface DiffLine {
  type: 'same' | 'add' | 'remove'
  text: string
}

export interface SyncFieldItem {
  kind: 'field'
  field: SyncFieldKey
  label: string
  masterValue: string
  baseValue: string
  changed: boolean
  state: SyncItemState
}

export interface SyncSegmentItem {
  kind: 'segment'
  index: number
  label: string
  masterContent: string
  baseContent: string
  translationContent: string
  /** 译文在该序号处是否已有对应段落 */
  present: boolean
  /** 中文稿在该序号处的段落是否已被删除（仅译文多余段落） */
  masterRemoved: boolean
  state: SyncItemState
}

export interface SyncInfo {
  /** 是否挂有中文主稿基线（即译文是否曾经定稿） */
  tracked: boolean
  fields: SyncFieldItem[]
  segments: SyncSegmentItem[]
  pendingCount: number
  confirmedCount: number
  lockedKeptCount: number
  /** 是否存在尚未逐段确认的差异 */
  hasPending: boolean
  /** 中文主稿版本号与定稿时间 */
  masterVersion: number
  masterFrozenAt: string | null
  /** 中文稿当前是否含定稿后尚未重新定稿的改动 */
  masterDirty: boolean
}
