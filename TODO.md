## wip

## first release (can release to store and use personally)
- handle case where window ids and bm ids can collide (separate structures?)
- divide windows and bookmarks into separate categories
- cleanup folders, decide which tests to keep
- BUG: opening full page when sidebar is also opened make it get the override css. maybe can replace with media queries
- webext-bridge doesn't work from popups. remove

## possibly critical before release
- better function names
- remove sidebar until more stable
- maybe better to keep bookmars in structure and not render them?
- refactor overview js and separate into modules
- move ownership of groups to background script so updated can happen in the bg
- unocss isn't that great, maybe remove it
- auto sync (needs details)
- change root bm folder and edge cases
- bindings do not persist between browser reloads as windows change ids
- flickering when refreshing page. check number of redraws

## nice to have
- order windows by last used
- click individual tabs
- drag & drop functionality
- hover over item to see address
- toggle mode that shows address under tab titles
- search bar
- move current window into existing bookmark?
- custom window names do not persist on reload

## post release
- abstract bookmarks as persist method, provide other storage types. Alternative can be localstorage
- chrome groups support: one level of bm folder nesting maps to group
- icon for which tabs have changed compared to bookmark
- add context menu on right click. tried https://stackoverflow.com/a/26760703/3510803 but didn't work 
- button for group emoticon?
- consider https://headlessui.com/ for components
- see https://tailwindui.com/ or bootstrap for example styling
- save tab history to localstorage
- firefox port when manifest 3 is ready https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Build_a_cross_browser_extension
- masonry grid for groups. or wait for grid implementation


## operations status
- bind: ok
- unbind: ok
- persist: ok
- archive: ok
- restore: ok
- delete: ok
- rename: ok