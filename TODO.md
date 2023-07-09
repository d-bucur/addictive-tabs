## first release (can realease to store and use personally)
- possibility to change names of groups and auto window naming like TBP
- pages added as soon as tab opens do not have details as they haven't been loaded yet
- more granular updates instead of reloading everything
- better reactive updates on changes
- bindings do not persist between browser reloads as windows change ids
- delete archived group
- create root bm folder under other bookmarks (like Tabli)
  
- BUG: archive sometimes doesn't refresh after closing

## possibly critical before release
- unocss isn't that great, maybe remove it
- move ownership of groups to background script so updated can happen in the bg
- auto sync (needs details)
- change root bm folder and edge cases

## nice to have
- order windows by last used and maybe divide windows and bookmarks into separate categories
- drag & drop functionality
- hover over item to see address
- toggle mode that shows address under tab titles
- search bar

## post release
- abstract bookmarks as persist method, provide other storage types
- masonry grid for groups
- add context menu on right click. tried https://stackoverflow.com/a/26760703/3510803 but didn't work 
- button for group emoticon?
- chrome groups support