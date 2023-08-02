import type { Tabs } from 'webextension-polyfill'
import type { IGroup } from './groupUtils'
import { ListTypeEnum, makeGroupFromBm, makeGroupFromWindow, makeGroupTitle } from './groupUtils'
import type { Dictionary } from './utils'
import { groupBy } from './utils'
import('webextension-polyfill') // make sure polyfill is imported, prevents issue with HMR

export class Groups {
  groups: { open: Dictionary<IGroup>; archived: Dictionary<IGroup> } = reactive({ open: {}, archived: {} })
  // binding is duplicated inside groups. any way to refactor this?
  bindings: { windowToBookmark: Dictionary<string> } = reactive({ windowToBookmark: {} })
  bookmarkRootId: string

  constructor(bookmarkRootId: string) {
    this.bookmarkRootId = bookmarkRootId
  }

  saveState() {
    // console.log('Saving state', bindings.windowToBookmark)
    localStorage.setItem('windowToBookmark', JSON.stringify(this.bindings.windowToBookmark))
    // maybe use https://vueuse.org/core/useLocalStorage/ instead?
  }

  loadState() {
    const loaded = localStorage.getItem('windowToBookmark')
    if (loaded)
      this.bindings.windowToBookmark = JSON.parse(loaded)
      // console.log('Loading state', loaded)
  }

  async refreshView() {
    // console.log('Starting refreshGroups')
    this.groups.open = {}
    this.groups.archived = {}
    this.loadState()
    await this.refreshBookmarks()
    await this.refreshActiveWindows()
    this.refreshBindReferences()
    // console.log('Ended refreshGroups', tabsGroups.value)
  }

  async refreshBookmarks() {
    const bmTree = await browser.bookmarks.getSubTree(this.bookmarkRootId)
    // console.log('API bms', bmTree)
    for (const bmFolder of bmTree[0].children ?? []) {
      if (!bmFolder.url)
        this.groups.archived[bmFolder.id] = makeGroupFromBm(bmFolder)
    }
  }

  async refreshActiveWindows() {
    const tabsRes = await browser.tabs.query({})
    // console.log('API tabs', tabsRes)

    const tabsGrouped = groupBy(tabsRes, t => t.windowId!.toString()) // id might be undef in some cases?
    // console.log('tabsGrouped', tabsGrouped)

    for (const [winId, tabs] of Object.entries(tabsGrouped))
      await this.refreshWindowFromTabs(winId, tabs)
  }

  async refreshWindowFromTabs(winId: string, tabs: Tabs.Tab[]) {
    // console.log('Refreshing window', winId)
    // console.log('refreshing window', winId)
    const group = makeGroupFromWindow(winId, tabs)
    await this.fillSubGroups(group, winId)
    const boundBmId = this.bindings.windowToBookmark[winId]
    if (boundBmId)
      group.title = (await browser.bookmarks.get(boundBmId))[0].title
    else
      group.title = makeGroupTitle(group)
    group.bookmarkId = boundBmId
    this.groups.open[winId] = group
    // console.log('refreshWindow group keys', Object.keys(tabsGroups.value))
    // console.log('Refreshed group', group)
  }

  async refreshWindowFromId(winId: number, canIdBeInvalid = false) {
    browser.windows.get(winId, {
      populate: true,
    }).then(async win => await this.refreshWindowFromTabs(winId.toString(), win.tabs ?? []))
      .catch((reason) => {
        if (!canIdBeInvalid)
          console.error(reason)
      })
  }

  async fillSubGroups(group: IGroup, winId: string) {
    // TODO optimize API calls
    for (const tabs of group.tabs) {
      if (tabs.subGroup && tabs.subGroup.id >= 0) {
        // @ts-expect-error: chrome types not working
        const groupData = await chrome.tabGroups.get(tabs.subGroup.id)
        tabs.subGroup!.color = groupData.color
        tabs.subGroup.title = groupData.title
      }
    }
  }

  refreshBindReferences() {
    for (const winId in this.bindings.windowToBookmark) {
      if (!(winId in this.groups.open)) {
        // prune old window values
        // this will not be persisted until next save
        delete this.bindings.windowToBookmark[winId]
        continue
      }
      const bmId = this.bindings.windowToBookmark[winId]
      this.groups.open[winId].bookmarkId = bmId
      delete this.groups.archived[bmId]
    }
  }

