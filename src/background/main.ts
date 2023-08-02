// import 'webextension-polyfill'

// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client')
}

const DEFAULT_BOOKMARK_NAME = 'Addictive Tabs'
const DEFAULT_SPACES = ['Main', 'Learn', 'Distracting']

let actualBookmarkRootId: string | undefined // TODO avoid global variable (or rename)

async function getBookmarkRootId() {
  const items = await browser.storage.local.get('bookmarkRootId')
  actualBookmarkRootId = items.bookmarkRootId

  if (!actualBookmarkRootId)
    await createRootBmFolder()
  return actualBookmarkRootId
}

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
})

// TODO better message handling when needed
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // @ts-expect-error: sendResponse accepts params
  (async () => sendResponse(await getBookmarkRootId()))()
  return true
})
