export interface TabItem {
  id?: number | string
  title?: string
  url?: string
  favIconUrl?: string
}

export interface ListOfTabs {
  id: number | string
  children: Array<TabItem>
  title: string
}

export function faviconURL(u: string | undefined): string {
  if (!u)
    return ''
  const url = new URL(browser.runtime.getURL('/_favicon/'))
  url.searchParams.set('pageUrl', u)
  url.searchParams.set('size', '32')
  return url.toString()
}
