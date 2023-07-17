<script setup lang="ts">
import { type Tabs, type Windows } from 'webextension-polyfill'
import { makeGroupFromBm, makeGroupFromWindow, makeGroupTitle } from './groupOperations'
import type { Dictionary, Group } from '~/composables/utils'
import { ListTypeEnum, getViewType, groupBy } from '~/composables/utils'

let bookmarkRootId = '1'
const groups: { open: Dictionary<Group>; archived: Dictionary<Group> } = reactive({ open: {}, archived: {} })
// binding is duplicated inside groups. any way to refactor this?
const bindings: { windowToBookmark: Dictionary<string> } = reactive({ windowToBookmark: {} })

const viewType = computed(getViewType)

onMounted(async () => {
  bookmarkRootId = (await browser.runtime.sendMessage({ method: 'get-bookmarks-root' })).actualBookmarkRootId
  loadState()
  await refreshView()
  window.addEventListener('beforeunload', _event => cleanup())
  addStateChangeHandlers()
})

onUnmounted(() => {
  cleanup()
  removeStateChangeHandlers()
})

async function refreshView() {
  // console.log('Starting refreshGroups')
  groups.open = {}
  groups.archived = {}
  await refreshBookmarks()
  await refreshActiveWindows()
  refreshBindReferences()
  // console.log('Ended refreshGroups', tabsGroups.value)
}

async function refreshBookmarks() {
  const bmTree = await browser.bookmarks.getSubTree(bookmarkRootId)
  // console.log('API bms', bmTree)
  for (const bmFolder of bmTree[0].children ?? []) {
    if (!bmFolder.url)
      groups.archived[bmFolder.id] = makeGroupFromBm(bmFolder)
  }
}

async function refreshActiveWindows() {
  const tabsRes = await browser.tabs.query({})
  console.log('API tabs', tabsRes)

  const tabsGrouped = groupBy(tabsRes, t => t.windowId!.toString()) // id might be undef in some cases?
  // console.log('tabsGrouped', tabsGrouped)

  for (const [winId, tabs] of Object.entries(tabsGrouped))
    await refreshWindowFromTabs(winId, tabs)
}

async function refreshWindowFromTabs(winId: string, tabs: Tabs.Tab[]) {
  // console.log('refreshing window', winId)
  const group = makeGroupFromWindow(winId, tabs)
  const boundBmId = bindings.windowToBookmark[winId]
  if (boundBmId)
    group.title = (await browser.bookmarks.get(boundBmId))[0].title
  else
    group.title = makeGroupTitle(group)
  group.bookmarkId = boundBmId
  groups.open[winId] = group
  // console.log('refreshWindow group keys', Object.keys(tabsGroups.value))
  // console.log('Refreshed group', group)
}

async function refreshWindowFromId(winId: number, canIdBeInvalid = false) {
  browser.windows.get(winId, {
    populate: true,
  }).then(async win => await refreshWindowFromTabs(winId.toString(), win.tabs ?? []))
    .catch((reason) => {
      if (!canIdBeInvalid)
        console.error(reason)
    })
}

function refreshBindReferences() {
  for (const winId in bindings.windowToBookmark) {
    if (!(winId in groups.open)) {
      // prune old window values
      // this will not be persisted until next save
      delete bindings.windowToBookmark[winId]
      continue
    }
    const bmId = bindings.windowToBookmark[winId]
    groups.open[winId].bookmarkId = bmId
    delete groups.archived[bmId]
  }
}

async function closeWindow(winId: string) {
  await browser.windows.remove(parseInt(winId))
  // note: tabs will still be returned from API at this point
  await cleanupOnWindowClose(winId)
}

async function cleanupOnWindowClose(winId: string) {
  const bmId = bindings.windowToBookmark[winId]
  if (bmId) {
    delete bindings.windowToBookmark[winId]
    await createGroupFromBookmark(bmId)
  }
  delete groups.open[winId]
}

async function createGroupFromBookmark(bmId: string) {
  // using separate queries because API returns empty children if bm folder just created
  const bm = (await browser.bookmarks.get(bmId))[0]
  bm.children = await browser.bookmarks.getChildren(bmId)
  // console.log('refreshing bookmark', bm)
  groups.archived[bmId] = makeGroupFromBm(bm)
}

async function handleBind(winId: string) {
  // console.log(`Binding ${groupId}`)
  const bmFolder = await browser.bookmarks.create({
    parentId: bookmarkRootId,
    title: groups.open[winId].title,
  })
  bindings.windowToBookmark[winId] = bmFolder.id
  saveState()
  groups.open[winId].bookmarkId = bmFolder.id
}

async function handlePersist(groupId: string) {
  // console.log('Persisting')
  const bmFolder = bindings.windowToBookmark[groupId]
  const currentBookmarks = await browser.bookmarks.getSubTree(bmFolder)
  // console.log('Removing', currentBookmarks)
  currentBookmarks[0].children?.forEach(async bm => await browser.bookmarks.remove(bm.id))

  for (const tab of groups.open[groupId].tabs) {
    await browser.bookmarks.create({
      title: tab.title,
      url: tab.url,
      parentId: bmFolder,
    })
  }
}

