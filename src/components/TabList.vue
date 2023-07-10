<script setup lang="ts">
import type { Group } from '~/composables/utils'

const props = defineProps<{
  id: string
  groupData: Group
}>()

// TODO typesafe emits
const emit = defineEmits(['bind', 'persist', 'restore', 'unbind', 'archive', 'rename'])

const isBounded = computed(() => props.groupData.windowId && props.groupData.bookmarkId)
const isWindow = computed(() => props.groupData.windowId && !props.groupData.bookmarkId)

// @ts-expect-error: value exists on event
const titleUpdateHandler = (e: Event) => emit('rename', props.id, e.target?.value)

onMounted(() => console.log('Updating list', props.groupData))
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
      <input bg-transparent :value="groupData.title" @input="titleUpdateHandler">
    </div>
    <div flex flex-row gap-1em mla p-1>
      <button v-if="groupData.windowId && !groupData.bookmarkId" class="btn" @click="emit('bind', id)">
        Bind
      </button>
      <button v-if="groupData.windowId && groupData.bookmarkId" class="btn" @click="emit('persist', id)">
        Persist
      </button>
      <button v-if="groupData.windowId" class="btn" @click="emit('archive', id)">
        Archive
      </button>
      <button v-if="groupData.windowId && groupData.bookmarkId" class="btn" @click="emit('unbind', id)">
        Unbind
      </button>
      <button v-if="groupData.bookmarkId && !groupData.windowId" class="btn" @click="emit('restore', id)">
        Restore
      </button>
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
