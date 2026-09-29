import { defineStore } from 'pinia'
import type {
  Exhibit, Hall, Language, LanguageDraft, MasterFields, MasterRef,
  MasterSegmentRef, PersistedState, ScriptStatus, Segment, SyncFieldChange,
  SyncItemKind, SyncReport, SyncReportItem, VersionSnapshot
} from '~/types'

export const LANGUAGES: Language[] = [
  { id: 'zh', code: 'zh-CN', label: '简体中文', shortLabel: '中' },
  { id: 'en', code: 'en-US', label: 'English', shortLabel: 'EN' },
  { id: 'ja', code: 'ja-JP', label: '日本語', shortLabel: '日' }
]

export const MASTER_LANGUAGE_ID = 'zh'

const STORAGE_KEY = 'museum-script-studio-v1'
export const MASTER_FIELD_LABELS: Array<{ field: keyof MasterFields; label: string }> = [
  { field: 'title', label: '展项标题' },
  { field: 'narration', label: '完整讲解词' },
  { field: 'accessibility', label: '无障碍描述' },
  { field: 'durationMinutes', label: '预计朗读时长' },
  { field: 'sources', label: '资料来源' }
]

const segments = (prefix: string, values: Array<[string, string, boolean?]>): Segment[] => values.map(([label, content, locked], index) => ({
  id: `${prefix}-${index + 1}`,
  label,
  content,
  locked: Boolean(locked)
}))

/** 按段落顺序把中文段与译文段一一配对，译段数不足时新增段没有配对项 */
function pairWithZh(zh: Segment[], translated: Segment[]): MasterSegmentRef[] {
  return zh.map((segment, index) => ({
    key: `${index + 1}`,
    zhSegmentId: segment.id,
    label: segment.label,
    content: segment.content,
    pairedSegmentId: translated[index]?.id
  }))
}

