import type { Bookmarks, Tabs } from 'webextension-polyfill'
import { type TabItem, faviconURL } from '~/composables/utils'

export function convertTab(tab: Tabs.Tab): TabItem {
  return {
    id: tab.id?.toString() || 'undefined', // might happen in some edge cases?
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
