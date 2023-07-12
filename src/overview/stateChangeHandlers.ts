import type { Tabs, Windows } from 'webextension-polyfill'
import { convertTab } from './groupOperations'
import type { Dictionary, Group } from '~/composables/utils'

// TODO pass refs and move to separate file
export function addStateChangeHandlers(tabsGroups: { value: Dictionary<Group> }) {
  function handleTabOnUpdate(tabId: number, changeInfo: Tabs.OnUpdatedChangeInfoType, tab: Tabs.Tab): void {
    // TODO very granular update for page loading. for the others maybe just render the entire group
    console.log('onUpdated', changeInfo)
    const tabInGroup = tabsGroups.value[tab.windowId!].tabs[tab.index]
    if (changeInfo.favIconUrl)
      tabInGroup.favIconUrl = changeInfo.favIconUrl
    if (changeInfo.title) {
      tabInGroup.title = changeInfo.title
      tabInGroup.url = tab.url!
    }
    if (changeInfo.status !== 'complete')
      return
    tabsGroups.value[tab.windowId!].tabs[tab.index] = convertTab(tab)
  }

  function handleWinOnRemoved(windowId: number): void {
    // if (tabsGroups.value[windowId].bookmarkId)
    // TODO add bookmarked group back
    delete tabsGroups.value[windowId]
  }

  function handleWinOnCreated(win: Windows.Window): void {
    // TODO merge with groupsAddTab
    // TODO need make initial group from tabs. refactor with logic above
    tabsGroups.value[win.id!] = {
      title: win.title || '',
      tabs: [],
    }
  }

  browser.tabs.onRemoved.addListener(() => console.log('tabs.onRemoved TODO'))
  browser.tabs.onUpdated.addListener(handleTabOnUpdate)
  browser.tabs.onAttached.addListener(() => console.log('tabs.onAttached TODO'))
  browser.tabs.onDetached.addListener(() => console.log('tabs.onDetached TODO'))

  browser.windows.onCreated.addListener(handleWinOnCreated)
  browser.windows.onRemoved.addListener(handleWinOnRemoved)
  // TODO add handlers for reordering
}
