import type { Bookmarks, Tabs } from 'webextension-polyfill'
import { faviconURL } from '~/composables/utils'
import type { Group, TabItem } from '~/composables/utils'

export function convertTab(tab: Tabs.Tab): TabItem {
  return {
    id: tab.id?.toString() ?? 'undefined', // might happen in some edge cases?
    title: tab.title!,
    url: tab.url!,
    favIconUrl: tab.favIconUrl,
  }
}

export function convertBookmark(bm: Bookmarks.BookmarkTreeNode): TabItem {
  return {
    id: bm.id,
    title: bm.title,
    url: bm.url!,
    favIconUrl: faviconURL(bm.url),
  }
}

export function makeGroupFromWindow(winId: string, tabs: Tabs.Tab[]): Group {
  return {
    title: winId,
    tabs: tabs.reduce((a: TabItem[], tab) => {
      if (!isIgnoredTab(tab))
        a.push(convertTab(tab))
      return a
    }, []),
  }
}

export function makeGroupFromBm(bmFolder: Bookmarks.BookmarkTreeNode): Group {
  return {
    title: bmFolder.title,
    bookmarkId: bmFolder.id,
    tabs: bmFolder.children?.map(convertBookmark) ?? [],
  }
}

function isIgnoredTab(tab: Tabs.Tab) {
  return tab.url?.startsWith('chrome-extension://') || tab.url?.startsWith('chrome://')
}
