import type { Tabs, Windows } from 'webextension-polyfill'
import type { Groups } from './groups'
import { isIgnoredTab } from './groupUtils'

export class StateChangeHandler {
  groups: Groups

  constructor(groups: Groups) {
    this.groups = groups
  }

  handleTabOnUpdate = (tabId: number, changeInfo: Tabs.OnUpdatedChangeInfoType, tab: Tabs.Tab) => {
    const skipUpdate = isIgnoredTab(tab)
    // normally 4 updates are sent per page load, but removing some feels like premature optimization
    // || (changeInfo.status !== 'loading' && changeInfo.status !== 'complete')
    if (skipUpdate)
      return
    // console.log('handleTabOnUpdate', tabId, changeInfo)
    this.groups.refreshWindowFromId(tab.windowId!)
  }

  handleWinOnRemoved = async (windowId: number) => {
  // console.log('handleWinOnRemoved', windowId)
    await this.groups.cleanupOnWindowClose(windowId.toString())
  }

  handleWinOnCreated = (win: Windows.Window) => {
    // console.log('handleWinOnCreated', win)
    this.groups.refreshWindowFromTabs(win.id!.toString(), win.tabs ?? [])
  // TODO hard: check if it is a bound window that was reopened
  }

  handleTabOnRemoved = (tabId: number, removeInfo: Tabs.OnRemovedRemoveInfoType) => {
  // console.log('handleTabOnRemoved', removeInfo)
    this.groups.refreshWindowFromId(removeInfo.windowId, true)
  }

  handleTabOnAttached = (tabId: number, attachInfo: Tabs.OnAttachedAttachInfoType) => {
  // console.log('handleTabOnAttached', attachInfo)
    this.groups.refreshWindowFromId(attachInfo.newWindowId)
  }

  handleTabOnDetached = (tabId: number, detachInfo: Tabs.OnDetachedDetachInfoType) => {
  // console.log('handleTabOnDetached', detachInfo)
    this.groups.refreshWindowFromId(detachInfo.oldWindowId, true)
  }

  handleTabOnMoved = (tabId: number, moveInfo: Tabs.OnMovedMoveInfoType) => {
  // console.log('handleTabOnMoved', moveInfo)
    this.groups.refreshWindowFromId(moveInfo.windowId)
  }

  addStateChangeHandlers() {
    browser.tabs.onRemoved.addListener(this.handleTabOnRemoved)
    browser.tabs.onUpdated.addListener(this.handleTabOnUpdate)
    browser.tabs.onAttached.addListener(this.handleTabOnAttached)
    browser.tabs.onDetached.addListener(this.handleTabOnDetached)
    browser.tabs.onMoved.addListener(this.handleTabOnMoved)

    browser.windows.onCreated.addListener(this.handleWinOnCreated)
    browser.windows.onRemoved.addListener(this.handleWinOnRemoved)
  }

  removeStateChangeHandlers() {
    browser.tabs.onRemoved.removeListener(this.handleTabOnRemoved)
    browser.tabs.onUpdated.removeListener(this.handleTabOnUpdate)
    browser.tabs.onAttached.removeListener(this.handleTabOnAttached)
    browser.tabs.onDetached.removeListener(this.handleTabOnDetached)
    browser.tabs.onMoved.removeListener(this.handleTabOnMoved)

    browser.windows.onCreated.removeListener(this.handleWinOnCreated)
    browser.windows.onRemoved.removeListener(this.handleWinOnRemoved)
  }
}
