import { defineStore } from 'pinia'
import type {
  Exhibit, Hall, Language, LanguageDraft, MasterContent, PersistedState,
  ScriptStatus, Segment, SyncConfirms, SyncFieldKey, SyncInfo, SyncItemState, VersionSnapshot
} from '~/types'

export const LANGUAGES: Language[] = [
  { id: 'zh', code: 'zh-CN', label: '简体中文', shortLabel: '中' },
  { id: 'en', code: 'en-US', label: 'English', shortLabel: 'EN' },
  { id: 'ja', code: 'ja-JP', label: '日本語', shortLabel: '日' }
]

export const MASTER_LANGUAGE_ID = 'zh'

const STORAGE_KEY = 'museum-script-studio-v1'

const FIELD_LABELS: Record<SyncFieldKey, string> = {
  title: '展项标题',
  narration: '完整讲解词',
  accessibility: '无障碍描述'
}

const segments = (prefix: string, values: Array<[string, string, boolean?]>): Segment[] => values.map(([label, content, locked], index) => ({
  id: `${prefix}-${index + 1}`,
  label,
  content,
  locked: Boolean(locked)
}))

/** 深拷贝一份主稿内容，作为定稿快照，避免后续编辑引用同一份数据 */
function freezeContent(draft: LanguageDraft): MasterContent {
  return JSON.parse(JSON.stringify({
    title: draft.title,
    narration: draft.narration,
    accessibility: draft.accessibility,
    segments: draft.segments
  }))
}

function emptyConfirms(): SyncConfirms {
  return { fields: {}, segments: {} }
}

