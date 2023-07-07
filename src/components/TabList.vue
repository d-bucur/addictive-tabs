<script setup lang="ts">
import type { TabItem } from '~/composables/utils'

const props = defineProps({
  name: String,
  items: Array<TabItem>,
})

const OUTPUT_ID = '19'

async function persist() {
  console.log('Persisting')
  const currentBookmarks = await browser.bookmarks.getSubTree(OUTPUT_ID)
  console.log('Existing', currentBookmarks)
  currentBookmarks[0].children?.forEach(bm => browser.bookmarks.remove(bm.id))

  props.items?.forEach(item => browser.bookmarks.create({
    title: item.title,
    url: item.url,
    parentId: OUTPUT_ID, // output tree
  }))
}

onUpdated(() => console.log(props.items))
</script>

<template>
  <div flex-row border border-rounded w-xl>
    <div text-lg bg-blue-2>
      {{ name }}
    </div>
    <button @click="persist">
      Persist
    </button>
    <ul>
      <li v-for="item in props.items" :key="item.id" flex flex-content-start gap-1em p-1em>
        <img :src="item.favIconUrl" w-5 h-5>
        <div :title="item.url" text-left>
          {{ item.title }}
        </div>
      </li>
    </ul>
  </div>
</template>
