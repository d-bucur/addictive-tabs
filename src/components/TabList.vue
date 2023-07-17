<script setup lang="ts">
import type { Group, ListTypeEnum } from '~/composables/utils'
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
  groupData: Group
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
    <div
      text-lg bg-coolgray-200 dark:bg-gray-900
      :class="{ 'win-titlebar': isWindow, 'bound-titlebar': isBounded }"
    >
      <!-- <span>{{ groupData.title }}</span> -->
      <input bg-transparent :value="groupData.title" @change="titleUpdateHandler">
    </div>
    <div flex flex-row gap-1em mla p-1>
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
        <!-- <span i-material-symbols-delete-outline-rounded text-3rem>a</span> -->
        <MaterialSymbolsDeleteOutlineRounded />
        <!-- Remove -->
      </button> <!-- TODO add confirmation -->
    </div>
    <ul p-2 overflow-auto>
      <li v-for="item in groupData.tabs" :key="item.id" flex flex-content-start p-1>
        <img :src="item.favIconUrl" w-5 h-5 m-r2 border-rounded border-coolGray-2>
        <div :title="item.url" text-nowrap text-left overflow-hidden>
          {{ item.title }}
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.win-titlebar {
  @apply bg-warmgray-200 dark:bg-warmgray-900
}
.bound-titlebar {
  @apply bg-bluegray-200 dark:bg-truegray-800
}
</style>
