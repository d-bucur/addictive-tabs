import { onMessage, sendMessage } from 'webext-bridge/background'
import type { Tabs } from 'webextension-polyfill'

// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client')
}

const DEFAULT_BOOKMARK_PARENT_ID = '2' // is 'Other bookmarks' always id 2?
const DEFAULT_BOOKMARK_NAME = 'Addictive Tabs'

let actualBookmarkRootId: string | undefined

async function createRootBmFolder() {
  const subTree = await browser.bookmarks.getSubTree(DEFAULT_BOOKMARK_PARENT_ID)
  console.log('creating root bm', subTree)
  for (const bm of subTree[0].children ?? []) {
    if (bm.title === DEFAULT_BOOKMARK_NAME)
      actualBookmarkRootId = bm.id
  }
  if (!actualBookmarkRootId) {
    const rootBm = await browser.bookmarks.create({
      parentId: DEFAULT_BOOKMARK_PARENT_ID,
      title: DEFAULT_BOOKMARK_NAME,
    })
    actualBookmarkRootId = rootBm.id
  }
}

browser.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed')
  await createRootBmFolder()
})

let previousTabId = 0

// communication example: send previous tab title from background page
// see shim.d.ts for type declaration
browser.tabs.onActivated.addListener(async ({ tabId }) => {
  if (!previousTabId) {
    previousTabId = tabId
    return
  }

  let tab: Tabs.Tab

  try {
    tab = await browser.tabs.get(previousTabId)
    previousTabId = tabId
  }
  catch {
    return
  }

  console.log('previous tab', tab)
  sendMessage('tab-prev', { title: tab.title }, { context: 'content-script', tabId })
})

// TODO better message handling when needed
browser.runtime.onMessage.addListener((message, sender, sendResponse) => sendResponse({ actualBookmarkRootId }))

onMessage('get-current-tab', async () => {
  try {
    const tab = await browser.tabs.get(previousTabId)
    return {
      title: tab?.title,
    }
  }
  catch {
    return {
      title: undefined,
    }
  }
})
