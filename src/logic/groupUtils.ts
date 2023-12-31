import type { Bookmarks, Tabs } from 'webextension-polyfill'
import { extractDomainName, faviconURL, groupBy } from './utils'

export interface ITabItem {
  id: string
  title: string
  url: string
  favIconUrl?: string
  subGroup?: ISubGroup
}

export interface IGroup {
  title: string
  windowId?: string
  bookmarkId?: string
  tabs: Array<ITabItem>
}

export interface ISubGroup {
  id: number
  color?: string
  title?: string
}

export enum ListTypeEnum {
  Open,
  Archived,
}

function convertTab(tab: Tabs.Tab): ITabItem {
  return {
    id: tab.id!.toString(),
    title: tab.title!,
    url: tab.url!,
    favIconUrl: faviconURL(tab.url),
    // @ts-expect-error: groupId missing from types for some reason
    subGroup: { id: tab.groupId },
  }
}

function convertBookmark(bm: Bookmarks.BookmarkTreeNode): ITabItem {
  return {
    id: bm.id,
    title: bm.title,
    url: bm.url!,
    favIconUrl: faviconURL(bm.url),
  }
}

export function makeGroupFromWindow(winId: string, tabs: Tabs.Tab[]): IGroup {
  return {
    title: winId,
    windowId: winId,
    tabs: tabs.reduce((a: ITabItem[], tab) => {
      if (!isIgnoredTab(tab))
        a.push(convertTab(tab))
      return a
    }, []),
  }
}

export function makeGroupFromBm(bmFolder: Bookmarks.BookmarkTreeNode): IGroup {
  return {
    title: bmFolder.title,
    bookmarkId: bmFolder.id,
    tabs: bmFolder.children?.map(convertBookmark) ?? [],
  }
}

export function isIgnoredTab(tab: Tabs.Tab) {
  return tab.url?.startsWith('chrome-extension://') || tab.url?.startsWith('chrome://')
}

export function makeGroupTitle(group: IGroup) {
  // otherwise compute from existing tabs
  const domains = groupBy(group.tabs, t => t.url ? extractDomainName(t.url) : 'others')
  // sort by number of entries
  const domainsSorted = Object.keys(domains).sort((l, r) => domains[r].length - domains[l].length)
  return domainsSorted.length ? domainsSorted.slice(0, 2).join(', ') : 'empty'
}
