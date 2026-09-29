<script setup lang="ts">
import type { DeviceKind, DiffLine, LanguageDraft, ScriptStatus, Segment, SyncInfo, SyncItemState } from '~/types'
import { LANGUAGES, MASTER_LANGUAGE_ID, useScriptStore } from '~/stores/script'

const store = useScriptStore()
const activeTab = ref('editor')
const device = ref<DeviceKind>('desktop')
const versionDialog = ref(false)
const versionName = ref('')
const leftFilter = ref('')
const compareA = ref('')
const compareB = ref('')
const helpDialog = ref(false)
const deleteTarget = ref<string | null>(null)

const statusOptions: Array<{ value: ScriptStatus; label: string; color: string; disabled?: boolean }> = [
  { value: 'draft', label: '草稿', color: 'grey' },
  { value: 'review', label: '待审', color: 'warning' },
  { value: 'returned', label: '退回', color: 'error' },
  { value: 'syncing', label: '待同步', color: 'orange-darken-2', disabled: true },
  { value: 'approved', label: '已定稿', color: 'success' }
]
const deviceOptions: Array<{ value: DeviceKind; label: string }> = [
  { value: 'desktop', label: '桌面大屏' },
  { value: 'tablet', label: '平板导览' },
  { value: 'mobile', label: '手机导览' },
  { value: 'kiosk', label: '馆内触摸屏' }
]
const syncStateMeta: Record<SyncItemState, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'warning' },
  confirmed: { label: '已确认', color: 'success' },
  locked: { label: '锁定保留', color: 'secondary' }
}

const draft = computed(() => store.selectedDraft)
const exhibit = computed(() => store.selectedExhibit)
const currentLanguage = computed(() => LANGUAGES.find(item => item.id === store.selectedLanguageId))
const currentStatus = computed(() => statusOptions.find(item => item.value === draft.value?.status) || statusOptions[0])
const isMaster = computed(() => Boolean(exhibit.value && draft.value && draft.value.languageId === exhibit.value.masterLanguageId))
const masterDraft = computed(() => exhibit.value?.drafts.find(item => item.languageId === (exhibit.value?.masterLanguageId || MASTER_LANGUAGE_ID)))
const syncInfo = computed<SyncInfo | null>(() => {
  const ex = exhibit.value
  const d = draft.value
  if (!ex || !d || d.languageId === ex.masterLanguageId) return null
  return store.syncInfoFor(ex, d.languageId)
})
const filteredExhibits = computed(() => store.hallExhibits.filter(item => !leftFilter.value || `${item.code} ${item.title}`.toLowerCase().includes(leftFilter.value.toLowerCase())))
const versions = computed(() => store.versions.filter(item => item.exhibitId === store.selectedExhibitId && item.languageId === store.selectedLanguageId))

function syncStateOf(languageId: string): SyncInfo | null {
  const ex = exhibit.value
  if (!ex || languageId === ex.masterLanguageId) return null
  return store.syncInfoFor(ex, languageId)
}
function isSyncingLanguage(languageId: string): boolean {
  const d = exhibit.value?.drafts.find(item => item.languageId === languageId)
  return d?.status === 'syncing'
}
function refinalize() {
  store.setStatus('approved')
}

const selectedVersionA = computed(() => versions.value.find(item => item.id === compareA.value))
const selectedVersionB = computed(() => versions.value.find(item => item.id === compareB.value))
const diffLines = computed<DiffLine[]>(() => {
  const before = selectedVersionA.value?.draft.narration || ''
  const after = selectedVersionB.value?.draft.narration || ''
  return buildDiff(before, after)
})

onMounted(() => {
  store.hydrate()
  syncCompareSelection()
  window.addEventListener('keydown', handleKeydown)
})
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
watch(versions, syncCompareSelection)

