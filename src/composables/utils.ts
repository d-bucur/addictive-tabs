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

export function getViewType(): string {
  const popups = browser.extension.getViews({ type: 'popup' })
  if (popups[0] && popups[0].innerWidth === window.innerWidth && popups[0].innerHeight === window.innerHeight)
    return 'popup'
  // TODO might return wrong type if multiple tabs opened with different sizes
  const tabs = browser.extension.getViews({ type: 'tab' })
  if (tabs[0] && tabs[0].innerWidth === window.innerWidth && tabs[0].innerHeight === window.innerHeight)
    return 'tab'
  return 'sidebar'
}
