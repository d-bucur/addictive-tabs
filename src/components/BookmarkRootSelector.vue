<script setup lang="ts">
// @ts-expect-error: aa
import MaterialSymbolsFolderManagedOutline from '~icons/material-symbols/folder-managed-outline'
import type { IBookmarkFolder } from '~/logic/bookmarkUtils'
import { getFullPath, getSiblings } from '~/logic/bookmarkUtils'

const props = defineProps<{
  rootId: string
}>()
defineEmits(['update:rootId'])

const folderPath = ref([] as IBookmarkFolder[])

const folderName = computed(() => folderPath.value.length > 0 ? folderPath.value[folderPath.value.length - 1].title : '')

const siblings = ref([] as IBookmarkFolder[])

// TODO make modelValue reactive
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
    <a class="btn" :title="`Root folder (config coming soon): ${folderPath.map(f => f.title).join('/')}`" @click="openConfigPage">
      <MaterialSymbolsFolderManagedOutline />
    </a>
    <div class="btn-group">
      <button v-for="s in siblings" :key="s.id" :class="{ 'btn-selected': s.id === rootId }" class="btn">
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