/** 以当前中文稿为准建立主稿引用，用于译文定稿时挂钩 */
function demoState(): PersistedState {
  const halls: Hall[] = [
    { id: 'hall-ancient', name: '文明肇始厅', description: '史前至先秦文明，共 18 个展项' },
    { id: 'hall-silk', name: '丝路交融厅', description: '丝绸之路上的器物、信仰与生活' },
    { id: 'hall-city', name: '城市记忆厅', description: '近现代城市空间与市民生活' }
  ]
  const exhibits: Exhibit[] = [
    {
      id: 'exhibit-jade', hallId: 'hall-ancient', code: 'A-03', title: '玉琮：沟通天地的礼器', order: 3, masterVersion: 1,
      drafts: [
        {
          id: 'draft-jade-zh', languageId: 'zh', title: '玉琮：沟通天地的礼器',
          narration: '这件玉琮出土于长江下游的良渚遗址。它外方内圆，四角雕刻神人兽面纹，体现了新石器时代晚期精湛的玉器工艺。',
          accessibility: '玉琮为深青色，高约二十厘米。触摸模型可感受方形四角与中央圆孔；圆孔贯穿器身。',
          durationMinutes: 2.5, sources: '《中国玉器全集》第一卷；本馆藏品档案 1987-J-042',
          status: 'review', updatedAt: '2026-09-25T09:10:00.000Z',
          segments: segments('jade-zh', [
            ['开场定位', '这件玉琮来自距今约五千年的良渚文化，出土于长江下游的良渚遗址。', true],
            ['器物观察', '它外方内圆，四角雕刻神人兽面纹，纹饰细密对称。'],
            ['文化含义', '玉琮常被看作沟通天地的礼器，也象征权力与身份。'],
            ['参观提示', '请沿展柜顺时针观察，触摸复制品前先使用免洗消毒液。']
          ])
        },
        {
          id: 'draft-jade-en', languageId: 'en', title: 'Jade Cong: A Ritual Object Between Heaven and Earth',
          narration: 'This jade cong was made by the Liangzhu culture. Its square exterior and circular bore embody an early Chinese vision of the cosmos.',
          accessibility: 'The object is dark green. A tactile model shows four corners, carved faces, and a central circular opening.',
          durationMinutes: 2.3, sources: 'Complete Collection of Chinese Jades, Vol. 1; Museum accession 1987-J-042',
          status: 'sync', updatedAt: '2026-09-24T02:15:00.000Z',
          segments: segments('jade-en', [
            ['Introduction', 'This jade cong is about five thousand years old.', true],
            ['Visual description', 'Its square body encloses a circular opening, while spirit-and-animal motifs cover the corners.'],
            ['Meaning', 'Jade cong is understood as a ritual link between heaven and earth.']
          ])
        },
        {
          id: 'draft-jade-ja', languageId: 'ja', title: '玉琮：天と地を結ぶ礼器',
          narration: 'こちらは良渚文化の玉琮です。外側は方形、中央は円形で、四隅には神人獣面文が刻まれています。',
          accessibility: '暗い青緑色の玉製です。複製模型では四つの角と中央の円孔を触って確認できます。',
          durationMinutes: 2.6, sources: '『中国玉器全集』第一巻；収蔵資料 1987-J-042',
          status: 'draft', updatedAt: '2026-09-21T06:10:00.000Z',
          segments: segments('jade-ja', [
            ['導入', '約五千年前の良渚文化を代表する玉琮です。'],
            ['観察', '外側は方形、中央は円形で、四隅に精緻な文様があります。'],
            ['意味', '天地を結ぶ礼器として、力と身分を象徴しました。']
          ])
        }
      ]
    },
    {
      id: 'exhibit-bronze', hallId: 'hall-ancient', code: 'A-08', title: '青铜爵与礼制', order: 8, masterVersion: 1,
      drafts: [
        {
          id: 'draft-bronze-zh', languageId: 'zh', title: '青铜爵与礼制',
          narration: '爵是最早的青铜酒器之一。三足稳定器身，长流便于倾倒，柱饰则与商周礼仪密切相关。',
          accessibility: '器物为青铜色，器口一侧有长流，底部三足支撑。复制件配有可触摸的局部纹样。',
          durationMinutes: 3, sources: '《殷周青铜器通论》；展品说明卡 A-08',
          status: 'returned', updatedAt: '2026-09-23T11:20:00.000Z',
          segments: segments('bronze-zh', [
            ['器物介绍', '这是一件商代青铜爵，用于温酒和饮酒。'],
            ['结构说明', '三足使器身稳定，前端的流便于倾倒。'],
            ['礼制背景', '青铜器数量与形制反映了使用者的身份。'],
            ['修改说明', '审校意见：补充“柱饰”的用途，并核对年代。']
          ])
        },
        {
          id: 'draft-bronze-en', languageId: 'en', title: 'Bronze Jue and Ritual Order',
          narration: 'The jue was among the earliest bronze drinking vessels. Its tripod base, pouring spout, and posts were closely tied to Shang and Zhou ritual.',
          accessibility: 'The tactile replica includes the long spout, tripod feet, and raised posts.',
          durationMinutes: 2.8, sources: 'A General Survey of Yin-Zhou Bronzes; Gallery label A-08',
          status: 'draft', updatedAt: '2026-09-22T09:00:00.000Z',
          segments: segments('bronze-en', [['Object', 'This bronze jue dates to the Shang dynasty.'], ['Structure', 'Three legs support the body; the long spout guides the pour.']])
        }
      ]
    },
    {
      id: 'exhibit-silk', hallId: 'hall-silk', code: 'B-02', title: '织机与丝路纹样', order: 2, masterVersion: 1,
      drafts: [{
        id: 'draft-silk-zh', languageId: 'zh', title: '织机与丝路纹样',
        narration: '织机把一根根丝线组织成布匹，也把不同地区的图案与故事连接在一起。',
        accessibility: '体验区提供放大纹样、凸点经纬结构以及可操作的小型织机模型。',
        durationMinutes: 4, sources: '馆内教育活动资料；丝绸之路纺织史专题',
        status: 'draft', updatedAt: '2026-09-20T03:00:00.000Z',
        segments: segments('silk-zh', [['序言', '丝绸不只是一种材料，也是交流的媒介。'], ['互动', '请试着推动梭子，观察经纬线如何交会。']])
      }]
    }
  ]

  // 英文稿曾基于主稿 v1 定稿；之后中文稿改动，现在处于待同步
  const jade = exhibits[0]
  const jadeZh = jade.drafts.find(draft => draft.languageId === MASTER_LANGUAGE_ID)!
  const jadeEn = jade.drafts.find(draft => draft.languageId === 'en')!
  const v1ZhSegments = segments('jade-zh-v1', [
    ['开场定位', '这件玉琮来自距今约五千年的良渚文化。'],
    ['器物观察', '它外方内圆，四角雕刻神人兽面纹。'],
    ['文化含义', '玉琮常被看作沟通天地的礼器，也象征权力与身份。']
  ])
  const v1ZhFields: MasterFields = {
    title: jadeZh.title,
    narration: '这件玉琮出土于长江下游的良渚遗址。它外方内圆，四角雕刻神人兽面纹，体现了新石器时代晚期精湛的玉器工艺。',
    accessibility: jadeZh.accessibility,
    durationMinutes: jadeZh.durationMinutes,
    sources: jadeZh.sources
  }
  jadeEn.masterRef = {
    version: 1,
    fields: v1ZhFields,
    segments: pairWithZh(v1ZhSegments, jadeEn.segments),
    confirmedKeys: [],
    fieldsConfirmed: false
  }

  return {
    halls,
    exhibits,
    versions: [],
    selectedHallId: halls[0].id,
    selectedExhibitId: exhibits[0].id,
    selectedLanguageId: MASTER_LANGUAGE_ID,
    lastSavedAt: new Date().toISOString()
  }
}

