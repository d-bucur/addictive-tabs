// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client')
}

const DEFAULT_BOOKMARK_NAME = 'Addictive Tabs'
const DEFAULT_SPACES = ['Main', 'Learn', 'Distracting']

let actualBookmarkRootId: string | undefined

async function createRootBmFolder() {
  const otherFolder = (await browser.bookmarks.getTree())[0].children![1]
  console.log('using Other Bookmarks folder', otherFolder)
  for (const bm of otherFolder.children ?? []) {
    if (bm.title === DEFAULT_BOOKMARK_NAME)
      actualBookmarkRootId = bm.id
  }
  if (!actualBookmarkRootId) {
    const rootBm = await browser.bookmarks.create({
      parentId: otherFolder.id,
      title: DEFAULT_BOOKMARK_NAME,
    })
    actualBookmarkRootId = rootBm.id
  }
  const spacesChildren = await browser.bookmarks.getChildren(actualBookmarkRootId)
  // console.log(rootChilden)
  // create default spaces if nothing is there
  if (spacesChildren.length === 0) {
    await Promise.allSettled(DEFAULT_SPACES.map(s => browser.bookmarks.create({
      parentId: actualBookmarkRootId,
      title: s,
    })))
  }
  actualBookmarkRootId = (await browser.bookmarks.getChildren(actualBookmarkRootId))[0].id
}

browser.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed')
  await createRootBmFolder()
})

// TODO value might not be set by the time this runs. need to lock it
// TODO better message handling when needed
// @ts-expect-error: sendResponse accepts params
browser.runtime.onMessage.addListener((message, sender, sendResponse) => sendResponse({ actualBookmarkRootId }))
