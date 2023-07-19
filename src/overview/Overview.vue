<script setup lang="ts">
import { StateChangeHandler } from '~/logic/changeHandlers'
import { Groups } from '~/logic/groups'
import { ListTypeEnum } from '~/logic/groupUtils'

let bookmarkRootId = '2000'
let groupData: Groups // TODO refactor naming
let changeHandlers: StateChangeHandler
const loadingReady = ref(false)

onBeforeMount(async () => {
  bookmarkRootId = (await browser.runtime.sendMessage({ method: 'get-bookmarks-root' })).actualBookmarkRootId
  groupData = new Groups(bookmarkRootId)
  await groupData.refreshView()
  loadingReady.value = true
  window.addEventListener('beforeunload', _event => cleanup())
  changeHandlers = new StateChangeHandler(groupData)
  changeHandlers.addStateChangeHandlers()
})

onUnmounted(() => {
  cleanup()
  changeHandlers.removeStateChangeHandlers()
})

function openOverviewPage() {
  browser.tabs.create({ url: browser.runtime.getURL('/dist/overview/index.html') })
}

function cleanup() {
  // console.log('Unmounting, saving state')
  groupData.saveState()
}
</script>

<template>
  <main v-if="loadingReady" class="px-4 py-5 text-center" flex flex-col>
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
        v-for="k in Object.keys(groupData.groups.open)" :id="k"
        :key="k"
        :group-data="groupData.groups.open[k]"
        :type="ListTypeEnum.Open"
        @bind="groupData.handleBind"
        @persist="groupData.handlePersist"
        @restore="groupData.handleRestore"
        @unbind="groupData.handleUnbind"
        @archive="groupData.handleArchive"
        @rename="groupData.handleRename"
        @remove="groupData.handleRemove"
      />
    </div>
    <div border-b>
      Archived
    </div>
    <div flex gap-1em flex-wrap>
      <TabList
        v-for="k in Object.keys(groupData.groups.archived)" :id="k"
        :key="k"
        :group-data="groupData.groups.archived[k]"
        :type="ListTypeEnum.Archived"
        @bind="groupData.handleBind"
        @persist="groupData.handlePersist"
        @restore="groupData.handleRestore"
        @unbind="groupData.handleUnbind"
        @archive="groupData.handleArchive"
        @rename="groupData.handleRename"
        @remove="groupData.handleRemove"
      />
    </div>
  </main>
</template>
