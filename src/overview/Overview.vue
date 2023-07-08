<script setup lang="ts">
import { type Bookmarks, type Tabs } from 'webextension-polyfill'
import type { Dictionary, Group, TabItem } from '~/composables/utils'
import { faviconURL } from '~/composables/utils'

const BOOKMARK_TREE_ID = '1'
const tabsGroups: { value: Dictionary<Group> } = reactive({ value: {} })

async function refreshGroups() {
  // TODO perf check if this renders multiple times. if so, use buffer
  tabsGroups.value = {}
  await refreshActiveWindows()
  await refreshBookmarks()
  console.log('Groups', tabsGroups.value)
}

function groupsAddTab(key: string, tab: TabItem, title?: string) {
  if (tabsGroups.value[key]) {
    tabsGroups.value[key].tabs.push(tab)
  }
  else {
    tabsGroups.value[key] = {
      title: title || key,
      tabs: [tab],
    }
  }
}

async function refreshActiveWindows() {
  const tabsRes = await browser.tabs.query({})
  tabsRes.forEach((tab) => {
    const tabItem = convertTab(tab)
    const winId = tab.windowId?.toString() || 'undefined'
    groupsAddTab(winId, tabItem) // might happen in some edge cases?
    tabsGroups.value[winId].windowId = winId
  })
  console.log('API tabs', tabsRes)
}

function convertTab(tab: Tabs.Tab): TabItem {
  return {
    id: tab.id?.toString() || 'undefined', // might happen in some edge cases?
    title: tab.title || 'undefined', // should never happen
    url: tab.url || 'undefined', // should never happen
    favIconUrl: tab.favIconUrl,
  }
}

async function refreshBookmarks() {
  const bmTree = await browser.bookmarks.getSubTree(BOOKMARK_TREE_ID)
  // TODO handle edge cases for nested arrays
  bmTree[0].children?.forEach((bmFolder) => {
    if (bmFolder.url)
      return
    bmFolder.children?.forEach((bm) => {
      const tabItem = convertBookmark(bm)
      groupsAddTab(bmFolder.id, tabItem, bmFolder.title)
      tabsGroups.value[bmFolder.id].bookmarkId = bmFolder.id
    })
  })
  console.log('API bms', bmTree)
}

function convertBookmark(bm: Bookmarks.BookmarkTreeNode): TabItem {
  return {
    id: bm.id,
    title: bm.title,
    url: bm.url || 'undefined', // should never happen
    favIconUrl: faviconURL(bm.url),
  }
}

const groupKeysIterator = computed(() => {
  const windows: string[] = []
  const bms: string[] = []
  Object.keys(tabsGroups.value).forEach((k) => {
    if (tabsGroups.value[k].windowId)
      windows.push(k)
    else bms.push(k)
  })
  return windows.concat(bms)
})

onMounted(async () => {
  await refreshGroups()
  // TODO handle updates better
  browser.tabs.onCreated.addListener(_t => refreshGroups())
  browser.tabs.onRemoved.addListener(_t => refreshGroups())
})
</script>

<template>
  <main class="px-4 py-10 text-center text-gray-700 dark:text-gray-200">
    <div flex>
      <TabList
        v-for="k in groupKeysIterator" :key="k"
        :items="tabsGroups.value[k].tabs"
        :name="tabsGroups.value[k].title"
      />
      <div />
    </div>
  </main>
</template>
