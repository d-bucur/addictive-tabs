## wip
- more granular updates instead of reloading everything
- better reactive updates on changes
  
## first release (can release to store and use personally)
- bindings do not persist between browser reloads as windows change ids
- create root bm folder under other bookmarks (like Tabli)
- add recalculating name on group change
  
- BUG: autoname should only work if there is no other name to use
- BUG: opening full page when sidebar is also opened make it get the override css. maybe can replace with media queries

## possibly critical before release
- cleanup folders, decide which tests to keep
- refactor overview js and separate into modules
- unocss isn't that great, maybe remove it
- move ownership of groups to background script so updated can happen in the bg
- auto sync (needs details)
- change root bm folder and edge cases

## nice to have
- order windows by last used and maybe divide windows and bookmarks into separate categories
- click individual tabs
- drag & drop functionality
- hover over item to see address
- toggle mode that shows address under tab titles
- search bar
- move current window into existing bookmark?

## post release
- abstract bookmarks as persist method, provide other storage types. Alternative can be localstorage
- chrome groups support: one level of bm folder nesting maps to group
- masonry grid for groups. or wait for grid implementation
- add context menu on right click. tried https://stackoverflow.com/a/26760703/3510803 but didn't work 
- button for group emoticon?
- consider https://headlessui.com/ for components
- see https://tailwindui.com/ or bootstrap for example styling
- firefox port https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Build_a_cross_browser_extension
- save tab history to localstorage