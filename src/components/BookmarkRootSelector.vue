<script setup lang="ts">
// @ts-expect-error: aa
import MaterialSymbolsFolderManagedOutline from '~icons/material-symbols/folder-managed-outline'
import type { IBookmarkFolder } from '~/logic/bookmarkUtils'
import { getFullPath } from '~/logic/bookmarkUtils'

const props = defineProps<{
  modelValue: string
}>()
defineEmits(['update:modelValue'])

const folderPath = ref([] as IBookmarkFolder[])

const folderName = computed(() => folderPath.value.length > 0 ? folderPath.value[folderPath.value.length - 1].title : '')

onMounted(async () => {
  folderPath.value = await getFullPath(props.modelValue)
})
</script>

<template>
  <div class="bm-selector">
    <button class="btn" title="Configuration coming soon">
      <MaterialSymbolsFolderManagedOutline />
    </button>
    <div :title="`Root folder: ${folderPath.map(f => f.title).join('/')}`">
      {{ folderName }}
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
