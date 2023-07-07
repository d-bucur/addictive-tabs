<script setup lang="ts">
import type { Tabs } from 'webextension-polyfill/namespaces/tabs'

async function getCurrentTabs() {
  const v = await browser.tabs.query({
    currentWindow: true,
  })
  return v
}

// TODO better to use reactive or ref?
const currentTabs: Tabs.Tab[] = reactive([])

function updateTabList() {
  getCurrentTabs().then((t) => {
    currentTabs.length = 0
    currentTabs.push(...t)
  })
}

const bookmarks = ref([])
async function getBookmarks() {
  return await browser.bookmarks.getSubTree('5')
}
function updateBookmarksList() {
  getBookmarks().then((t) => {
    bookmarks.value = t[0].children?.map(t => ({
      id: t.id,
      title: t.title,
      url: t.url,
      favIconUrl: faviconURL(t.url),
    }))
  })
}

function faviconURL(u: string | undefined): string {
  if (!u)
    return ''
  const url = new URL(browser.runtime.getURL('/_favicon/'))
  url.searchParams.set('pageUrl', u)
  url.searchParams.set('size', '32')
  return url.toString()
}

onMounted(async () => {
  updateTabList()
  browser.tabs.onCreated.addListener(_t => updateTabList())
  browser.tabs.onRemoved.addListener(_t => updateTabList())
  updateBookmarksList()
  console.log(browser.bookmarks.getTree())
})
</script>

<template>
  <main class="px-4 py-10 text-center text-gray-700 dark:text-gray-200">
    <div flex>
      <TabList :items="currentTabs" name="Open tabs" />
      <TabList :items="bookmarks" name="Bookmarks" />
    </div>
  </main>
</template>