async function handleRestore(archivedId: string) {
  const bmGroup = groups.archived[archivedId]
  const window = await browser.windows.create({
    url: bmGroup.tabs.map(t => t.url),
  })
  const winId = window.id!.toString()
  bindings.windowToBookmark[winId] = bmGroup.bookmarkId!
  saveState()
  groups.open[winId].bookmarkId = archivedId
  // console.log('handleRestore done', tabsGroups.value[winId])
  delete groups.archived[archivedId]
}

async function handleUnbind(winId: string) {
  const bmId = bindings.windowToBookmark[winId]
  delete bindings.windowToBookmark[winId]
  saveState()
  delete groups.open[winId].bookmarkId
  createGroupFromBookmark(bmId)
  // await refreshGroups()
}

async function handleArchive(winId: string) {
  // maybe not great idea to call handlers directly?
  if (!bindings.windowToBookmark[winId])
    await handleBind(winId)
  await handlePersist(winId)
  await closeWindow(winId)
}

async function handleRemove(groupId: string, type: ListTypeEnum) {
  const selectedGroup = selectGroup(type)
  const group = selectedGroup[groupId]
  if (group.windowId)
    await closeWindow(groupId)
  if (group.bookmarkId) {
    await browser.bookmarks.removeTree(group.bookmarkId)
    delete selectedGroup[group.bookmarkId]
  }
}

async function handleRename(id: string, value: string, type: ListTypeEnum) {
  const group = selectGroup(type)[id]
  group.title = value
  if (group.bookmarkId) {
    browser.bookmarks.update(group.bookmarkId, {
      title: value,
    })
  }
}

function selectGroup(type: ListTypeEnum) {
  return type === ListTypeEnum.Open ? groups.open : groups.archived
}

function openOverviewPage() {
  browser.tabs.create({ url: browser.runtime.getURL('/dist/overview/index.html') })
}

function cleanup() {
  // console.log('Unmounting, saving state')
  saveState()
}

function saveState() {
  console.log('Saving state', bindings.windowToBookmark)
  localStorage.setItem('windowToBookmark', JSON.stringify(bindings.windowToBookmark))
  // maybe use https://vueuse.org/core/useLocalStorage/ instead?
}

function loadState() {
  const loaded = localStorage.getItem('windowToBookmark')
  if (loaded) {
    bindings.windowToBookmark = JSON.parse(loaded)
    console.log('Loading state', loaded)
  }
}

function handleTabOnUpdate(tabId: number, changeInfo: Tabs.OnUpdatedChangeInfoType, tab: Tabs.Tab): void {
  refreshWindowFromId(tab.windowId!)
}

async function handleWinOnRemoved(windowId: number) {
  await cleanupOnWindowClose(windowId.toString())
}

function handleWinOnCreated(win: Windows.Window): void {
  refreshWindowFromTabs(win.id!.toString(), win.tabs ?? [])
  // console.log('created window', win)
  // TODO hard: check if it is a bound window that was reopened
}

function handleTabOnRemoved(tabId: number, removeInfo: Tabs.OnRemovedRemoveInfoType) {
  // console.log('handleTabOnRemoved', removeInfo)
  refreshWindowFromId(removeInfo.windowId, true)
}

function handleTabOnAttached(tabId: number, attachInfo: Tabs.OnAttachedAttachInfoType) {
  // console.log('handleTabOnAttached', attachInfo)
  refreshWindowFromId(attachInfo.newWindowId)
}

function handleTabOnDetached(tabId: number, detachInfo: Tabs.OnDetachedDetachInfoType) {
  refreshWindowFromId(detachInfo.oldWindowId, true)
}

function handleTabOnMoved(tabId: number, moveInfo: Tabs.OnMovedMoveInfoType) {
  refreshWindowFromId(moveInfo.windowId)
}

function addStateChangeHandlers() {
  browser.tabs.onRemoved.addListener(handleTabOnRemoved)
  browser.tabs.onUpdated.addListener(handleTabOnUpdate)
  browser.tabs.onAttached.addListener(handleTabOnAttached)
  browser.tabs.onDetached.addListener(handleTabOnDetached)
  browser.tabs.onMoved.addListener(handleTabOnMoved)

  browser.windows.onCreated.addListener(handleWinOnCreated)
  browser.windows.onRemoved.addListener(handleWinOnRemoved)
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
  <main class="px-4 py-5 text-center" flex flex-col>
    <div>
      <button class="btn mt-2" @click="openOverviewPage">
        Full
      </button>
      <!-- <button class="btn mt-2" @click="openSidePanel">
        Side
      </button> -->
    </div>
    <div flex gap-1em flex-wrap>
      <TabList
        v-for="k in Object.keys(groups.open)" :id="k"
        :key="k"
        :group-data="groups.open[k]"
        :type="ListTypeEnum.Open"
        @bind="handleBind"
        @persist="handlePersist"
        @restore="handleRestore"
        @unbind="handleUnbind"
        @archive="handleArchive"
        @rename="handleRename"
        @remove="handleRemove"
      />
    </div>
    <div border-b>
      Archived
    </div>
    <div flex gap-1em flex-wrap>
      <TabList
        v-for="k in Object.keys(groups.archived)" :id="k"
        :key="k"
        :group-data="groups.archived[k]"
        :type="ListTypeEnum.Archived"
        @bind="handleBind"
        @persist="handlePersist"
        @restore="handleRestore"
        @unbind="handleUnbind"
        @archive="handleArchive"
        @rename="handleRename"
        @remove="handleRemove"
      />
    </div>
  </main>
</template>