function syncCompareSelection() {
  if (!versions.value.some(item => item.id === compareA.value)) compareA.value = versions.value[1]?.id || versions.value[0]?.id || ''
  if (!versions.value.some(item => item.id === compareB.value)) compareB.value = versions.value[0]?.id || ''
}
function handleKeydown(event: KeyboardEvent) {
  const modifier = event.metaKey || event.ctrlKey
  if (!modifier) return
  if (event.key.toLowerCase() === 'z') {
    event.preventDefault()
    event.shiftKey ? store.redo() : store.undo()
  }
  if (event.key.toLowerCase() === 'y') {
    event.preventDefault()
    store.redo()
  }
  if (event.key.toLowerCase() === 's') {
    event.preventDefault()
    store.createVersion('键盘快捷保存')
  }
}
function saveDraftField(field: 'title' | 'narration' | 'accessibility' | 'durationMinutes' | 'sources', event: Event) {
  const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value
  store.updateDraft({ [field]: field === 'durationMinutes' ? Number(value) : value } as Partial<LanguageDraft>)
}
function saveSegment(id: string, field: 'label' | 'content', event: Event) {
  store.updateSegment(id, { [field]: (event.target as HTMLInputElement | HTMLTextAreaElement).value })
}
function submitVersion() {
  store.createVersion(versionName.value.trim() || undefined)
  versionName.value = ''
  versionDialog.value = false
}
function confirmDelete() {
  if (deleteTarget.value) store.removeSegment(deleteTarget.value)
  deleteTarget.value = null
}
function buildDiff(before: string, after: string): DiffLine[] {
  const a = before.split(/(?<=[。！？.!?])\s*/).filter(Boolean)
  const b = after.split(/(?<=[。！？.!?])\s*/).filter(Boolean)
  const rows = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) rows[i][j] = a[i] === b[j] ? rows[i + 1][j + 1] + 1 : Math.max(rows[i + 1][j], rows[i][j + 1])
  }
  const result: DiffLine[] = []
  let i = 0, j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { result.push({ type: 'same', text: a[i] }); i++; j++ }
    else if (rows[i + 1][j] >= rows[i][j + 1]) { result.push({ type: 'remove', text: a[i] }); i++ }
    else { result.push({ type: 'add', text: b[j] }); j++ }
  }
  while (i < a.length) result.push({ type: 'remove', text: a[i++] })
  while (j < b.length) result.push({ type: 'add', text: b[j++] })
  return result
}
function formatTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
}
function segmentLabel(segment: Segment) { return segment.label || '未命名段落' }
</script>

