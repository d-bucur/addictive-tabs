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

export function openOverviewPage() {
  browser.tabs.create({ url: browser.runtime.getURL('/dist/overview/index.html?entry=main') })
}
