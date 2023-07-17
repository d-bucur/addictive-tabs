## wip

## first release (can release to store and use personally)
- BUG: opening full page when sidebar is also opened make it get the override css. maybe can replace with media queries
- webext-bridge doesn't work from popups. remove dep
- better function names
- remove sidebar until more stable
- remove unocss
- refactor overview js and separate into modules
- flickering when refreshing page. check number of redraws

## post release
- bindings do not persist between browser reloads as windows change ids
- possibility to change root bm folder
- move ownership of groups to background script so updated can happen in the bg
- auto sync (needs details)
- abstract bookmarks as persist method, provide other storage types. Alternative can be localstorage
- chrome groups support: one level of bm folder nesting maps to group
- icon for which tabs have changed compared to bookmark
- save tab history to localstorage
- firefox port when manifest 3 is ready https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Build_a_cross_browser_extension
- masonry grid for groups. or wait for grid implementation

## nice to have
- order windows by last used
- click individual tabs
- drag & drop functionality
- hover over item to see address
- toggle mode that shows address under tab titles
- search bar
- move current window into existing bookmark?
- custom window names do not persist on reload
- add context menu on right click. tried https://stackoverflow.com/a/26760703/3510803 but didn't work 
- button for group emoticon?
  
- consider https://headlessui.com/ for components
- see https://tailwindui.com/ or bootstrap for example styling


## operations status
- bind: ok
- unbind: ok
- persist: ok
- archive: ok
- restore: ok
- delete: bounded window leaves open empty group
- rename: ok