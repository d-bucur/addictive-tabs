<script setup lang="ts">
import type { IGroup, ListTypeEnum } from '~/logic/groupUtils'
// @ts-expect-error: ts is
import IcRoundInsertLink from '~icons/ic/round-insert-link'
// @ts-expect-error: still missing
import MaterialSymbolsDeleteOutlineRounded from '~icons/material-symbols/delete-outline-rounded'
// @ts-expect-error: block ignore
import IcBaselineSaveAlt from '~icons/ic/baseline-save-alt'
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
const emit = defineEmits(['bind', 'persist', 'restore', 'unbind', 'archive', 'rename', 'remove'])

const isBounded = computed(() => props.groupData.windowId && props.groupData.bookmarkId)
const isWindow = computed(() => props.groupData.windowId && !props.groupData.bookmarkId)

// @ts-expect-error: value exists on event
const titleUpdateHandler = (e: Event) => emit('rename', props.id, e.target?.value, props.type)

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
    </div>
    <div class="buttons">
      <button v-if="groupData.windowId && !groupData.bookmarkId" class="btn" title="Bind" @click="emit('bind', id)">
        <IcRoundInsertLink />
        <!-- Bind -->
      </button>
      <button v-if="groupData.windowId && groupData.bookmarkId" class="btn" title="Persist" @click="emit('persist', id)">
        <!-- Persist -->
        <IcBaselineSave />
      </button>
      <button v-if="groupData.windowId" class="btn" title="Archive" @click="emit('archive', id)">
        <!-- Archive -->
        <IcBaselineSaveAlt />
      </button>
      <button v-if="groupData.windowId && groupData.bookmarkId" title="Unbind" class="btn" @click="emit('unbind', id)">
        <!-- Unbind -->
        <StreamlineInterfaceLinkBrokenBreakBrokenHyperlinkLinkRemoveUnlink />
      </button>
      <button v-if="groupData.bookmarkId && !groupData.windowId" class="btn" title="Restore" @click="emit('restore', id)">
        <!-- Restore -->
        <MaterialSymbolsUpload />
      </button>
      <button class="btn" title="Remove" @click="emit('remove', id, props.type)">
        <!-- Remove -->
        <MaterialSymbolsDeleteOutlineRounded />
      </button> <!-- TODO add confirmation -->
    </div>
    <ul class="tab-list">
      <li v-for="item in groupData.tabs" :key="item.id" class="tab-item">
        <img :src="item.favIconUrl" class="favicon">
        <div :title="item.url" class="tab-text">
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
  /* border: 1px solid; */
  border-radius: var(--radius);
  max-height: 25rem;
  width: 20rem;
  background-color: var(--c-background);
  overflow: hidden;
  /* box-shadow: 2px 2px 5px 3px rgba(0, 0, 0, 0.2); */
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.title {
  font-size: var(--text-m);
  background-color: var(--c-grey1);
  padding: var(--textFrameY) var(--textFrameX) var(--textFrameY) var(--textFrameX);
}

.title > input {
  background-color: transparent;
  /* border: none; */
}

.title-win {
  background-color: var(--c-grey1);
}
.title-bound {
  background-color: var(--c-grey1);
}

.buttons {
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
}

.tab-item {
  display: flex;
  gap: var(--space-m);
  align-items: center;
  color: var(c-body);
}

.tab-text {
  text-wrap: nowrap;
  overflow: hidden;
  font-size: var(--text-s);
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
