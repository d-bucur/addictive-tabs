<script setup lang="ts">
// @ts-expect-error: aa
import MaterialSymbolsFolderManagedOutline from '~icons/material-symbols/folder-managed-outline'
import type { IBookmarkFolder } from '~/logic/bookmarkUtils'
import { getFullPath, getSiblings } from '~/logic/bookmarkUtils'

const props = defineProps<{
  rootId: string
}>()
const emit = defineEmits(['update:rootId'])

const folderPath = ref([] as IBookmarkFolder[])
const siblings = ref([] as IBookmarkFolder[])

onMounted(async () => {
  folderPath.value = await getFullPath(props.rootId)
  siblings.value = await getSiblings(props.rootId)
})

function openConfigPage() {
  browser.tabs.create({ url: `chrome://bookmarks/?id=${props.rootId}` })
}
</script>

<template>
  <div class="bm-selector">
    <div class="btn-group">
      <button class="btn" :title="`Root folder: ${folderPath.map(f => f.title).join('/')} (config coming soon)`" @click="openConfigPage">
        <MaterialSymbolsFolderManagedOutline />
      </button>
      <button v-for="s in siblings" :key="s.id" :class="{ 'btn-selected': s.id === rootId }" class="btn" @click="emit('update:rootId', s.id)">
        {{ s.title }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.bm-selector {
  display: flex;
  align-items: center;
  gap: var(--space-m);
}
</style>