<template>
  <v-app class="workspace-shell">
    <a class="skip-link" href="#main-workspace">跳到主要内容</a>
    <v-app-bar color="surface" flat border>
      <template #prepend><v-app-bar-nav-icon aria-label="打开项目导航" /></template>
      <v-app-bar-title>
        <span class="project-mark">博物声</span>
        <span class="text-caption text-medium-emphasis ms-3 d-none d-md-inline">展陈脚本工作台</span>
      </v-app-bar-title>
      <v-spacer />
      <v-chip class="me-2 d-none d-sm-flex" :color="currentStatus.color" variant="tonal" size="small">
        <span class="status-dot" :style="{ background: 'currentColor' }" />{{ currentStatus.label }}
      </v-chip>
      <v-btn variant="text" prepend-icon="mdi-keyboard-outline" class="d-none d-md-flex" @click="helpDialog = true">快捷键</v-btn>
      <v-btn color="primary" prepend-icon="mdi-content-save-outline" @click="versionDialog = true">保存版本</v-btn>
    </v-app-bar>

    <v-navigation-drawer permanent width="320" color="surface" border>
      <div class="pa-4">
        <div class="section-title mb-2">展厅</div>
        <v-select
          :model-value="store.selectedHallId"
          :items="store.halls"
          item-title="name"
          item-value="id"
          hide-details
          aria-label="选择展厅"
          @update:model-value="store.selectHall"
        />
        <div class="d-flex align-center justify-space-between mt-5 mb-2">
          <div class="section-title">展项</div>
          <v-chip size="x-small" variant="tonal">{{ filteredExhibits.length }} 项</v-chip>
        </div>
        <v-text-field v-model="leftFilter" density="compact" hide-details prepend-inner-icon="mdi-magnify" placeholder="筛选展项" aria-label="筛选展项" />
        <v-list class="mt-2 bg-transparent" nav>
          <v-list-item
            v-for="item in filteredExhibits"
            :key="item.id"
            :active="item.id === store.selectedExhibitId"
            color="primary"
            rounded="lg"
            @click="store.selectExhibit(item.id)"
          >
            <template #prepend><v-chip size="small" variant="outlined">{{ item.code }}</v-chip></template>
            <v-list-item-title class="font-weight-medium">{{ item.title }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ item.drafts.length }} 种语言
              <v-chip
                v-for="d in item.drafts.filter(draftItem => draftItem.status === 'syncing')"
                :key="d.id"
                size="x-small"
                color="orange-darken-2"
                variant="tonal"
                class="ms-1 sync-badge"
              >
                {{ LANGUAGES.find(lang => lang.id === d.languageId)?.shortLabel }} 待同步
              </v-chip>
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </div>
      <v-divider />
      <div class="pa-4">
        <div class="section-title mb-3">多语言完成度</div>
        <div v-for="lang in LANGUAGES" :key="lang.id" class="mb-3">
          <button class="d-flex align-center w-100 border-0 bg-transparent text-left pa-0" :aria-pressed="lang.id === store.selectedLanguageId" @click="store.selectLanguage(lang.id)">
            <v-avatar size="32" :color="lang.id === store.selectedLanguageId ? 'primary' : 'grey-lighten-2'" :class="lang.id === store.selectedLanguageId ? 'text-white' : ''">{{ lang.shortLabel }}</v-avatar>
            <div class="ms-3 flex-grow-1">
              <div class="d-flex align-center ga-2">
                <span class="text-body-2 font-weight-medium">{{ lang.label }}</span>
                <v-chip
                  v-if="exhibit && isSyncingLanguage(lang.id)"
                  size="x-small"
                  color="orange-darken-2"
                  variant="tonal"
                  class="sync-badge"
                >
                  待同步{{ syncStateOf(lang.id)?.pendingCount ? ` · ${syncStateOf(lang.id)!.pendingCount} 段` : '' }}
                </v-chip>
              </div>
              <v-progress-linear class="mt-1" :model-value="exhibit ? store.completionFor(exhibit, lang.id) : 0" :color="lang.id === store.selectedLanguageId ? 'primary' : 'secondary'" height="5" rounded />
            </div>
            <span class="text-caption ms-3">{{ exhibit ? store.completionFor(exhibit, lang.id) : 0 }}%</span>
          </button>
        </div>
      </div>
    </v-navigation-drawer>

    <v-main id="main-workspace" style="background:#f4f0e8">
      <div class="pa-3 pa-md-6">
        <div class="d-flex flex-wrap align-start justify-space-between ga-4 mb-5">
          <div>
            <div class="text-caption text-medium-emphasis mb-1">{{ store.selectedHall?.name }} / {{ exhibit?.code }}</div>
            <h1 class="text-h4 font-weight-bold project-mark">{{ exhibit?.title || '请选择展项' }}</h1>
            <div class="text-body-2 text-medium-emphasis mt-2">
              <template v-if="isMaster">
                中文主稿
                <v-chip v-if="exhibit && exhibit.masterVersion > 0" size="x-small" variant="tonal" color="primary" class="ms-1">v{{ exhibit.masterVersion }} · {{ exhibit.masterFrozenAt ? formatTime(exhibit.masterFrozenAt) : '' }} 定稿</v-chip>
                <span v-if="exhibit && exhibit.masterVersion === 0" class="ms-1">· 尚未定稿</span>
              </template>
              <template v-else>
                当前语言：{{ currentLanguage?.label }}
                <template v-if="draft?.syncBaseline">
                  · 依据中文主稿
                  <v-chip size="x-small" variant="tonal" :color="exhibit && draft.syncBaselineVersion < exhibit.masterVersion ? 'orange-darken-2' : 'success'" class="ms-1">
                    v{{ draft.syncBaselineVersion }}
                  </v-chip>
                  <template v-if="exhibit && draft.syncBaselineVersion < exhibit.masterVersion">
                    → 当前
                    <v-chip size="x-small" variant="tonal" color="primary" class="ms-1">v{{ exhibit.masterVersion }}</v-chip>
                  </template>
                </template>
                <template v-else> · 尚未随中文定稿</template>
              </template>
              ·
              {{ draft?.updatedAt ? `最后更新 ${formatTime(draft.updatedAt)}` : '尚未建立文稿' }}
            </div>
          </div>
          <div class="d-flex ga-2">
            <v-btn variant="outlined" prepend-icon="mdi-undo" :disabled="!store.canUndo" @click="store.undo">撤销</v-btn>
            <v-btn variant="outlined" prepend-icon="mdi-redo" :disabled="!store.canRedo" @click="store.redo">重做</v-btn>
            <v-btn variant="outlined" prepend-icon="mdi-history" @click="activeTab = 'versions'">版本</v-btn>
          </div>
        </div>

        <v-alert v-if="store.notice" class="mb-4" color="secondary" variant="tonal" closable @click:close="store.notice = ''">{{ store.notice }}</v-alert>

        <v-alert
          v-if="draft && isMaster && exhibit && exhibit.masterVersion > 0 && draft.status !== 'approved'"
          class="mb-4"
          color="warning"
          variant="tonal"
          icon="mdi-alert-outline"
        >
          中文主稿在 v{{ exhibit.masterVersion }} 定稿后又有改动，当前状态为“{{ store.statusLabel(draft.status) }}”。已定稿译文已转为待同步，译文内容保留。
        </v-alert>
        <v-alert
          v-else-if="draft && !isMaster && draft.status === 'syncing' && syncInfo"
          class="mb-4"
          color="orange-darken-2"
          variant="tonal"
          icon="mdi-sync-alert"
        >
          中文主稿已更新到 v{{ syncInfo.masterVersion }}，本稿有 {{ syncInfo.pendingCount }} 处与主稿不一致待确认（{{ syncInfo.confirmedCount }} 处已确认<template v-if="syncInfo.lockedKeptCount">，{{ syncInfo.lockedKeptCount }} 处锁定保留</template>）。逐段确认后才能重新定稿，已有译文不会丢失。
        </v-alert>

        <v-tabs v-model="activeTab" color="primary" bg-color="surface" rounded="lg" class="mb-4 px-2">
          <v-tab value="editor">脚本编辑</v-tab>
          <v-tab value="versions">版本比较</v-tab>
          <v-tab value="preview">设备预览</v-tab>
          <v-tab value="sources">资料核对</v-tab>
        </v-tabs>

        <div v-if="draft">
          <v-window v-model="activeTab" :touch="false">
            <v-window-item value="editor">
              <v-row>
                <v-col cols="12" lg="8">
                  <v-card class="script-card pa-4 pa-md-6">
                    <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-5">
                      <div>
                        <div class="section-title">当前文稿</div>
                        <div class="text-h6 font-weight-bold mt-1">{{ currentLanguage?.label }}</div>
                      </div>
                      <div class="d-flex flex-wrap ga-2">
                        <v-chip v-if="draft.status === 'syncing'" color="orange-darken-2" variant="tonal" size="default" class="align-center">
                          <v-icon start size="small">mdi-sync-alert</v-icon>待同步
                        </v-chip>
                        <v-select
                          v-if="draft.status !== 'syncing'"
                          :model-value="draft.status"
                          :items="statusOptions.filter(option => !option.disabled)"
                          item-title="label"
                          item-value="value"
                          label="审校状态"
                          hide-details
                          style="min-width:150px"
                          @update:model-value="store.setStatus"
                        />
                        <v-btn
                          v-if="draft.status === 'syncing'"
                          color="success"
                          variant="tonal"
                          prepend-icon="mdi-check-decagram-outline"
                          :disabled="!store.canFinalize(draft)"
                          @click="refinalize"
                        >
                          重新定稿{{ syncInfo && syncInfo.pendingCount ? `（余 ${syncInfo.pendingCount} 处）` : '' }}
                        </v-btn>
                        <v-btn color="primary" variant="tonal" prepend-icon="mdi-plus" @click="store.addSegment">新增段落</v-btn>
                      </div>
                    </div>

                    <v-text-field label="展项标题" :model-value="draft.title" hint="面向观众的主标题" persistent-hint @change="saveDraftField('title', $event)" />
                    <v-row class="mt-2">
                      <v-col cols="12" md="5">
                        <v-text-field label="预计朗读时长（分钟）" type="number" min="0" step="0.5" :model-value="draft.durationMinutes" @change="saveDraftField('durationMinutes', $event)" />
                      </v-col>
                      <v-col cols="12" md="7">
                        <v-text-field label="资料来源" :model-value="draft.sources" hint="书籍、档案号或专家核验记录" persistent-hint @change="saveDraftField('sources', $event)" />
                      </v-col>
                    </v-row>

                    <div class="section-title mt-6 mb-2">完整讲解词</div>
                    <v-textarea label="讲解词" rows="7" auto-grow counter :model-value="draft.narration" @change="saveDraftField('narration', $event)" />

                    <div class="section-title mt-6 mb-2">无障碍描述</div>
                    <v-textarea label="无障碍描述" rows="4" auto-grow hint="描述尺寸、材质、色彩与可触摸特征，避免只依赖视觉" persistent-hint :model-value="draft.accessibility" @change="saveDraftField('accessibility', $event)" />
                  </v-card>

                  <v-card class="script-card pa-4 pa-md-6 mt-5">
                    <div class="d-flex align-center justify-space-between mb-4">
                      <div>
                        <div class="section-title">分段校对</div>
                        <div class="text-body-2 text-medium-emphasis mt-1">锁定段落不会被编辑；可在撤销中恢复。</div>
                      </div>
                      <v-chip variant="tonal">{{ draft.segments.filter(item => item.locked).length }}/{{ draft.segments.length }} 已锁定</v-chip>
                    </div>
                    <div class="d-flex flex-column ga-3">
                      <div
                        v-for="(segment, index) in draft.segments"
                        :key="segment.id"
                        class="segment-row"
                        :class="{ locked: segment.locked, 'sync-pending': !isMaster && syncInfo?.segments[index]?.state === 'pending' }"
                      >
                        <div class="d-flex align-center ga-2">
                          <v-btn icon size="small" variant="text" :aria-label="segment.locked ? '解锁段落' : '锁定段落'" @click="store.toggleLock(segment.id)">
                            {{ segment.locked ? '🔒' : '🔓' }}
                          </v-btn>
                          <v-text-field :model-value="segment.label" density="compact" hide-details variant="plain" :readonly="segment.locked" :aria-label="`第 ${index + 1} 段标题`" @change="saveSegment(segment.id, 'label', $event)" />
                          <v-chip v-if="segment.locked" color="success" size="small" variant="tonal">已确认</v-chip>
                          <v-chip
                            v-if="!isMaster && syncInfo?.segments[index]"
                            :color="syncStateMeta[syncInfo.segments[index].state].color"
                            size="small"
                            variant="tonal"
                          >{{ syncStateMeta[syncInfo.segments[index].state].label }}</v-chip>
                          <v-btn icon="mdi-delete-outline" size="small" variant="text" color="error" :disabled="segment.locked" :aria-label="`删除第 ${index + 1} 段`" @click="deleteTarget = segment.id" />
                        </div>
                        <v-textarea class="mt-2" :model-value="segment.content" rows="2" auto-grow hide-details :readonly="segment.locked" :aria-label="segmentLabel(segment)" @change="saveSegment(segment.id, 'content', $event)" />
                        <div v-if="!isMaster && syncInfo?.segments[index]?.state === 'pending'" class="mt-2 pa-2 rounded master-ref">
                          <div class="text-caption text-medium-emphasis mb-1">中文主稿 v{{ syncInfo.masterVersion }} 对应段落：</div>
                          <div class="text-body-2" style="white-space:pre-wrap">{{ syncInfo.segments[index].masterContent || '（中文主稿已删除该段）' }}</div>
                        </div>
                      </div>
                    </div>
                  </v-card>

                  <v-card v-if="!isMaster && syncInfo" class="script-card pa-4 pa-md-6 mt-5 sync-panel" :class="{ 'has-pending': syncInfo.hasPending }">
                    <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-3">
                      <div>
                        <div class="section-title">与中文主稿同步</div>
                        <div class="text-body-2 text-medium-emphasis mt-1">
                          依据 v{{ draft.syncBaselineVersion }} 定稿，当前中文主稿为 v{{ syncInfo.masterVersion }}
                        </div>
                      </div>
                      <v-chip :color="syncInfo.hasPending ? 'orange-darken-2' : 'success'" variant="tonal">
                        {{ syncInfo.pendingCount }} 待处理 / {{ syncInfo.confirmedCount }} 已确认 / {{ syncInfo.lockedKeptCount }} 锁定保留
                      </v-chip>
                    </div>
                    <v-alert v-if="syncInfo.hasPending" type="warning" variant="tonal" density="compact" class="mb-4">
                      请逐段核对下方与中文主稿不一致的内容，全部确认后才能重新定稿。锁定段落保留原译文，无需处理。
                    </v-alert>
                    <v-alert v-else-if="syncInfo.masterDirty" type="info" variant="tonal" density="compact" class="mb-4">
                      中文稿 v{{ syncInfo.masterVersion }} 定稿后仍有改动且尚未重新定稿；以下比对按中文稿当前内容进行。
                    </v-alert>
                    <v-alert v-else type="success" variant="tonal" density="compact" class="mb-4">
                      所有段落均已与中文主稿 v{{ syncInfo.masterVersion }} 对齐，可以重新定稿。
                    </v-alert>

                    <div class="d-flex flex-column ga-3">
                      <div v-for="item in syncInfo.fields" :key="`field-${item.field}`" class="sync-item" :class="`is-${item.state}`">
                        <div class="d-flex align-center justify-space-between ga-2">
                          <div class="d-flex align-center ga-2">
                            <v-icon size="18" :color="item.state === 'pending' ? 'warning' : item.state === 'confirmed' ? 'success' : 'secondary'">
                              {{ item.state === 'pending' ? 'mdi-clock-alert-outline' : item.state === 'confirmed' ? 'mdi-check-circle-outline' : 'mdi-lock-outline' }}
                            </v-icon>
                            <span class="font-weight-medium">{{ item.label }}</span>
                            <v-chip :color="syncStateMeta[item.state].color" size="x-small" variant="tonal">{{ syncStateMeta[item.state].label }}</v-chip>
                          </div>
                          <v-btn v-if="item.state === 'pending'" size="x-small" color="primary" variant="tonal" @click="store.confirmSyncItem('field', item.field)">确认一致</v-btn>
                          <v-btn v-else-if="item.state === 'confirmed' && item.changed" size="x-small" variant="text" @click="store.unconfirmSyncItem('field', item.field)">退回待处理</v-btn>
                        </div>
                        <div v-if="item.state === 'pending'" class="mt-2 master-ref pa-2 rounded">
                          <div class="text-caption text-medium-emphasis mb-1">中文主稿当前内容：</div>
                          <div class="text-body-2" style="white-space:pre-wrap">{{ item.masterValue }}</div>
                        </div>
                      </div>

                      <v-divider />

                      <div v-for="item in syncInfo.segments" :key="`segment-${item.index}`" class="sync-item" :class="`is-${item.state}`">
                        <div class="d-flex align-center justify-space-between ga-2 flex-wrap">
                          <div class="d-flex align-center ga-2">
                            <v-icon size="18" :color="item.state === 'pending' ? 'warning' : item.state === 'confirmed' ? 'success' : 'secondary'">
                              {{ item.state === 'pending' ? 'mdi-clock-alert-outline' : item.state === 'confirmed' ? 'mdi-check-circle-outline' : 'mdi-lock-outline' }}
                            </v-icon>
                            <span class="font-weight-medium">第 {{ item.index + 1 }} 段 · {{ item.label }}</span>
                            <v-chip :color="syncStateMeta[item.state].color" size="x-small" variant="tonal">{{ syncStateMeta[item.state].label }}</v-chip>
                            <v-chip v-if="item.masterRemoved" size="x-small" variant="outlined" color="error">中文已删除</v-chip>
                            <v-chip v-else-if="!item.present" size="x-small" variant="outlined" color="primary">中文新增</v-chip>
                          </div>
                          <v-btn v-if="item.state === 'pending'" size="x-small" color="primary" variant="tonal" @click="store.confirmSyncItem('segment', item.index)">确认一致</v-btn>
                          <v-btn v-else-if="item.state === 'confirmed'" size="x-small" variant="text" @click="store.unconfirmSyncItem('segment', item.index)">退回待处理</v-btn>
                        </div>
                        <div v-if="item.state === 'locked'" class="mt-2 master-ref pa-2 rounded">
                          <div class="text-caption text-medium-emphasis">该段在译文中已锁定，保留原译文，不参与本次同步。</div>
                        </div>
                        <div v-if="item.state === 'pending'" class="mt-2 master-ref pa-2 rounded">
                          <div class="text-caption text-medium-emphasis mb-1">中文主稿当前内容：</div>
                          <div class="text-body-2" style="white-space:pre-wrap">{{ item.masterContent || '（中文主稿已删除该段）' }}</div>
                        </div>
                      </div>
                    </div>
                  </v-card>
                </v-col>

                <v-col cols="12" lg="4">
                  <v-card class="script-card pa-5">
                    <div class="section-title mb-4">同展项语言进度</div>
                    <div v-for="lang in LANGUAGES" :key="lang.id" class="d-flex align-center ga-3 mb-4">
                      <v-progress-circular :model-value="store.completionFor(exhibit!, lang.id)" size="52" width="5" :color="lang.id === store.selectedLanguageId ? 'primary' : 'secondary'">
                        {{ store.completionFor(exhibit!, lang.id) }}
                      </v-progress-circular>
                      <div class="flex-grow-1">
                        <div class="font-weight-medium d-flex align-center ga-2 flex-wrap">
                          {{ lang.label }}
                          <v-chip v-if="lang.id === exhibit?.masterLanguageId" size="x-small" variant="outlined" color="primary">主稿</v-chip>
                        </div>
                        <div class="text-caption text-medium-emphasis d-flex align-center ga-1 flex-wrap">
                          <template v-if="exhibit?.drafts.find(item => item.languageId === lang.id)">
                            <span :class="{ 'text-orange-darken-3 font-weight-bold': isSyncingLanguage(lang.id) }">
                              {{ store.statusLabel(exhibit!.drafts.find(item => item.languageId === lang.id)!.status) }}
                            </span>
                            <template v-if="lang.id === exhibit?.masterLanguageId && exhibit.masterVersion > 0">· 主稿 v{{ exhibit.masterVersion }}</template>
                            <template v-else-if="syncStateOf(lang.id)">
                              · 基于 v{{ exhibit!.drafts.find(item => item.languageId === lang.id)!.syncBaselineVersion }}
                              <span v-if="syncStateOf(lang.id)!.pendingCount" class="text-orange-darken-3">· {{ syncStateOf(lang.id)!.pendingCount }} 处待确认</span>
                            </template>
                          </template>
                          <template v-else>尚未创建</template>
                        </div>
                      </div>
                      <v-btn size="small" variant="text" :disabled="lang.id === store.selectedLanguageId" @click="store.selectLanguage(lang.id)">切换</v-btn>
                    </div>
                  </v-card>
                  <v-card class="script-card pa-5 mt-5">
                    <div class="section-title mb-3">审校检查</div>
                    <v-list density="compact" class="bg-transparent">
                      <v-list-item :prepend-icon="draft.narration.length > 80 ? 'mdi-check-circle' : 'mdi-alert-circle'" :title="`讲解词 ${draft.narration.length} 字`" />
                      <v-list-item :prepend-icon="draft.accessibility.length > 30 ? 'mdi-check-circle' : 'mdi-alert-circle'" :title="`无障碍描述 ${draft.accessibility.length} 字`" />
                      <v-list-item :prepend-icon="draft.sources ? 'mdi-check-circle' : 'mdi-alert-circle'" :title="draft.sources ? '资料来源已填写' : '缺少资料来源'" />
                    </v-list>
                    <v-alert class="mt-3" type="info" variant="tonal" density="compact">
                      估算语速约 {{ Math.max(1, Math.round(draft.narration.length / 220 * 10) / 10) }} 分钟，请与目标时长核对。
                    </v-alert>
                  </v-card>
                </v-col>
              </v-row>
            </v-window-item>

            <v-window-item value="versions">
              <v-card class="script-card pa-4 pa-md-6">
                <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-5">
                  <div>
                    <div class="section-title">版本比较</div>
                    <div class="text-h6 font-weight-bold mt-1">选择同一展项、同一语言的两个快照</div>
                  </div>
                  <v-btn color="primary" prepend-icon="mdi-content-save-plus-outline" @click="versionDialog = true">保存当前版本</v-btn>
                </div>
                <v-alert v-if="versions.length < 2" type="info" variant="tonal">至少保存两个版本后即可比较。当前有 {{ versions.length }} 个版本。</v-alert>
                <template v-else>
                  <v-row>
                    <v-col cols="12" md="6"><v-select v-model="compareA" :items="versions" item-title="name" item-value="id" label="基准版本" /></v-col>
                    <v-col cols="12" md="6"><v-select v-model="compareB" :items="versions" item-title="name" item-value="id" label="目标版本" /></v-col>
                  </v-row>
                  <div class="d-flex ga-4 text-caption text-medium-emphasis mb-2">
                    <span><span class="status-dot" style="background:#9b2c25" /> 删除</span>
                    <span><span class="status-dot" style="background:#2f6b45" /> 新增</span>
                  </div>
                  <div class="rounded-lg border pa-3 bg-white">
                    <p v-for="(line, index) in diffLines" :key="index" class="diff-line" :class="`diff-${line.type}`">{{ line.text }}</p>
                    <div v-if="!diffLines.length" class="text-medium-emphasis pa-4">所选版本内容一致。</div>
                  </div>
                  <v-list class="mt-4 bg-transparent">
                    <v-list-item v-for="version in versions" :key="version.id" :title="version.name" :subtitle="formatTime(version.createdAt)">
                      <template #append><v-btn variant="outlined" size="small" @click="store.restoreVersion(version.id)">恢复此版</v-btn></template>
                    </v-list-item>
                  </v-list>
                </template>
              </v-card>
            </v-window-item>

            <v-window-item value="preview">
              <v-card class="script-card pa-4 pa-md-6">
                <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-5">
                  <div>
                    <div class="section-title">设备排版预览</div>
                    <div class="text-h6 font-weight-bold mt-1">以展项实际阅读顺序预览</div>
                  </div>
                  <v-btn-toggle v-model="device" mandatory variant="outlined" divided>
                    <v-btn v-for="item in deviceOptions" :key="item.value" :value="item.value">{{ item.label }}</v-btn>
                  </v-btn-toggle>
                </div>
                <div class="preview-frame" :class="device">
                  <div class="preview-content">
                    <div class="text-overline text-medium-emphasis">{{ exhibit?.code }} · {{ currentLanguage?.label }}</div>
                    <h2 class="text-h4 font-weight-bold mt-2">{{ draft.title }}</h2>
                    <p class="text-body-1 mt-6" style="line-height:1.9;white-space:pre-wrap">{{ draft.narration }}</p>
                    <v-divider class="my-6" />
                    <div class="section-title">无障碍描述</div>
                    <p class="text-body-2 mt-2" style="line-height:1.8;white-space:pre-wrap">{{ draft.accessibility }}</p>
                    <div class="mt-7 text-caption text-medium-emphasis">预计讲解 {{ draft.durationMinutes }} 分钟</div>
                  </div>
                </div>
              </v-card>
            </v-window-item>

            <v-window-item value="sources">
              <v-row>
                <v-col cols="12" md="7">
                  <v-card class="script-card pa-5">
                    <div class="section-title mb-3">来源与核验记录</div>
                    <v-textarea :model-value="draft.sources" rows="8" @change="saveDraftField('sources', $event)" />
                    <v-alert class="mt-4" type="warning" variant="tonal">发布前请由内容负责人逐条核对来源。当前无障碍描述与实物尺寸需由教育部门复核。</v-alert>
                  </v-card>
                </v-col>
                <v-col cols="12" md="5">
                  <v-card class="script-card pa-5">
                    <div class="section-title mb-3">段落锁定概况</div>
                    <v-timeline density="compact" side="end">
                      <v-timeline-item v-for="segment in draft.segments" :key="segment.id" :dot-color="segment.locked ? 'success' : 'grey'" size="small">
                        <div class="font-weight-medium">{{ segment.label }}</div>
                        <div class="text-caption text-medium-emphasis">{{ segment.locked ? '已锁定，审校确认' : '编辑中' }}</div>
                      </v-timeline-item>
                    </v-timeline>
                  </v-card>
                </v-col>
              </v-row>
            </v-window-item>
          </v-window>
        </div>
        <v-empty-state v-else icon="mdi-script-text-outline" title="尚未选择展项" text="请从左侧选择一个展厅和展项。" />
      </div>
    </v-main>

    <v-dialog v-model="versionDialog" max-width="520">
      <v-card class="pa-3">
        <v-card-title>保存版本快照</v-card-title>
        <v-card-text>
          <p class="mb-4 text-medium-emphasis">将当前“{{ draft?.title }}”的完整内容和锁定状态保存为只读版本。</p>
          <v-text-field v-model="versionName" label="版本名称（可选）" autofocus @keyup.enter="submitVersion" />
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn @click="versionDialog = false">取消</v-btn><v-btn color="primary" @click="submitVersion">保存快照</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog :model-value="Boolean(deleteTarget)" max-width="440" @update:model-value="deleteTarget = null">
      <v-card class="pa-3">
        <v-card-title>删除这个段落？</v-card-title>
        <v-card-text>删除后可使用撤销恢复。</v-card-text>
        <v-card-actions><v-spacer /><v-btn @click="deleteTarget = null">取消</v-btn><v-btn color="error" @click="confirmDelete">删除</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="helpDialog" max-width="520">
      <v-card class="pa-3">
        <v-card-title>键盘操作</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item prepend-icon="mdi-apple-keyboard-command" title="Ctrl / ⌘ + Z" subtitle="撤销上一步编辑" />
            <v-list-item prepend-icon="mdi-redo" title="Ctrl / ⌘ + Shift + Z" subtitle="重做" />
            <v-list-item prepend-icon="mdi-content-save-outline" title="Ctrl / ⌘ + S" subtitle="保存当前版本快照" />
            <v-list-item prepend-icon="mdi-keyboard-tab" title="Tab / Shift + Tab" subtitle="在字段、状态与段落操作之间移动" />
          </v-list>
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn color="primary" @click="helpDialog = false">知道了</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar :model-value="Boolean(store.notice)" timeout="2600" location="bottom right" @update:model-value="store.notice = ''">
      {{ store.notice }}
      <template #actions><v-btn variant="text" @click="store.notice = ''">关闭</v-btn></template>
    </v-snackbar>
  </v-app>
</template>