function demoState(): PersistedState {
  const halls: Hall[] = [
    { id: 'hall-ancient', name: '文明肇始厅', description: '史前至先秦文明，共 18 个展项' },
    { id: 'hall-silk', name: '丝路交融厅', description: '丝绸之路上的器物、信仰与生活' },
    { id: 'hall-city', name: '城市记忆厅', description: '近现代城市空间与市民生活' }
  ]
  const exhibits: Exhibit[] = [
    {
      id: 'exhibit-jade', hallId: 'hall-ancient', code: 'A-03', title: '玉琮：沟通天地的礼器', order: 3,
      masterLanguageId: MASTER_LANGUAGE_ID, masterVersion: 3, masterFrozenAt: '2026-09-23T08:35:00.000Z', masterContent: null,
      drafts: [
        {
          id: 'draft-jade-zh', languageId: 'zh', title: '玉琮：沟通天地的礼器',
          narration: '这件玉琮出土于长江下游的良渚遗址。它外方内圆，四角雕刻神人兽面纹，体现了新石器时代晚期精湛的玉器工艺。',
          accessibility: '玉琮为深青色，高约二十厘米。触摸模型可感受方形四角与中央圆孔；圆孔贯穿器身。',
          durationMinutes: 2.5, sources: '《中国玉器全集》第一卷；本馆藏品档案 1987-J-042',
          status: 'approved', updatedAt: '2026-09-23T08:35:00.000Z',
          syncBaseline: null, syncBaselineVersion: 0, syncConfirms: emptyConfirms(),
          segments: segments('jade-zh', [
            ['开场定位', '这件玉琮来自距今约五千年的良渚文化。', true],
            ['器物观察', '它外方内圆，四角雕刻神人兽面纹。', true],
            ['文化含义', '玉琮常被看作沟通天地的礼器，也象征权力与身份。'],
            ['参观提示', '请沿展柜顺时针观察，触摸复制品前先使用免洗消毒液。']
          ])
        },
        {
          id: 'draft-jade-en', languageId: 'en', title: 'Jade Cong: A Ritual Object Between Heaven and Earth',
          narration: 'This jade cong was made by the Liangzhu culture. Its square exterior and circular bore embody an early Chinese vision of the cosmos.',
          accessibility: 'The object is dark green. A tactile model shows four corners, carved faces, and a central circular opening.',
          durationMinutes: 2.3, sources: 'Complete Collection of Chinese Jades, Vol. 1; Museum accession 1987-J-042',
          status: 'review', updatedAt: '2026-09-24T02:15:00.000Z',
          syncBaseline: null, syncBaselineVersion: 0, syncConfirms: emptyConfirms(),
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
          syncBaseline: null, syncBaselineVersion: 0, syncConfirms: emptyConfirms(),
          segments: segments('jade-ja', [
            ['導入', '約五千年前の良渚文化を代表する玉琮です。'],
            ['観察', '外側は方形、中央は円形で、四隅に精緻な文様があります。'],
            ['意味', '天地を結ぶ礼器として、力と身分を象徴しました。']
          ])
        }
      ]
    },
    {
      id: 'exhibit-bronze', hallId: 'hall-ancient', code: 'A-08', title: '青铜爵与礼制', order: 8,
      masterLanguageId: MASTER_LANGUAGE_ID, masterVersion: 0, masterFrozenAt: null, masterContent: null,
      drafts: [
        {
          id: 'draft-bronze-zh', languageId: 'zh', title: '青铜爵与礼制',
          narration: '爵是最早的青铜酒器之一。三足稳定器身，长流便于倾倒，柱饰则与商周礼仪密切相关。',
          accessibility: '器物为青铜色，器口一侧有长流，底部三足支撑。复制件配有可触摸的局部纹样。',
          durationMinutes: 3, sources: '《殷周青铜器通论》；展品说明卡 A-08',
          status: 'returned', updatedAt: '2026-09-23T11:20:00.000Z',
          syncBaseline: null, syncBaselineVersion: 0, syncConfirms: emptyConfirms(),
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
          syncBaseline: null, syncBaselineVersion: 0, syncConfirms: emptyConfirms(),
          segments: segments('bronze-en', [['Object', 'This bronze jue dates to the Shang dynasty.'], ['Structure', 'Three legs support the body; the long spout guides the pour.']])
        }
      ]
    },
    {
      id: 'exhibit-silk', hallId: 'hall-silk', code: 'B-02', title: '织机与丝路纹样', order: 2,
      masterLanguageId: MASTER_LANGUAGE_ID, masterVersion: 0, masterFrozenAt: null, masterContent: null,
      drafts: [{
        id: 'draft-silk-zh', languageId: 'zh', title: '织机与丝路纹样',
        narration: '织机把一根根丝线组织成布匹，也把不同地区的图案与故事连接在一起。',
        accessibility: '体验区提供放大纹样、凸点经纬结构以及可操作的小型织机模型。',
        durationMinutes: 4, sources: '馆内教育活动资料；丝绸之路纺织史专题',
        status: 'draft', updatedAt: '2026-09-20T03:00:00.000Z',
        syncBaseline: null, syncBaselineVersion: 0, syncConfirms: emptyConfirms(),
        segments: segments('silk-zh', [['序言', '丝绸不只是一种材料，也是交流的媒介。'], ['互动', '请试着推动梭子，观察经纬线如何交会。']])
      }]
    }
  ]
  // 示例中玉琮展项的中文已挂 v3 定稿：冻结内容与当前稿一致，英文稿此前已定稿到 v2
  const jade = exhibits[0]
  const jadeZh = jade.drafts[0]
  jade.masterContent = freezeContent(jadeZh)
  const jadeEn = jade.drafts.find(d => d.languageId === 'en')!
  // 英文稿挂一个旧基线（存的是定稿时的中文内容）：讲解词与中文定稿不一致、段落更少，演示“待同步 + 逐段确认”
  jadeEn.status = 'syncing'
  jadeEn.syncBaselineVersion = 2
  jadeEn.syncBaseline = {
    title: jadeZh.title,
    narration: '这件玉琮出土于长江下游的良渚遗址。',
    accessibility: '玉琮为深青色，高约二十厘米。触摸模型可感受方形四角与中央圆孔；圆孔贯穿器身。',
    segments: [
      { id: 'jade-en-1', label: '开场定位', content: '这件玉琮来自距今约五千年的良渚文化。', locked: true },
      { id: 'jade-en-2', label: '器物观察', content: '它外方内圆，四角雕刻神人兽面纹。', locked: false }
    ]
  }
  // 开场段（序号 0）已逐段确认；其余为待处理；译文锁定段保留原译文、不进入待处理
  jadeEn.syncConfirms = { fields: {}, segments: { 0: jadeZh.segments[0].content } }
  return {
    halls,
    exhibits,
    versions: [],
    selectedHallId: halls[0].id,
    selectedExhibitId: exhibits[0].id,
    selectedLanguageId: 'zh',
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
      return this.selectedExhibit?.drafts.find(draft => draft.languageId === (this.selectedExhibit?.masterLanguageId || MASTER_LANGUAGE_ID))
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
        } catch {
          this.resetDemo()
        }
      } else {
        this.resetDemo()
      }
      this.migrateState()
      this.ensureSelection()
      this.hydrated = true
    },
    /** 兼容旧版本地数据：补齐主稿版本字段与译稿同步字段 */
    migrateState() {
      let touched = false
      for (const raw of this.exhibits) {
        const exhibit = raw as Exhibit
        if (!exhibit.masterLanguageId) { exhibit.masterLanguageId = MASTER_LANGUAGE_ID; touched = true }
        if (exhibit.masterVersion === undefined) { exhibit.masterVersion = 0; touched = true }
        if (exhibit.masterFrozenAt === undefined) { exhibit.masterFrozenAt = null; touched = true }
        if (exhibit.masterContent === undefined) {
          const zh = exhibit.drafts.find((d: LanguageDraft) => d.languageId === exhibit.masterLanguageId)
          exhibit.masterContent = zh && exhibit.masterVersion > 0 ? freezeContent(zh) : null
          touched = true
        }
        for (const draft of exhibit.drafts) {
          if (draft.languageId === exhibit.masterLanguageId) continue
          if (!draft.syncBaseline) { draft.syncBaseline = null; touched = true }
          if ((draft as LanguageDraft).syncBaselineVersion === undefined) { draft.syncBaselineVersion = draft.syncBaseline ? exhibit.masterVersion : 0; touched = true }
          if (!draft.syncConfirms) { draft.syncConfirms = emptyConfirms(); touched = true }
          // 旧数据里已定稿译稿若与现有主稿快照不一致，一次性迁为待同步
          if (draft.status === 'approved' && draft.syncBaseline && exhibit.masterContent) {
            const info = this.computeSync(exhibit, draft)
            if (info.hasPending) draft.status = 'syncing'
          }
        }
      }
      if (touched) this.persist()
    },
    resetDemo() {
      this.$patch({ ...demoState(), hydrated: true, past: [], future: [] })
      this.persist()
      this.notice = '示例数据已就绪，可直接开始编辑。'
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

    /** 中文主稿内容变更：已定稿主稿回到待审；已定稿译稿转待同步（译文不丢） */
    applyMasterChanged(exhibit: Exhibit, masterId: string) {
      const master = exhibit.drafts.find(d => d.languageId === masterId)
      if (master && master.status === 'approved') master.status = 'review'
      for (const draft of exhibit.drafts) {
        if (draft.languageId === masterId) continue
        if (!draft.syncBaseline) continue
        const info = this.computeSync(exhibit, draft)
        if (info.hasPending && draft.status === 'approved') draft.status = 'syncing'
      }
    },

    updateDraft(patch: Partial<Pick<LanguageDraft, 'title' | 'narration' | 'accessibility' | 'durationMinutes' | 'sources'>>) {
      const draft = this.selectedDraft
      const exhibit = this.selectedExhibit
      if (!draft || !exhibit) return
      const contentChanged = Object.keys(patch).some(key => key !== 'durationMinutes' && key !== 'sources')
      this.commit(() => {
        Object.assign(draft, patch, { updatedAt: new Date().toISOString() })
        if (contentChanged && exhibit.masterLanguageId === draft.languageId) {
          this.applyMasterChanged(exhibit, draft.languageId)
        } else if (contentChanged && draft.syncBaseline) {
          // 译文被改动后，对应字段的同步确认失效，需重新确认
          for (const key of Object.keys(patch)) {
            if (key === 'title' || key === 'narration' || key === 'accessibility') {
              delete draft.syncConfirms.fields[key]
            }
          }
        }
      })
      this.notice = '改动已自动保存到浏览器。'
    },
    updateSegment(id: string, patch: Partial<Pick<Segment, 'label' | 'content'>>) {
      const draft = this.selectedDraft
      const exhibit = this.selectedExhibit
      if (!draft || !exhibit) return
      const segment = draft.segments.find(item => item.id === id)
      if (!segment || segment.locked) return
      this.commit(() => {
        Object.assign(segment, patch)
        if (exhibit.masterLanguageId === draft.languageId) {
          this.applyMasterChanged(exhibit, draft.languageId)
        } else if (draft.syncBaseline && 'content' in patch) {
          const index = draft.segments.findIndex(item => item.id === id)
          if (index >= 0) delete draft.syncConfirms.segments[index]
        }
      })
    },
    toggleLock(id: string) {
      const segment = this.selectedDraft?.segments.find(item => item.id === id)
      if (!segment) return
      this.commit(() => { segment.locked = !segment.locked })
      this.notice = segment.locked ? '段落已锁定，避免误改。' : '段落已解锁。'
    },
    addSegment() {
      const draft = this.selectedDraft
      const exhibit = this.selectedExhibit
      if (!draft || !exhibit) return
      this.commit(() => {
        draft.segments.push({ id: `segment-${Date.now()}`, label: `新段落 ${draft.segments.length + 1}`, content: '', locked: false })
        if (exhibit.masterLanguageId === draft.languageId) this.applyMasterChanged(exhibit, draft.languageId)
        else if (draft.syncBaseline) draft.syncConfirms.segments = {}
      })
    },
    removeSegment(id: string) {
      const draft = this.selectedDraft
      const exhibit = this.selectedExhibit
      const segment = draft?.segments.find(item => item.id === id)
      if (!draft || !exhibit || !segment || segment.locked) return
      this.commit(() => {
        draft.segments = draft.segments.filter(item => item.id !== id)
        if (exhibit.masterLanguageId === draft.languageId) this.applyMasterChanged(exhibit, draft.languageId)
        // 译稿删除段落会改变段落序号对齐，确认记录作废，需重新逐段确认
        else if (draft.syncBaseline) draft.syncConfirms.segments = {}
      })
    },

    /** 计算译稿与中文主稿当前内容的逐字段、逐段同步情况（中文稿编辑后立即反映） */
    computeSync(exhibit: Exhibit, draft: LanguageDraft): SyncInfo {
      const master = exhibit.drafts.find(d => d.languageId === exhibit.masterLanguageId)
      const frozen = exhibit.masterContent
      const tracked = Boolean(draft.syncBaseline)
      const result: SyncInfo = {
        tracked,
        fields: [],
        segments: [],
        pendingCount: 0,
        confirmedCount: 0,
        lockedKeptCount: 0,
        hasPending: false,
        masterVersion: exhibit.masterVersion,
        masterFrozenAt: exhibit.masterFrozenAt,
        masterDirty: false
      }
      if (!tracked || !master) return result

      // 比对目标：中文稿当前内容（编辑后立即变化）；若中文稿字段缺失则退回最近定稿快照
      const target: MasterContent = frozen && (!master.segments || !master.segments.length)
        ? frozen
        : {
            title: master.title,
            narration: master.narration,
            accessibility: master.accessibility,
            segments: master.segments
          }
      result.masterDirty = frozen ? (
        frozen.title !== master.title ||
        frozen.narration !== master.narration ||
        frozen.accessibility !== master.accessibility ||
        JSON.stringify(frozen.segments.map(s => [s.content, s.locked])) !==
        JSON.stringify(master.segments.map(s => [s.content, s.locked]))
      ) : false

      // 三个字段：以“定稿基线内容 → 中文当前内容”是否变化判定差异。
      // 基线未变视为定稿时即已对齐（已确认）；变化后需重新确认，确认值等于当前内容才算确认。
      for (const field of ['title', 'narration', 'accessibility'] as SyncFieldKey[]) {
        const masterValue = target[field]
        const baseValue = draft.syncBaseline![field]
        const confirmedValue = draft.syncConfirms.fields[field]
        const changed = baseValue !== masterValue
        const state: SyncItemState = !changed || confirmedValue === masterValue ? 'confirmed' : 'pending'
        result.fields.push({ kind: 'field', field, label: FIELD_LABELS[field], masterValue, baseValue, changed, state })
      }

      // 段落：按序号对齐。译文锁定段保留原内容，不参与待处理。
      const count = Math.max(target.segments.length, draft.segments.length, draft.syncBaseline!.segments.length)
      for (let index = 0; index < count; index++) {
        const mSeg = target.segments[index]
        const tSeg = draft.segments[index]
        const bSeg = draft.syncBaseline!.segments[index]
        const confirmedValue = draft.syncConfirms.segments[index]
        let state: SyncItemState
        if (tSeg?.locked) {
          state = 'locked'
        } else if (mSeg) {
          state = (bSeg?.content ?? '') === mSeg.content || confirmedValue === mSeg.content ? 'confirmed' : 'pending'
        } else {
          // 中文稿已删除该段，但译文仍保留
          state = confirmedValue === '__removed__' ? 'confirmed' : 'pending'
        }
        const item = {
          kind: 'segment' as const,
          index,
          label: tSeg?.label || bSeg?.label || mSeg?.label || `第 ${index + 1} 段`,
          masterContent: mSeg?.content ?? '',
          baseContent: bSeg?.content ?? '',
          translationContent: tSeg?.content ?? '',
          present: Boolean(tSeg),
          masterRemoved: !mSeg,
          state
        }
        result.segments.push(item)
      }

      for (const item of [...result.fields, ...result.segments]) {
        if (item.state === 'pending') result.pendingCount += 1
        else if (item.state === 'confirmed') result.confirmedCount += 1
        else result.lockedKeptCount += 1
      }
      result.hasPending = result.pendingCount > 0
      return result
    },

    syncInfoFor(exhibit: Exhibit, languageId: string): SyncInfo | null {
      if (languageId === exhibit.masterLanguageId) return null
      const draft = exhibit.drafts.find(d => d.languageId === languageId)
      if (!draft || !draft.syncBaseline) return null
      return this.computeSync(exhibit, draft)
    },

    /** 逐段/逐字段确认：记录“确认时看到的中文内容”，中文再改则自动失效 */
    confirmSyncItem(kind: 'field' | 'segment', key: string | number) {
      const draft = this.selectedDraft
      const exhibit = this.selectedExhibit
      const master = exhibit?.drafts.find(d => d.languageId === exhibit.masterLanguageId)
      if (!draft || !exhibit || !master) return
      this.commit(() => {
        if (kind === 'field') {
          const field = key as SyncFieldKey
          draft.syncConfirms.fields[field] = master[field]
        } else {
          const index = Number(key)
          const mSeg = master.segments[index]
          draft.syncConfirms.segments[index] = mSeg ? mSeg.content : '__removed__'
        }
      })
      this.notice = '已确认本段与中文主稿一致。'
    },
    unconfirmSyncItem(kind: 'field' | 'segment', key: string | number) {
      const draft = this.selectedDraft
      if (!draft) return
      this.commit(() => {
        if (kind === 'field') delete draft.syncConfirms.fields[key as SyncFieldKey]
        else delete draft.syncConfirms.segments[Number(key)]
      })
      this.notice = '已退回待处理。'
    },

    canFinalize(draft: LanguageDraft): boolean {
      const exhibit = this.selectedExhibit
      if (!exhibit) return false
      if (draft.languageId === exhibit.masterLanguageId) return true
      if (!draft.syncBaseline) return true
      return !this.computeSync(exhibit, draft).hasPending
    },

    setStatus(status: ScriptStatus) {
      const draft = this.selectedDraft
      const exhibit = this.selectedExhibit
      if (!draft || !exhibit) return
      let blocked = false
      let isMasterApproval = false
      this.commit(() => {
        if (status === 'approved') {
          if (draft.languageId === exhibit.masterLanguageId) {
            // 中文主稿定稿：冻结一版主稿内容并递增版本
            exhibit.masterVersion += 1
            exhibit.masterFrozenAt = new Date().toISOString()
            exhibit.masterContent = freezeContent(draft)
            isMasterApproval = true
            // 此前已定稿的译稿从此版本起纳入跟踪
            for (const other of exhibit.drafts) {
              if (other.languageId !== exhibit.masterLanguageId && other.status === 'approved' && !other.syncBaseline) {
                other.syncBaseline = JSON.parse(JSON.stringify(exhibit.masterContent))
                other.syncBaselineVersion = exhibit.masterVersion
                other.syncConfirms = emptyConfirms()
              }
            }
          } else if (draft.syncBaseline && this.computeSync(exhibit, draft).hasPending) {
            // 译文定稿：必须所有差异逐段确认
            blocked = true
          } else {
            // 译文定稿：基线对齐到当前中文稿内容与版本，确认进度清空
            draft.syncBaseline = JSON.parse(JSON.stringify({
              title: exhibit.drafts.find(d => d.languageId === exhibit.masterLanguageId)?.title ?? '',
              narration: exhibit.drafts.find(d => d.languageId === exhibit.masterLanguageId)?.narration ?? '',
              accessibility: exhibit.drafts.find(d => d.languageId === exhibit.masterLanguageId)?.accessibility ?? '',
              segments: exhibit.drafts.find(d => d.languageId === exhibit.masterLanguageId)?.segments ?? []
            }))
            draft.syncBaselineVersion = exhibit.masterVersion
            draft.syncConfirms = emptyConfirms()
          }
        }
        if (!blocked) {
          draft.status = status
          draft.updatedAt = new Date().toISOString()
        }
      })
      if (blocked) {
        this.notice = '仍有与中文主稿不一致的段落未确认，无法定稿，请先逐段确认。'
      } else if (isMasterApproval) {
        this.notice = `中文主稿已定稿（v${exhibit.masterVersion}），其他语言将以此版本为准。`
      } else if (status === 'approved') {
        this.notice = '译文已定稿，并已对齐当前中文主稿版本。'
      } else {
        this.notice = `状态已更新为“${this.statusLabel(status)}”。`
      }
    },
    statusLabel(status: ScriptStatus) {
      return ({ draft: '草稿', review: '待审', returned: '退回', approved: '已定稿', syncing: '待同步' })[status]
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
        if (!restored.syncBaseline) restored.syncBaseline = null
        if (restored.syncBaselineVersion === undefined) restored.syncBaselineVersion = 0
        if (!restored.syncConfirms) restored.syncConfirms = emptyConfirms()
        if (index >= 0) exhibit.drafts[index] = restored
        else exhibit.drafts.push(restored)
        if (restored.languageId === exhibit.masterLanguageId) this.applyMasterChanged(exhibit, restored.languageId)
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
