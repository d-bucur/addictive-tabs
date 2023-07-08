<script setup lang="ts">
import type { Tabs } from 'webextension-polyfill'
import type { Dictionary, Group, TabItem } from '~/composables/utils'

const tabsGroups: { value: Dictionary<Group> } = reactive({ value: {} })
async function refreshGroups() {
  // TODO perf check if this renders multiple times. if so, use buffer
  await refreshActiveWindows()
  await refreshBookmarks()
  console.log('Groups', tabsGroups.value)
}

function groupsAddTab(key: string, tab: TabItem) {
  if (tabsGroups.value[key]) {
    tabsGroups.value[key].tabs.push(tab)
  }
  else {
    tabsGroups.value[key] = {
      title: key,
      tabs: [tab],
    }
  }
}

async function refreshActiveWindows() {
  const tabsRes = await browser.tabs.query({})
  tabsRes.forEach((tab) => {
    const tabItem = convertTab(tab)
    groupsAddTab(tab.windowId?.toString() || 'undefined', tabItem) // might happen in some edge cases?
  })
  console.log('API tabs', tabsRes)
}
async function refreshBookmarks() {

}

function convertTab(tab: Tabs.Tab): TabItem {
  return {
    id: tab.id?.toString() || 'undefined', // might happen in some edge cases?
    title: tab.title || 'undefined', // should never happen
    url: tab.url || 'undefined', // should never happen
    favIconUrl: tab.favIconUrl,
  }
}

onMounted(() => {
  refreshGroups()
})
</script>

<template>
  <main class="px-4 py-10 text-center text-gray-700 dark:text-gray-200">
    <div flex>
      <TabList
        v-for="t in Object.keys(tabsGroups.value)" :key="t"
        :items="tabsGroups.value[t].tabs"
        :name="tabsGroups.value[t].title"
      />
      <div />
    </div>
  </main>
</template>
