<script setup lang="ts">
import { type Tabs, type Windows } from 'webextension-polyfill'
import { makeGroupFromBm, makeGroupFromWindow, makeGroupTitle } from './groupOperations'
import type { Dictionary, Group } from '~/composables/utils'
import { getViewType, groupBy } from '~/composables/utils'

const BOOKMARK_TREE_ID = '1'
const tabsGroups: { value: Dictionary<Group> } = reactive({ value: {} })
// binding is duplicated inside groups. any way to refactor this?
const bindings: { windowToBookmark: Dictionary<string> } = reactive({ windowToBookmark: {} })

const viewType = computed(getViewType)
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

// TODO more efficient rendering. don't clear every time but only update as necessary
async function refreshGroups() {
  // TODO perf check if this renders multiple times. if so, use buffer
  // TODO there can be a race condition here when triggered by multiple tabs (ie restoring a window)
  console.log('Starting refreshGroups')
  tabsGroups.value = {}
  await refreshBookmarks()
  await refreshActiveWindows()
  refreshBindReferences()
  console.log('Ended refreshGroups', tabsGroups.value)
}

function refreshBindReferences() {
  for (const winId in bindings.windowToBookmark) {
    if (!tabsGroups.value[winId]) {
      delete bindings.windowToBookmark[winId]
      continue
      // this will not be persisted until next save
    }
    const bmId = bindings.windowToBookmark[winId]
    // console.log('Updating binding for winId', winId)
    tabsGroups.value[winId].bookmarkId = bmId
    delete tabsGroups.value[bmId]
  }
}

async function refreshActiveWindows() {
  const tabsRes = await browser.tabs.query({})

  const tabsGrouped = groupBy(tabsRes, t => t.windowId!.toString()) // id might be undef in some cases?
  console.log('tabsGrouped', tabsGrouped)

  for (const [winId, tabs] of Object.entries(tabsGrouped))
    refreshWindow(winId, tabs)

  console.log('API tabs', tabsRes)
}

async function refreshWindow(winId: string, tabs: Tabs.Tab[]) {
  const group = makeGroupFromWindow(winId, tabs)
  const boundBmId = bindings.windowToBookmark[winId]
  group.title = boundBmId
    ? (await browser.bookmarks.get(boundBmId))[0].title
    : makeGroupTitle(group)
  group.bookmarkId = boundBmId
  tabsGroups.value[winId] = group
  // console.log('Refreshed group', group)
}

async function refreshBookmarks() {
  const bmTree = await browser.bookmarks.getSubTree(BOOKMARK_TREE_ID)
  console.log('API bms', bmTree)
  for (const bmFolder of bmTree[0].children ?? []) {
    if (!bmFolder.url)
      tabsGroups.value[bmFolder.id] = makeGroupFromBm(bmFolder)
  }
}

async function handleBind(winId: string) {
  // console.log(`Binding ${groupId}`)
  const bmFolder = await browser.bookmarks.create({
    parentId: BOOKMARK_TREE_ID,
    title: tabsGroups.value[winId].title,
  })
  bindings.windowToBookmark[winId] = bmFolder.id
  saveState()
  tabsGroups.value[winId].bookmarkId = bmFolder.id
}

async function handlePersist(groupId: string) {
  console.log('Persisting')
  const bmFolder = bindings.windowToBookmark[groupId]
  const currentBookmarks = await browser.bookmarks.getSubTree(bmFolder)
  console.log('Removing', currentBookmarks)
  currentBookmarks[0].children?.forEach(async bm => await browser.bookmarks.remove(bm.id))

  for (const tab of tabsGroups.value[groupId].tabs) {
    await browser.bookmarks.create({
      title: tab.title,
      url: tab.url,
      parentId: bmFolder,
    })
  }
}

async function handleRestore(groupId: string) {
  const bmGroup = tabsGroups.value[groupId]
  const window = await browser.windows.create({
    url: bmGroup.tabs.map(t => t.url),
  })
  const winId = window.id!.toString()
  bindings.windowToBookmark[winId] = bmGroup.bookmarkId!
  saveState()
  tabsGroups.value[winId].bookmarkId = groupId
  console.log('handleRestore done', tabsGroups.value[winId])
  delete tabsGroups.value[groupId]
}

async function handleUnbind(groupId: string) {
  delete bindings.windowToBookmark[groupId]
  saveState()
  await refreshGroups()
}

async function closeWindow(winId: string) {
  await browser.windows.remove(parseInt(winId))
  // note: tabs will still be returned from API at this point
  cleanupOnWindowClose(winId)
}

