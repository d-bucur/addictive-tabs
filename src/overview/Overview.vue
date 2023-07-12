<script setup lang="ts">
import { addStateChangeHandlers } from './stateChangeHandlers'
import { makeGroupFromBm, makeGroupFromWindow, makeGroupTitle } from './groupOperations'
import type { Dictionary, Group } from '~/composables/utils'
import { getViewType, groupBy } from '~/composables/utils'

const BOOKMARK_TREE_ID = '1'
const tabsGroups: { value: Dictionary<Group> } = reactive({ value: {} })
// TODO binding is duplicated inside groups. refactor this later
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

  for (const [winId, tabs] of Object.entries(tabsGrouped)) {
    const group = makeGroupFromWindow(winId, tabs)
    const boundBmId = bindings.windowToBookmark[winId]
    group.title = boundBmId
      ? tabsGroups.value[boundBmId].title
      : makeGroupTitle(group)
    tabsGroups.value[winId] = group
  }
  console.log('API tabs', tabsRes)
}

async function refreshBookmarks() {
  const bmTree = await browser.bookmarks.getSubTree(BOOKMARK_TREE_ID)
  console.log('API bms', bmTree)
  for (const bmFolder of bmTree[0].children ?? []) {
    if (!bmFolder.url)
      tabsGroups.value[bmFolder.id] = makeGroupFromBm(bmFolder)
  }
}

// TODO rename to onBindAction
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

async function closeWindow(winId: string) {
  await browser.windows.remove(parseInt(winId))
  // note: tabs will still be returned from API at this point
  if (bindings.windowToBookmark[winId])
    delete bindings.windowToBookmark[winId]
  delete tabsGroups.value[winId]
}

async function handleArchive(groupId: string) {
  // maybe not great idea to call handlers directly?
  if (!bindings.windowToBookmark[groupId])
    await handleBind(groupId)
  await handlePersist(groupId)
  await closeWindow(groupId)
  // TODO bug: just bookmaked folder does not re-render, should be solved with state change handlers
}

async function handleRemove(groupId: string) {
  const group = tabsGroups.value[groupId]
  if (group.windowId)
    await closeWindow(groupId)
  if (group.bookmarkId)
    await browser.bookmarks.removeTree(group.bookmarkId)
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
  addStateChangeHandlers(tabsGroups)
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
        @remove="handleRemove"
      />
      <div />
    </div>
  </main>
</template>