  async closeWindow(winId: string) {
    await browser.windows.remove(parseInt(winId))
    // note: tabs will still be returned from API at this point
    await this.cleanupOnWindowClose(winId)
  }

  async cleanupOnWindowClose(winId: string) {
    const bmId = this.bindings.windowToBookmark[winId]
    if (bmId) {
      delete this.bindings.windowToBookmark[winId]
      await this.createGroupFromBookmark(bmId)
    }
    delete this.groups.open[winId]
  }

  async createGroupFromBookmark(bmId: string) {
    // using separate queries because API returns empty children if bm folder just created
    const bm = (await browser.bookmarks.get(bmId))[0]
    if (bm.parentId !== this.bookmarkRootId)
      return
    bm.children = await browser.bookmarks.getChildren(bmId)
    // console.log('refreshing bookmark', bm)
    this.groups.archived[bmId] = makeGroupFromBm(bm)
  }

  // -----------------------
  // action handlers
  // -----------------------
  handleBind = async (winId: string) => {
  // console.log(`Binding ${groupId}`)
    const bmFolder = await browser.bookmarks.create({
      parentId: this.bookmarkRootId,
      title: this.groups.open[winId].title,
    })
    this.bindings.windowToBookmark[winId] = bmFolder.id
    this.saveState()
    this.groups.open[winId].bookmarkId = bmFolder.id
  }

  handlePersist = async (groupId: string) => {
  // console.log('Persisting')
    const bmFolder = this.bindings.windowToBookmark[groupId]
    const currentBookmarks = await browser.bookmarks.getSubTree(bmFolder)
    // console.log('Removing', currentBookmarks)
    currentBookmarks[0].children?.forEach(async bm => await browser.bookmarks.remove(bm.id))

    for (const tab of this.groups.open[groupId].tabs) {
      await browser.bookmarks.create({
        title: tab.title,
        url: tab.url,
        parentId: bmFolder,
      })
    }
  }

  handleRestore = async (archivedId: string) => {
    const bmGroup = this.groups.archived[archivedId]
    const window = await browser.windows.create({
      url: bmGroup.tabs.map(t => t.url),
    })
    const winId = window.id!.toString()
    this.bindings.windowToBookmark[winId] = bmGroup.bookmarkId!
    this.saveState()
    // TODO this depends on window handler to create it before this executes
    // can possibly fail
    this.groups.open[winId].bookmarkId = archivedId
    // console.log('handleRestore done', this.groups.archived[winId])
    delete this.groups.archived[archivedId]
  }

  handleUnbind = async (winId: string) => {
    const bmId = this.bindings.windowToBookmark[winId]
    delete this.bindings.windowToBookmark[winId]
    this.saveState()
    delete this.groups.open[winId].bookmarkId
    await this.createGroupFromBookmark(bmId)
  // await refreshGroups()
  }

  handleArchive = async (winId: string) => {
  // maybe not great idea to call handlers directly?
    if (!this.bindings.windowToBookmark[winId])
      await this.handleBind(winId)
    await this.handlePersist(winId)
    await this.closeWindow(winId)
  }

  handleRemove = async (groupId: string, type: ListTypeEnum) => {
    const selectedGroup = this.selectGroup(type)
    const group = selectedGroup[groupId]
    if (group.windowId)
      await this.closeWindow(groupId)
    if (group.bookmarkId) {
      await browser.bookmarks.removeTree(group.bookmarkId)
      delete selectedGroup[group.bookmarkId]
    }
  }

  handleClose = async (winId: string, _type: ListTypeEnum) => {
    await this.closeWindow(winId)
  }

  handleDiscard = async (winId: string, _type: ListTypeEnum) => {
    const windows = this.groups.open[winId].tabs.map(t => parseInt(t.id))
    windows.map(w => browser.tabs.discard(w).catch(e => console.log('Error discarding tab', e)))
  }

  handleRename = async (id: string, value: string, type: ListTypeEnum) => {
    const group = this.selectGroup(type)[id]
    group.title = value
    if (group.bookmarkId) {
      browser.bookmarks.update(group.bookmarkId, {
        title: value,
      })
    }
  }

  selectGroup(type: ListTypeEnum) {
    return type === ListTypeEnum.Open ? this.groups.open : this.groups.archived
  }
}