function cleanupOnWindowClose(winId: string) {
  const bmId = bindings.windowToBookmark[winId]
  if (bmId) {
    delete bindings.windowToBookmark[winId]
    createGroupFromBookmark(bmId)
  }
  delete tabsGroups.value[winId]
}

async function handleArchive(winId: string) {
  // maybe not great idea to call handlers directly?
  if (!bindings.windowToBookmark[winId])
    await handleBind(winId)
  await handlePersist(winId)
  await closeWindow(winId)
}

async function createGroupFromBookmark(bmId: string) {
  // using separate queries because API returns empty children if bm folder just created
  const bm = (await browser.bookmarks.get(bmId))[0]
  bm.children = await browser.bookmarks.getChildren(bmId)
  console.log('refreshing bookmark', bm)
  tabsGroups.value[bmId] = makeGroupFromBm(bm)
}

async function handleRemove(groupId: string) {
  const group = tabsGroups.value[groupId]
  if (group.windowId)
    await closeWindow(groupId)
  if (group.bookmarkId) {
    await browser.bookmarks.removeTree(group.bookmarkId)
    delete tabsGroups.value[group.bookmarkId]
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
  addStateChangeHandlers()
})

onUnmounted(() => {
  cleanup()
  removeStateChangeHandlers()
})

function cleanup() {
  console.log('Unmounting, saving state')
  saveState()
}

function openOverviewPage() {
  browser.tabs.create({ url: browser.runtime.getURL('/dist/overview/index.html') })
}

function saveState() {
  console.log('Saving state', bindings.windowToBookmark)
  localStorage.setItem('windowToBookmark', JSON.stringify(bindings.windowToBookmark))
  // maybe use https://vueuse.org/core/useLocalStorage/ instead?
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

function handleTabOnUpdate(tabId: number, changeInfo: Tabs.OnUpdatedChangeInfoType, tab: Tabs.Tab): void {
  redrawWindow(tab.windowId!)
}

function handleWinOnRemoved(windowId: number): void {
  // TODO not working when bound bookmark should be restored
  cleanupOnWindowClose(windowId.toString())
}

function redrawWindow(winId: number, canIdBeInvalid = false) {
  browser.windows.get(winId, {
    populate: true,
  }).then(win => handleWinOnCreated(win))
    .catch((reason) => {
      if (!canIdBeInvalid)
        console.error(reason)
    })
}

function handleWinOnCreated(win: Windows.Window): void {
  refreshWindow(win.id!.toString(), win.tabs ?? [])
  // TODO hard: check if it is a bound window that was reopened
}

function handleTabOnRemoved(tabId: number, removeInfo: Tabs.OnRemovedRemoveInfoType) {
  // console.log('handleTabOnRemoved', removeInfo)
  redrawWindow(removeInfo.windowId)
}

function handleTabOnAttached(tabId: number, attachInfo: Tabs.OnAttachedAttachInfoType) {
  // console.log('handleTabOnAttached', attachInfo)
  redrawWindow(attachInfo.newWindowId)
}

function handleTabOnDetached(tabId: number, detachInfo: Tabs.OnDetachedDetachInfoType) {
  redrawWindow(detachInfo.oldWindowId, true)
}

function handleTabOnMoved(tabId: number, moveInfo: Tabs.OnMovedMoveInfoType) {
  redrawWindow(moveInfo.windowId)
}

function addStateChangeHandlers() {
  browser.tabs.onRemoved.addListener(handleTabOnRemoved)
  browser.tabs.onUpdated.addListener(handleTabOnUpdate)
  browser.tabs.onAttached.addListener(handleTabOnAttached)
  browser.tabs.onDetached.addListener(handleTabOnDetached)
  browser.tabs.onMoved.addListener(handleTabOnMoved)

  browser.windows.onCreated.addListener(handleWinOnCreated)
  browser.windows.onRemoved.addListener(handleWinOnRemoved)
  // TODO add handlers for reordering
}

function removeStateChangeHandlers() {
  browser.tabs.onRemoved.removeListener(handleTabOnRemoved)
  browser.tabs.onUpdated.removeListener(handleTabOnUpdate)
  browser.tabs.onAttached.removeListener(handleTabOnAttached)
  browser.tabs.onDetached.removeListener(handleTabOnDetached)
  browser.tabs.onMoved.removeListener(handleTabOnMoved)

  browser.windows.onCreated.removeListener(handleWinOnCreated)
  browser.windows.onRemoved.removeListener(handleWinOnRemoved)
}
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
        @remove="handleRemove"
      />
      <div />
    </div>
  </main>
</template>
