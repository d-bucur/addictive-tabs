<script setup lang="ts">
import { type Bookmarks, type Tabs } from 'webextension-polyfill'
import type { Dictionary, Group, TabItem } from '~/composables/utils'
import { faviconURL } from '~/composables/utils'

const BOOKMARK_TREE_ID = '1'
const tabsGroups: { value: Dictionary<Group> } = reactive({ value: {} })
// TODO binding is also duplicated inside groups. refactor this later
const bindings: { windowToBookmark: Dictionary<string> } = reactive({ windowToBookmark: {} })

async function refreshGroups() {
  // TODO perf check if this renders multiple times. if so, use buffer
  // TODO more efficient rendering. don't clear every time but only update as necessary
  // TODO there can be a race condition here when triggered by multiple tabs (ie restoring a window)
  console.log('Starting refreshGroups')
  tabsGroups.value = {}
  await refreshBookmarks()
  await refreshActiveWindows()
  console.log('Ended refreshGroups', tabsGroups.value)
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
    const winId = tab.windowId?.toString() || 'undefined' // might happen in some edge cases?
    const boundBmId = bindings.windowToBookmark[winId]
    let title = null // logic for bookmark title is kind of ugly
    if (boundBmId) {
      // console.log('Window bound to bm', tabsGroups.value[boundBmId])
      if (tabsGroups.value[boundBmId])
        title = tabsGroups.value[boundBmId].title
      delete tabsGroups.value[boundBmId]
    }
    groupsAddTab(winId, tabItem)
    if (title)
      tabsGroups.value[winId].title = title
    tabsGroups.value[winId].windowId = winId
  })
  refreshBindReferences()
  console.log('API tabs', tabsRes)
}

function refreshBindReferences() {
  for (const winId of Object.keys(bindings.windowToBookmark)) {
    if (!tabsGroups.value[winId]) {
      delete bindings.windowToBookmark[winId]
      continue
      // this will not be persisted until next save
    }
    // console.log('Updating binding for winId', winId)
    tabsGroups.value[winId].bookmarkId = bindings.windowToBookmark[winId]
  }
}

function convertTab(tab: Tabs.Tab): TabItem {
  return {
    id: tab.id?.toString() || 'undefined', // might happen in some edge cases?
    title: tab.title!,
    url: tab.url!,
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
    url: bm.url!,
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

async function handleBind(groupId: string) {
  // console.log(`Binding ${groupId}`)
  const bmFolder = await browser.bookmarks.create({
    parentId: BOOKMARK_TREE_ID,
    title: groupId,
  })
  bindings.windowToBookmark[groupId] = bmFolder.id
  saveState()
  tabsGroups.value[groupId].bookmarkId = bmFolder.id
}

async function handlePersist(groupId: string) {
  console.log('Persisting')
  const bmFolder = bindings.windowToBookmark[groupId]
  const currentBookmarks = await browser.bookmarks.getSubTree(bmFolder)
  console.log('Removing', currentBookmarks)
  currentBookmarks[0].children?.forEach(bm => browser.bookmarks.remove(bm.id))

  tabsGroups.value[groupId].tabs.forEach(tab => browser.bookmarks.create({
    title: tab.title,
    url: tab.url,
    parentId: bmFolder,
  }))
}

async function handleRestore(groupId: string) {
  const window = await browser.windows.create({
    url: tabsGroups.value[groupId].tabs.map(t => t.url),
  })
  const winId = window.id!.toString()
  bindings.windowToBookmark[winId] = tabsGroups.value[groupId].bookmarkId!
  saveState()
  refreshGroups()
}

function handleUnbind(groupId: string) {
  delete bindings.windowToBookmark[groupId]
  saveState()
  refreshGroups()
}

function saveState() {
  console.log('Saving state')
  localStorage.setItem('windowToBookmark', JSON.stringify(bindings.windowToBookmark))
}

function loadState() {
  const loaded = localStorage.getItem('windowToBookmark')
  if (loaded)
    bindings.windowToBookmark = JSON.parse(loaded)
    // console.log('Found state, loading')
}

onMounted(async () => {
  loadState()
  await refreshGroups()
  window.addEventListener('beforeunload', _event => cleanup())
  // TODO handle updates better, check for race conditions
  // browser.tabs.onCreated.addListener(_t => refreshGroups())
  // browser.tabs.onRemoved.addListener(_t => refreshGroups())
})

onUnmounted(() => {
  cleanup()
})

function cleanup() {
  console.log('Unmounting, saving state')
  saveState()
}
</script>

<template>
  <main class="px-4 py-10 text-center text-gray-700 dark:text-gray-200">
    <div flex>
      <TabList
        v-for="k in groupKeysIterator" :id="k"
        :key="k"
        :group-data="tabsGroups.value[k]"
        @bind="handleBind"
        @persist="handlePersist"
        @restore="handleRestore"
        @unbind="handleUnbind"
      />
      <div />
    </div>
  </main>
</template>
