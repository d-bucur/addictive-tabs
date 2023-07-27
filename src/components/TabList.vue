<script setup lang="ts">
import type { IGroup, ITabItem, ListTypeEnum } from '~/logic/groupUtils'
// @ts-expect-error: ts
import IcRoundInsertLink from '~icons/ic/round-insert-link'
// @ts-expect-error: is
import AkarIconsLinkChain from '~icons/akar-icons/link-chain'
// @ts-expect-error: still
import MaterialSymbolsDeleteOutlineRounded from '~icons/material-symbols/delete-outline-rounded'
// @ts-expect-error: missing
import MaterialSymbolsCancelOutline from '~icons/material-symbols/cancel-outline'
// @ts-expect-error: block
import IcBaselineSaveAlt from '~icons/ic/baseline-save-alt'
// @ts-expect-error: ignore
import MaterialSymbolsMemoryAltOutlineRounded from '~icons/material-symbols/memory-alt-outline-rounded'
// @ts-expect-error: after
import IcBaselineSave from '~icons/ic/baseline-save'
// @ts-expect-error: 6 years
import MaterialSymbolsUpload from '~icons/material-symbols/upload'
// @ts-expect-error: https://github.com/Microsoft/TypeScript/issues/19573
import StreamlineInterfaceLinkBrokenBreakBrokenHyperlinkLinkRemoveUnlink from '~icons/streamline/interface-link-broken-break-broken-hyperlink-link-remove-unlink'

const props = defineProps<{
  id: string
  groupData: IGroup
  type: ListTypeEnum
}>()

// TODO typesafe emits
const emit = defineEmits(['bind', 'persist', 'restore', 'unbind', 'archive', 'rename', 'remove', 'close', 'discard'])
const extendedActions = true
const isBounded = computed(() => props.groupData.windowId && props.groupData.bookmarkId)
const isWindow = computed(() => props.groupData.windowId && !props.groupData.bookmarkId)

// @ts-expect-error: value exists on event
const titleUpdateHandler = (e: Event) => emit('rename', props.id, e.target?.value, props.type)

function itemStyle(item: ITabItem): {} {
  if (item.subGroup?.color) {
    return {
      'border-left': `var(--fieldBorderWidth) solid ${item.subGroup!.color}`,
      'padding-left': 'var(--space-s)',
    }
  }
  return {}
}

// onMounted(() => console.log('Updating list', props.groupData))
</script>

<template>
  <div
    class="tab-group-card"
    flex flex-col self-start border-rounded w-xs max-h-100
    bg-coolgray-50 dark:bg-coolgray-800 shadow-md
  >
    <div class="title" :class="{ 'title-win': isWindow, 'title-bound': isBounded }">
      <input :value="groupData.title" @change="titleUpdateHandler">
      <IcRoundInsertLink v-if="isBounded" title="Linked to bookmark" />
    </div>
    <div class="buttons-row">
      <div class="btn-group">
        <button v-if="groupData.windowId" class="btn" title="Archive" @click="emit('archive', id)">
          <!-- Archive -->
          <IcBaselineSaveAlt />
        </button>
        <button v-if="extendedActions && groupData.windowId && !groupData.bookmarkId" class="btn" title="Bind" @click="emit('bind', id)">
          <!-- Bind -->
          <AkarIconsLinkChain />
        </button>
        <button v-if="extendedActions && groupData.windowId && groupData.bookmarkId" class="btn" title="Persist" @click="emit('persist', id)">
          <!-- Persist -->
          <IcBaselineSave />
        </button>
        <button v-if="groupData.windowId" class="btn" title="Free from memory" @click="emit('discard', id)">
          <!-- Free tab from memory -->
          <MaterialSymbolsMemoryAltOutlineRounded />
        </button>
        <button v-if="groupData.windowId && groupData.bookmarkId" title="Unbind" class="btn" @click="emit('unbind', id)">
          <!-- Unbind -->
          <StreamlineInterfaceLinkBrokenBreakBrokenHyperlinkLinkRemoveUnlink />
        </button>
        <button v-if="groupData.bookmarkId && !groupData.windowId" class="btn" title="Restore" @click="emit('restore', id)">
          <!-- Restore -->
          <MaterialSymbolsUpload />
        </button>
        <button v-if="groupData.windowId" class="btn" title="Close" @click="emit('close', id, props.type)">
          <!-- Close window -->
          <MaterialSymbolsCancelOutline />
        </button>
        <button v-if="groupData.bookmarkId" class="btn" title="Remove" @click="emit('remove', id, props.type)">
          <!-- Remove -->
          <!-- TODO add confirmation -->
          <MaterialSymbolsDeleteOutlineRounded />
        </button>
      </div>
    </div>
    <ul class="tab-list">
      <li v-for="item in groupData.tabs" :key="item.id" class="tab-item">
        <img :src="item.favIconUrl" class="favicon">
        <div :title="item.url" class="tab-text" :style="itemStyle(item)">
          {{ item.title }}
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.tab-group-card {
  display: flex;
  flex-direction: column;
  align-self: flex-start;
  border-radius: var(--radius);
  max-height: 25rem;
  width: 20rem;
  background-color: var(--c-background);
  overflow: hidden;
  /* box-shadow: 2px 2px 5px 3px rgba(0, 0, 0, 0.2); */
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.title {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  font-size: var(--text-s);
  background-color: var(--c-grey1);
  padding: var(--textFrameY) var(--textFrameX) var(--textFrameY) var(--textFrameX);
}

.title > input {
  background-color: transparent;
  width: 100%;
}

.title-win {
  background-color: var(--c-grey1);
}
.title-bound {
  background-color: var(--c-grey1);
}

.buttons-row {
  display: flex;
  gap: var(--space-s);
  padding: var(--space-s);
  justify-content: end;
  width: 100%;
}

.tab-list {
  padding: var(--space-l);
  padding-top: 0;
  overflow: auto;
  font-size: var(--text-s);
  line-height: var(--globalLineHeight);
}

.tab-item {
  display: flex;
  gap: var(--space-m);
  align-items: center;
  color: var(--c-body);
}

.tab-text {
  text-wrap: nowrap;
  overflow: hidden;
}

.favicon {
  width: 1rem;
  height: 1rem;
}

/* for sidebar */
@media (max-width: 500px) {
  .tab-group-card {
    width: 100% !important;
  }
}
</style>
