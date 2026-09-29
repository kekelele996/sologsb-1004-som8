export type ScriptStatus = 'draft' | 'review' | 'returned' | 'approved' | 'sync'
export type DeviceKind = 'desktop' | 'tablet' | 'mobile' | 'kiosk'

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

/** 译稿定稿时所依据的中文主稿字段快照 */
export interface MasterFields {
  title: string
  narration: string
  accessibility: string
  durationMinutes: number
  sources: string
}

/** 译稿定稿时中文主稿的单个段落快照，pairedSegmentId 指向当时按顺序对应的译段；zhSegmentId 用于结构变动后稳定对齐 */
export interface MasterSegmentRef {
  key: string
  zhSegmentId?: string
  label: string
  content: string
  pairedSegmentId?: string
}

/** 译稿与中文主稿的同步关系：基于哪个主稿版本、当时内容、已逐段确认的段落 */
export interface MasterRef {
  version: number
  fields: MasterFields
  segments: MasterSegmentRef[]
  confirmedKeys: string[]
  fieldsConfirmed: boolean
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
  /** 非中文稿最近一次定稿时对应的中文主稿状态；存在即表示与该主稿版本挂钩 */
  masterRef?: MasterRef
}

export interface Exhibit {
  id: string
  hallId: string
  code: string
  title: string
  order: number
  /** 中文主稿当前版本号，中文内容在有已定稿译稿后发生变动时递增 */
  masterVersion: number
  drafts: LanguageDraft[]
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

export type SyncItemKind = 'changed' | 'added' | 'removed' | 'kept'

export interface SyncReportItem {
  key: string
  order: number
  kind: SyncItemKind
  label: string
  oldContent?: string
  zhContent?: string
  pairId?: string
  pairLocked: boolean
  confirmed: boolean
}

export interface SyncFieldChange {
  field: keyof MasterFields
  label: string
  old: string
  current: string
}

export interface SyncReport {
  items: SyncReportItem[]
  pendingCount: number
  keptCount: number
  changedFields: SyncFieldChange[]
  fieldsConfirmed: boolean
  canFinalize: boolean
  refVersion: number
  masterVersion: number
}
