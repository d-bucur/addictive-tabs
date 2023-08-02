export interface Dictionary<T> {
  [Key: string]: T
}

export const groupBy = function<T> (arr: Array<T>, key: (x: T) => string): { [Key: string]: Array<T> } {
  return arr.reduce((rv, x) => {
    // @ts-expect-error: indexing into object by string
    (rv[key(x)] = rv[key(x)] ?? []).push(x)
    return rv
  }, {})
}

const domainRe = /(?:.*\.)?(.+)\..+/
export function extractDomainName(url: string): string {
  const match = new URL(url).host.match(domainRe)
  return match ? match[1] : ''
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
  // TODO might return wrong type if multiple tabs opened with different sizes
  const popups = browser.extension.getViews({ type: 'popup' })
  if (popups[0] && popups[0].innerWidth === window.innerWidth && popups[0].innerHeight === window.innerHeight)
    return 'popup'
  const tabs = browser.extension.getViews({ type: 'tab' })
  if (tabs[0] && tabs[0].innerWidth === window.innerWidth && tabs[0].innerHeight === window.innerHeight)
    return 'tab'
  return 'sidebar'
}

export function openOverviewPage() {
  browser.tabs.create({ url: browser.runtime.getURL('/dist/overview/index.html') })
}
