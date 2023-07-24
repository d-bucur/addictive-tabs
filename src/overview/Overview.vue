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
  <main v-if="loadingReady" class="wrapper">
    <div>
      <button class="btn" @click="openOverviewPage">
        Full
      </button>
    </div>
    <div class="tab-list">
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
    <div class="separator">
      Archived
    </div>
    <div class="tab-list">
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

<style scoped>
.wrapper {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  /* text-align: center; */
}

.tab-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1em;
}

.separator {
  border-top: 1px solid;
}
</style>
