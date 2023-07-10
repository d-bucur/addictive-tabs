<script setup lang="ts">
import { type Bookmarks, type Tabs } from 'webextension-polyfill'
import type { Dictionary, Group, TabItem } from '~/composables/utils'
import { extractDomainName, faviconURL, getViewType, groupBy } from '~/composables/utils'

const BOOKMARK_TREE_ID = '1'
const tabsGroups: { value: Dictionary<Group> } = reactive({ value: {} })
// TODO binding is duplicated inside groups. refactor this later
const bindings: { windowToBookmark: Dictionary<string> } = reactive({ windowToBookmark: {} })

const viewType = computed(getViewType)

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

function getGroupTitle(winId: string, tabs: Tabs.Tab[]): string {
  const boundBmId = bindings.windowToBookmark[winId]
  // if bookmark then get it form the bookmark title
  if (boundBmId) {
    if (tabsGroups.value[boundBmId]) {
      const title = tabsGroups.value[boundBmId].title
      delete tabsGroups.value[boundBmId]
      return title
    }
  }
  // otherwise compute from existing tabs
  const domains = groupBy(tabs, t => extractDomainName(t.url!))
  // sort by number of entries
  const domainsSorted = Object.keys(domains).sort((l, r) => domains[r].length - domains[l].length)
  return domainsSorted.slice(0, 2).join(', ')
}

async function refreshActiveWindows() {
  const tabsRes = await browser.tabs.query({})

  const tabsGrouped = groupBy(tabsRes, t => t.windowId!.toString()) // id might be undef in some cases?
  console.log('tabsGrouped', tabsGrouped)

  for (const [winId, tabs] of Object.entries(tabsGrouped)) {
    for (const tab of tabs) {
      if (tab.url?.startsWith('chrome-extension://') || tab.url?.startsWith('chrome://'))
        continue
      const tabItem = convertTab(tab)
      groupsAddTab(winId, tabItem)
    }
    tabsGroups.value[winId].title = getGroupTitle(winId, tabs)
    // TODO refactor title logic
    let title = null
    const boundBmId = bindings.windowToBookmark[winId]
    if (boundBmId) {
      // console.log('Window bound to bm', tabsGroups.value[boundBmId])
      if (tabsGroups.value[boundBmId])
        title = tabsGroups.value[boundBmId].title
      delete tabsGroups.value[boundBmId]
    }
    if (title)
      tabsGroups.value[winId].title = title
    tabsGroups.value[winId].windowId = winId
  }
  refreshBindReferences()
  console.log('API tabs', tabsRes)
}

function refreshBindReferences() {
  for (const winId in bindings.windowToBookmark) {
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
  for (const k in tabsGroups.value) {
    if (tabsGroups.value[k].windowId)
      windows.push(k)
    else bms.push(k)
  }
  return windows.concat(bms)
})

async function handleBind(groupId: string) {
  // console.log(`Binding ${groupId}`)
  const bmFolder = await browser.bookmarks.create({
    parentId: BOOKMARK_TREE_ID,
    title: tabsGroups.value[groupId].title,
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

  for (const tab of tabsGroups.value[groupId].tabs) {
    browser.bookmarks.create({
      title: tab.title,
      url: tab.url,
      parentId: bmFolder,
    })
  }
}

async function handleRestore(groupId: string) {
  const window = await browser.windows.create({
    url: tabsGroups.value[groupId].tabs.map(t => t.url),
  })
  const winId = window.id!.toString()
  bindings.windowToBookmark[winId] = tabsGroups.value[groupId].bookmarkId!
  saveState()
  await refreshGroups()
}

async function handleUnbind(groupId: string) {
  delete bindings.windowToBookmark[groupId]
  saveState()
  await refreshGroups()
}

async function handleClose(groupId: string) {
  await browser.windows.remove(parseInt(groupId))
  if (bindings.windowToBookmark[groupId])
    delete bindings.windowToBookmark[groupId]
  await refreshGroups()
}

async function handleArchive(groupId: string) {
  // maybe not great idea to call handlers directly?
  if (!bindings.windowToBookmark[groupId])
    await handleBind(groupId)
  await handlePersist(groupId)
  await handleClose(groupId)
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

async function handleEntrypoint() {
  // sidebar entry, query params would be nicer but not possible in manifest
  if (viewType.value === 'sidebar') {
    console.log('loading other style')
    document.getElementsByTagName('head')[0].insertAdjacentHTML(
      'beforeend',
      '<link rel="stylesheet" href="../background/override.css" />')
  }
}

async function handleRename(id: string, value: string) {
  const group = tabsGroups.value[id]
  group.title = value
  if (group.bookmarkId) {
    browser.bookmarks.update(group.bookmarkId, {
      title: value,
    })
  }
}

onMounted(async () => {
  await handleEntrypoint()
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

function openOverviewPage() {
  browser.tabs.create({ url: browser.runtime.getURL('/dist/overview/index.html') })
}

// sidepanel api is still shit and buggy
// async function openSidePanel() {
//   await browser.sidePanel.open({
//     windowId: await browser.windows.getCurrent(),
//   })
//   await browser.sidePanel.setOptions({
//     enabled: true,
//     path: './dist/overview/index.html',
//   })
// }
</script>

<template>
  <main class="px-4 py-5 text-center">
    <div>
      <button v-if="viewType !== 'tab'" class="btn mt-2" @click="openOverviewPage">
        Full
      </button>
      <!-- <button class="btn mt-2" @click="openSidePanel">
        Side
      </button> -->
    </div>
    <div flex gap-1em flex-wrap>
      <TabList
        v-for="k in groupKeysIterator" :id="k"
        :key="k"
        :group-data="tabsGroups.value[k]"
        @bind="handleBind"
        @persist="handlePersist"
        @restore="handleRestore"
        @unbind="handleUnbind"
        @archive="handleArchive"
        @rename="handleRename"
      />
      <div />
    </div>
  </main>
</template>