export const useScriptStore = defineStore('museum-script', {
  state: () => ({
    halls: [] as Hall[],
    exhibits: [] as Exhibit[],
    versions: [] as VersionSnapshot[],
    selectedHallId: '',
    selectedExhibitId: '',
    selectedLanguageId: 'zh',
    lastSavedAt: '',
    hydrated: false,
    past: [] as string[],
    future: [] as string[],
    notice: ''
  }),
  getters: {
    selectedHall(state): Hall | undefined {
      return state.halls.find(hall => hall.id === state.selectedHallId)
    },
    hallExhibits(state): Exhibit[] {
      return state.exhibits.filter(exhibit => exhibit.hallId === state.selectedHallId).sort((a, b) => a.order - b.order)
    },
    selectedExhibit(state): Exhibit | undefined {
      return state.exhibits.find(exhibit => exhibit.id === state.selectedExhibitId)
    },
    selectedDraft(): LanguageDraft | undefined {
      return this.selectedExhibit?.drafts.find(draft => draft.languageId === this.selectedLanguageId)
    },
    masterDraft(): LanguageDraft | undefined {
      return this.selectedExhibit?.drafts.find(draft => draft.languageId === MASTER_LANGUAGE_ID)
    },
    wordCount(): number {
      return (this.selectedDraft?.narration || '').replace(/\s/g, '').length
    },
    canUndo(state): boolean { return state.past.length > 0 },
    canRedo(state): boolean { return state.future.length > 0 }
  },
  actions: {
    hydrate() {
      if (this.hydrated || typeof localStorage === 'undefined') return
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const data = JSON.parse(saved) as PersistedState
          this.$patch({ ...data, hydrated: true })
          if (!this.halls.length || !this.exhibits.length) this.resetDemo()
          else this.migrate()
        } catch {
          this.resetDemo()
        }
      } else {
        this.resetDemo()
      }
      this.ensureSelection()
      this.hydrated = true
    },
    /** 兼容旧数据：补齐主稿版本号，并按现有主稿内容重算待同步关系 */
    migrate() {
      let changed = false
      for (const exhibit of this.exhibits) {
        if (typeof exhibit.masterVersion !== 'number') { exhibit.masterVersion = 1; changed = true }
        for (const draft of exhibit.drafts) {
          if (draft.languageId === MASTER_LANGUAGE_ID) continue
          if (draft.status === 'approved' && !draft.masterRef) {
            draft.masterRef = this.makeRefFor(exhibit, draft)
            changed = true
          }
          if (draft.masterRef && (draft.status === 'approved' || draft.status === 'sync')) {
            const report = this.computeSyncReport(exhibit, draft)
            const diverged = report.items.length > 0 || report.changedFields.length > 0
            if (diverged && draft.status === 'approved') { draft.status = 'sync'; changed = true }
          }
        }
      }
      if (changed) this.persist()
    },
    resetDemo() {
      this.$patch({ ...demoState(), hydrated: true, past: [], future: [] })
      this.persist()
      this.notice = '示例数据已就绪：玉琮展项英文稿正处于待同步状态。'
    },
    snapshot(): string {
      return JSON.stringify({ halls: this.halls, exhibits: this.exhibits, versions: this.versions })
    },
    commit(mutator: () => void) {
      this.past.push(this.snapshot())
      if (this.past.length > 50) this.past.shift()
      this.future = []
      mutator()
      this.lastSavedAt = new Date().toISOString()
      this.persist()
    },
    persist() {
      if (typeof localStorage === 'undefined') return
      const data: PersistedState = {
        halls: this.halls, exhibits: this.exhibits, versions: this.versions,
        selectedHallId: this.selectedHallId, selectedExhibitId: this.selectedExhibitId,
        selectedLanguageId: this.selectedLanguageId, lastSavedAt: this.lastSavedAt
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    },
    ensureSelection() {
      if (!this.halls.some(hall => hall.id === this.selectedHallId)) this.selectedHallId = this.halls[0]?.id || ''
      const inHall = this.exhibits.filter(exhibit => exhibit.hallId === this.selectedHallId)
      if (!inHall.some(exhibit => exhibit.id === this.selectedExhibitId)) this.selectedExhibitId = inHall[0]?.id || ''
      const exhibit = this.selectedExhibit
      if (!exhibit?.drafts.some(draft => draft.languageId === this.selectedLanguageId)) this.selectedLanguageId = exhibit?.drafts[0]?.languageId || 'zh'
    },
    selectHall(id: string) {
      this.selectedHallId = id
      const exhibit = this.exhibits.find(item => item.hallId === id)
      this.selectedExhibitId = exhibit?.id || ''
      this.ensureSelection()
      this.persist()
    },
    selectExhibit(id: string) {
      this.selectedExhibitId = id
      this.ensureSelection()
      this.persist()
    },
    selectLanguage(id: string) {
      this.selectedLanguageId = id
      this.persist()
    },

    // ---------- 主稿版本与同步 ----------

    zhDraftOf(exhibit: Exhibit): LanguageDraft | undefined {
      return exhibit.drafts.find(draft => draft.languageId === MASTER_LANGUAGE_ID)
    },
    currentFieldsOf(zh: LanguageDraft): MasterFields {
      return {
        title: zh.title,
        narration: zh.narration,
        accessibility: zh.accessibility,
        durationMinutes: zh.durationMinutes,
        sources: zh.sources
      }
    },
    /** 以当前主稿为某份译稿生成挂钩快照 */
    makeRefFor(exhibit: Exhibit, draft: LanguageDraft): MasterRef {
      const zh = this.zhDraftOf(exhibit)!
      return {
        version: exhibit.masterVersion,
        fields: this.currentFieldsOf(zh),
        segments: pairWithZh(zh.segments, draft.segments),
        confirmedKeys: [],
        fieldsConfirmed: false
      }
    },
    formatFieldValue(value: string | number): string {
      return typeof value === 'number' ? `${value} 分钟` : String(value || '（空）')
    },
    /** 比较译稿挂钩的主稿快照与当前中文稿，列出不一致段落与字段 */
    computeSyncReport(exhibit: Exhibit, draft: LanguageDraft): SyncReport {
      const empty: SyncReport = { items: [], pendingCount: 0, keptCount: 0, changedFields: [], fieldsConfirmed: false, canFinalize: false, refVersion: 0, masterVersion: exhibit.masterVersion }
      const zh = this.zhDraftOf(exhibit)
      const ref = draft.masterRef
      if (!zh || !ref) return empty

      const items: SyncReportItem[] = []
      const findPair = (id?: string) => draft.segments.find(segment => segment.id === id)
      // 兼容旧快照：没有 zhSegmentId 时按顺序对齐
      const refForCurrent = (zhId: string | undefined, index: number) =>
        ref.segments.find(item => item.zhSegmentId === zhId) || (!ref.segments.some(item => item.zhSegmentId) ? ref.segments[index] : undefined)

      // 当前中文稿的每一段：优先按稳定 ID 与定稿快照匹配
      zh.segments.forEach((segment, index) => {
        const oldRef = refForCurrent(segment.id, index)
        if (!oldRef) {
          // 中文新增段（无配对快照）
          items.push({ key: `add:${segment.id}`, order: index, kind: 'added', label: segment.label, zhContent: segment.content, pairLocked: false, confirmed: ref.confirmedKeys.includes(`add:${segment.id}`) })
          return
        }
        if (oldRef.content === segment.content && oldRef.label === segment.label) return
        const pair = findPair(oldRef.pairedSegmentId)
        const pairLocked = Boolean(pair?.locked)
        const key = oldRef.zhSegmentId ? `seg:${oldRef.zhSegmentId}` : oldRef.key
        const kind: SyncItemKind = pairLocked ? 'kept' : 'changed'
        items.push({ key, order: index, kind, label: segment.label, oldContent: oldRef.content, zhContent: segment.content, pairId: pair?.id, pairLocked, confirmed: ref.confirmedKeys.includes(key) || pairLocked })
      })

      // 中文已删除但译文中仍存在的段落（快照存在、当前找不到对应中文段）
      ref.segments.forEach((oldRef) => {
        const stillPresent = oldRef.zhSegmentId
          ? zh.segments.some(segment => segment.id === oldRef.zhSegmentId)
          : zh.segments.some(segment => oldRef.label === segment.label && oldRef.content === segment.content)
        if (stillPresent) return
        const pair = findPair(oldRef.pairedSegmentId)
        const key = oldRef.zhSegmentId ? `del:${oldRef.zhSegmentId}` : `del:${oldRef.key}`
        const pairLocked = Boolean(pair?.locked)
        const oldIndex = ref.segments.indexOf(oldRef)
        items.push({
          key,
          order: zh.segments.length + oldIndex,
          kind: pairLocked ? 'kept' : 'removed',
          label: oldRef.label,
          oldContent: oldRef.content,
          pairId: pair?.id,
          pairLocked,
          confirmed: ref.confirmedKeys.includes(key) || pairLocked
        })
      })

      const changedFields: SyncFieldChange[] = []
      for (const { field, label } of MASTER_FIELD_LABELS) {
        const old = ref.fields[field]
        const current = zh[field]
        if (old !== current) {
          changedFields.push({ field, label, old: this.formatFieldValue(old), current: this.formatFieldValue(current) })
        }
      }

      const pendingCount = items.filter(item => !item.confirmed).length
      const keptCount = items.filter(item => item.kind === 'kept').length
      const fieldsConfirmed = Boolean(ref.fieldsConfirmed)
      return {
        items: items.sort((a, b) => a.order - b.order),
        pendingCount,
        keptCount,
        changedFields,
        fieldsConfirmed,
        canFinalize: pendingCount === 0 && (items.length > 0 || (changedFields.length > 0 && fieldsConfirmed)),
        refVersion: ref.version,
        masterVersion: exhibit.masterVersion
      }
    },
    syncReportFor(exhibit: Exhibit | undefined, draft: LanguageDraft | undefined): SyncReport | undefined {
      if (!exhibit || !draft || draft.languageId === MASTER_LANGUAGE_ID || !draft.masterRef) return undefined
      return this.computeSyncReport(exhibit, draft)
    },
    syncPendingPairs(exhibit: Exhibit): Array<{ languageId: string; count: number }> {
      return exhibit.drafts
        .filter(draft => draft.languageId !== MASTER_LANGUAGE_ID && draft.status === 'sync' && draft.masterRef)
        .map(draft => ({ languageId: draft.languageId, report: this.computeSyncReport(exhibit, draft) }))
        .map(({ languageId, report }) => ({ languageId, count: report.pendingCount }))
    },
    /** 中文主稿内容可能发生变动后的统一处理：已定稿中文回待审，已定稿译文转待同步 */
    noteMasterEdited(exhibit: Exhibit, changed: boolean) {
      if (!changed) return
      const zh = this.zhDraftOf(exhibit)
      if (zh && zh.status === 'approved') zh.status = 'review'
      const stale = exhibit.drafts.filter(draft =>
        draft.languageId !== MASTER_LANGUAGE_ID && draft.status === 'approved' && draft.masterRef)
      if (stale.length) {
        exhibit.masterVersion += 1
        for (const draft of stale) draft.status = 'sync'
        const names = stale.map(draft => LANGUAGES.find(lang => lang.id === draft.languageId)?.label || draft.languageId).join('、')
        this.notice = `中文主稿已更新到 v${exhibit.masterVersion}：${names} 转为待同步，译文内容保留。`
      } else {
        this.notice = '中文主稿改动已保存。'
      }
    },
    /** 逐段确认：译文已对照最新中文稿处理完毕 */
    confirmSyncItem(key: string) {
      const exhibit = this.selectedExhibit
      const draft = this.selectedDraft
      if (!exhibit || !draft?.masterRef) return
      this.commit(() => {
        const ref = draft.masterRef!
        if (!ref.confirmedKeys.includes(key)) ref.confirmedKeys.push(key)
        draft.updatedAt = new Date().toISOString()
      })
      const report = this.computeSyncReport(exhibit, draft)
      this.notice = report.pendingCount === 0
        ? '所有不一致段落均已确认，别忘了核对更新后的字段。'
        : `段落已确认，还剩 ${report.pendingCount} 段待处理。`
    },
    /** 确认已核对标题、讲解词等更新字段 */
    confirmSyncFields() {
      const exhibit = this.selectedExhibit
      const draft = this.selectedDraft
      if (!exhibit || !draft?.masterRef) return
      this.commit(() => {
        draft.masterRef!.fieldsConfirmed = true
        draft.updatedAt = new Date().toISOString()
      })
      this.notice = '更新字段已核对。'
    },
    /** 全部不一致段落与字段确认后，译文重新挂钩当前主稿版本并定稿 */
    finalizeSync() {
      const exhibit = this.selectedExhibit
      const draft = this.selectedDraft
      if (!exhibit || !draft || draft.status !== 'sync' || !draft.masterRef) return
      const report = this.computeSyncReport(exhibit, draft)
      if (!report.canFinalize) {
        this.notice = '仍有段落或更新字段未确认，暂不能重新定稿。'
        return
      }
      this.commit(() => {
        draft.masterRef = this.makeRefFor(exhibit, draft)
        draft.status = 'approved'
        draft.updatedAt = new Date().toISOString()
      })
      this.notice = `译文已逐段同步并重新定稿，挂钩中文主稿 v${exhibit.masterVersion}。`
    },

    // ---------- 编辑动作 ----------

    updateDraft(patch: Partial<Pick<LanguageDraft, 'title' | 'narration' | 'accessibility' | 'durationMinutes' | 'sources'>>) {
      const exhibit = this.selectedExhibit
      const draft = this.selectedDraft
      if (!exhibit || !draft) return
      const changed = Object.entries(patch).some(([key, value]) => (draft as unknown as Record<string, unknown>)[key] !== value)
      this.commit(() => {
        Object.assign(draft, patch, { updatedAt: new Date().toISOString() })
        if (draft.languageId === MASTER_LANGUAGE_ID) this.noteMasterEdited(exhibit, changed)
      })
      if (draft.languageId !== MASTER_LANGUAGE_ID) this.notice = '改动已自动保存到浏览器。'
    },
    updateSegment(id: string, patch: Partial<Pick<Segment, 'label' | 'content'>>) {
      const exhibit = this.selectedExhibit
      const draft = this.selectedDraft
      const segment = draft?.segments.find(item => item.id === id)
      if (!exhibit || !draft || !segment || segment.locked) return
      const changed = Object.entries(patch).some(([key, value]) => (segment as unknown as Record<string, unknown>)[key] !== value)
      this.commit(() => {
        Object.assign(segment, patch)
        if (draft.languageId === MASTER_LANGUAGE_ID) this.noteMasterEdited(exhibit, changed)
      })
      if (draft.languageId !== MASTER_LANGUAGE_ID) this.notice = '段落改动已自动保存。'
    },
    toggleLock(id: string) {
      const segment = this.selectedDraft?.segments.find(item => item.id === id)
      if (!segment) return
      this.commit(() => { segment.locked = !segment.locked })
      this.notice = segment.locked ? '段落已锁定，同步时将保留原内容。' : '段落已解锁。'
    },
    addSegment() {
      const exhibit = this.selectedExhibit
      const draft = this.selectedDraft
      if (!exhibit || !draft) return
      this.commit(() => {
        draft.segments.push({ id: `segment-${Date.now()}`, label: `新段落 ${draft.segments.length + 1}`, content: '', locked: false })
        if (draft.languageId === MASTER_LANGUAGE_ID) this.noteMasterEdited(exhibit, true)
      })
      if (draft.languageId !== MASTER_LANGUAGE_ID) this.notice = '已新增段落。'
    },
    removeSegment(id: string) {
      const exhibit = this.selectedExhibit
      const draft = this.selectedDraft
      const segment = draft?.segments.find(item => item.id === id)
      if (!exhibit || !draft || !segment || segment.locked) return
      this.commit(() => {
        draft.segments = draft.segments.filter(item => item.id !== id)
        if (draft.languageId === MASTER_LANGUAGE_ID) this.noteMasterEdited(exhibit, true)
      })
      if (draft.languageId !== MASTER_LANGUAGE_ID) this.notice = '段落已删除，可撤销恢复。'
    },
    setStatus(status: ScriptStatus) {
      const exhibit = this.selectedExhibit
      const draft = this.selectedDraft
      if (!exhibit || !draft || status === 'sync') return
      this.commit(() => {
        if (status === 'approved' && draft.languageId !== MASTER_LANGUAGE_ID) {
          // 译文定稿：挂钩当前中文主稿版本
          draft.masterRef = this.makeRefFor(exhibit, draft)
        }
        draft.status = status
        draft.updatedAt = new Date().toISOString()
      })
      this.notice = status === 'approved' && draft.languageId !== MASTER_LANGUAGE_ID
        ? `译文已定稿，挂钩中文主稿 v${exhibit.masterVersion}。`
        : `状态已更新为“${this.statusLabel(status)}”。`
    },
    statusLabel(status: ScriptStatus) {
      return ({ draft: '草稿', review: '待审', returned: '退回', approved: '已定稿', sync: '待同步' })[status]
    },
    createVersion(name?: string) {
      const draft = this.selectedDraft
      if (!draft) return
      const version: VersionSnapshot = {
        id: `version-${Date.now()}`,
        exhibitId: this.selectedExhibitId,
        languageId: this.selectedLanguageId,
        name: name || `${new Date().toLocaleString('zh-CN', { hour12: false })} 快照`,
        createdAt: new Date().toISOString(),
        draft: JSON.parse(JSON.stringify(draft))
      }
      this.commit(() => this.versions.unshift(version))
      this.notice = '已保存当前版本，可在版本页比较或恢复。'
    },
    restoreVersion(id: string) {
      const version = this.versions.find(item => item.id === id)
      if (!version) return
      this.commit(() => {
        const exhibit = this.exhibits.find(item => item.id === version.exhibitId)
        if (!exhibit) return
        const index = exhibit.drafts.findIndex(item => item.languageId === version.languageId)
        const restored = JSON.parse(JSON.stringify(version.draft)) as LanguageDraft
        if (index >= 0) exhibit.drafts[index] = restored
        else exhibit.drafts.push(restored)
      })
      this.selectedExhibitId = version.exhibitId
      this.selectedLanguageId = version.languageId
      this.notice = '版本已恢复，并作为一次可撤销操作保存。'
    },
    undo() {
      const state = this.past.pop()
      if (!state) return
      this.future.push(this.snapshot())
      this.$patch(JSON.parse(state))
      this.lastSavedAt = new Date().toISOString()
      this.ensureSelection()
      this.persist()
      this.notice = '已撤销上一步。'
    },
    redo() {
      const state = this.future.pop()
      if (!state) return
      this.past.push(this.snapshot())
      this.$patch(JSON.parse(state))
      this.lastSavedAt = new Date().toISOString()
      this.ensureSelection()
      this.persist()
      this.notice = '已重做。'
    },
    completionFor(exhibit: Exhibit, languageId: string): number {
      const draft = exhibit.drafts.find(item => item.languageId === languageId)
      if (!draft) return 0
      const checks = [draft.title, draft.narration, draft.accessibility, draft.sources, draft.segments.length > 0 ? 'segments' : '']
      return Math.round(checks.filter(Boolean).length / checks.length * 100)
    }
  }
})
