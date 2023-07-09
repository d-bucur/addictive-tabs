<script setup lang="ts">
import type { Group } from '~/composables/utils'

const props = defineProps<{
  id: string
  groupData: Group
}>()

// TODO typesafe emits
const emit = defineEmits(['bind', 'persist', 'restore', 'unbind', 'archive'])

onMounted(() => console.log('Updating list', props.groupData))
</script>

<template>
  <div flex flex-col border border-rounded w-xl>
    <div text-lg bg-blue-2>
      {{ groupData.title }}
    </div>
    <div flex flex-row>
      <button v-if="groupData.windowId && !groupData.bookmarkId" grow class="btn" @click="emit('bind', id)">
        Bind
      </button>
      <button v-if="groupData.windowId && groupData.bookmarkId" grow class="btn" @click="emit('persist', id)">
        Persist
      </button>
      <button v-if="groupData.windowId" grow class="btn" @click="emit('archive', id)">
        Archive
      </button>
      <button v-if="groupData.windowId && groupData.bookmarkId" grow class="btn" @click="emit('unbind', id)">
        Unbind
      </button>
      <button v-if="groupData.bookmarkId && !groupData.windowId" grow class="btn" @click="emit('restore', id)">
        Restore
      </button>
    </div>
    <ul>
      <li v-for="item in groupData.tabs" :key="item.id" flex flex-content-start gap-1em p-1em>
        <img :src="item.favIconUrl" w-5 h-5>
        <div :title="item.url" text-left>
          {{ item.title }}
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.btn {
  /* border-width: 1px;
  border-color: rgba(96, 165, 250); */
  @apply border border-blue
}
</style>
