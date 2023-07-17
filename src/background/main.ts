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

// TODO better message handling when needed
// @ts-expect-error: sendResponse accepts params
browser.runtime.onMessage.addListener((message, sender, sendResponse) => sendResponse({ actualBookmarkRootId }))
