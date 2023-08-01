<script setup lang="ts">
import { StateChangeHandler } from '~/logic/changeHandlers'
import { Groups } from '~/logic/groups'
import { ListTypeEnum } from '~/logic/groupUtils'

const bookmarkRootId = ref('-1')
let groupData: Groups // TODO refactor name
let changeHandlers: StateChangeHandler
const loadingReady = ref(false)

onMounted(async () => {
  const bmRootResp = (await browser.runtime.sendMessage({ method: 'get-bookmarks-root' }))
  bookmarkRootId.value = bmRootResp
//  console.log('bookmarkRootId', bookmarkRootId.value)
})

onUnmounted(() => {
  cleanup()
})

watch(bookmarkRootId, async (_val, _old) => {
  cleanup()
  await init()
})

function openOverviewPage() {
  browser.tabs.create({ url: browser.runtime.getURL('/dist/overview/index.html') })
}

async function init() {
  groupData = new Groups(bookmarkRootId.value)
  await groupData.refreshView()
  loadingReady.value = true
  window.addEventListener('beforeunload', _event => cleanup())
  changeHandlers = new StateChangeHandler(groupData)
  changeHandlers.addStateChangeHandlers()
}

function cleanup() {
  // console.log('Unmounting, saving state')
  groupData?.saveState()
  changeHandlers?.removeStateChangeHandlers()
}
</script>

<template>
  <main v-if="loadingReady" class="wrapper">
    <div class="menu-bar">
      <!-- TODO should go in the archived section -->
      <BookmarkRootSelector v-model:root-id="bookmarkRootId" />
      <button id="full-btn" class="btn" @click="openOverviewPage">
        Full
      </button>
    </div>
    <div class="separator">
      <div class="separator-text">
        Windows
      </div>
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
        @close="groupData.handleClose"
        @discard="groupData.handleDiscard"
      />
    </div>
    <div class="separator">
      <div class="separator-text">
        Archived
      </div>
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
        @close="groupData.handleClose"
        @discard="groupData.handleDiscard"
      />
    </div>
  </main>
</template>

<style scoped>
.wrapper {
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  /* text-align: center; */
}

.tab-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xl);
}

.separator {
  display: flex;
  justify-content: center;
  color: var(--c-bodyDimmed);
  padding-top: var(--space-m);
  padding-bottom: var(--space-m);
}

.separator-text {
  font-size: var(--text-xs);
  width: 100%;
  display: flex;
  gap: var(--space-xl);
}

.separator-text::before, .separator-text::after {
  border-top: var(--fieldBorderWidth) dashed var(--c-fieldBorder);
  flex-grow: 1;
  transform: translateY(50%);
  content: '';
}

.menu-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (min-width: 800px) {
  /* only display in popup or sidebar. wonky detection this way */
  #full-btn {
    display: none;
  }

}
</style>
