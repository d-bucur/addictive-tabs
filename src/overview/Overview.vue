<script setup lang="ts">
import type { Bookmarks } from 'webextension-polyfill'
import type { Tabs } from 'webextension-polyfill/namespaces/tabs'
import type { ListOfTabs, TabItem } from '~/composables/utils'
import { faviconURL } from '~/composables/utils'

async function getCurrentTabs() {
  const v = await browser.tabs.query({
    currentWindow: true,
  })
  return v
}

// TODO better to use reactive or ref?
const currentTabs: Tabs.Tab[] = reactive([])

function updateTabList() {
  getCurrentTabs().then((t) => {
    currentTabs.length = 0
    currentTabs.push(...t)
  })
}

function bookmarkMapper(bm: Bookmarks.BookmarkTreeNode): TabItem {
  return {
    id: bm.id,
    title: bm.title,
    url: bm.url,
    favIconUrl: faviconURL(bm.url),
  }
}

const BOOKMARK_TREE_ID = '1'
const bookmarkTree = ref([]) as Ref<Array<ListOfTabs>>
async function fillBookmarkTree() {
  const subTree = await browser.bookmarks.getSubTree(BOOKMARK_TREE_ID)
  bookmarkTree.value = subTree[0].children?.map(s => ({
    id: s.id,
    children: s.children?.map(bookmarkMapper),
    title: s.title,
  })) // TODO handle edge cases
}

onMounted(async () => {
  updateTabList()
  browser.tabs.onCreated.addListener(_t => updateTabList())
  browser.tabs.onRemoved.addListener(_t => updateTabList())
  // updateBookmarksList()
  await fillBookmarkTree()
  console.log(browser.bookmarks.getTree())
})
</script>

<template>
  <main class="px-4 py-10 text-center text-gray-700 dark:text-gray-200">
    <div flex>
      <TabList :items="currentTabs" name="Open tabs" />
      <TabList v-for="bm in bookmarkTree" :key="bm.id" :items="bm.children" :name="bm.title" />
      <div />
    </div>
  </main>
</template>
