export interface TabItem {
  id: string
  title: string
  url: string
  favIconUrl?: string
}

export interface Group {
  title: string
  windowId?: string
  bookmarkId?: string
  tabs: Array<TabItem>
}

// export type Groups = Dictionary<Group>

export interface Dictionary<T> {
  [Key: string]: T
}

export function faviconURL(u: string | undefined): string {
  if (!u)
    return ''
  const url = new URL(browser.runtime.getURL('/_favicon/'))
  url.searchParams.set('pageUrl', u)
  url.searchParams.set('size', '32')
  return url.toString()
}
