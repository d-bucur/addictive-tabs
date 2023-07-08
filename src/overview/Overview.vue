<script setup lang="ts">
import { type Bookmarks } from 'webextension-polyfill'
import type { ListOfTabs, TabItem } from '~/composables/utils'
import { faviconURL } from '~/composables/utils'

async function getCurrentTabs() {
  const v = await browser.tabs.query({
    currentWindow: true,
  })
  return v
}

// TODO better to use reactive or ref?
// const currentTabs: Tabs.Tab[] = reactive([])

// function updateTabList() {
//   getCurrentTabs().then((t) => {
//     currentTabs.length = 0
//     currentTabs.push(...t)
//   })
// }

const tabsByWindow = reactive({ value: {} })
async function fillActiveTabs() {
  tabsByWindow.value = {}
  const tabs = await browser.tabs.query({})
  tabs.forEach((t) => {
    if (!tabsByWindow.value[t.windowId]) {
      tabsByWindow.value[t.windowId] = {
        title: t.windowId,
        children: [],
      }
    }
    tabsByWindow.value[t.windowId].children.push(t)
  })
  console.log('Active tabs', tabsByWindow.value)
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
  await fillActiveTabs()
  browser.tabs.onCreated.addListener(_t => fillActiveTabs())
  browser.tabs.onRemoved.addListener(_t => fillActiveTabs())
  // updateBookmarksList()
  await fillBookmarkTree()
  console.log(browser.bookmarks.getTree())
})
</script>

<template>
  <main class="px-4 py-10 text-center text-gray-700 dark:text-gray-200">
    <div flex>
      <TabList
        v-for="t in Object.keys(tabsByWindow.value)" :key="t"
        :items="tabsByWindow.value[t].children"
        :name="tabsByWindow.value[t].title"
      />
      <TabList v-for="bm in bookmarkTree" :key="bm.id" :items="bm.children" :name="bm.title" />
      <div />
    </div>
  </main>
</template>
