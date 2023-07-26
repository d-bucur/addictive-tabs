## wip
- close action: close active windows
- hide actions bind and persist

## first release (can release to store and use personally)

## post release
- bindings do not persist between browser reloads as windows change ids
- possibility to change root bm folder
- ask first time configuration: root bm and later persist method (bm vs localstorage)
- discard action: [discard](https://developer.chrome.com/docs/extensions/reference/tabs/#method-discard) all tabs
- chrome groups support: one level of bm folder nesting maps to group
- move ownership of groups to background script so updated can happen in the bg
- auto sync (needs details)
- abstract bookmarks as persist method, provide other storage types. Alternative can be localstorage
- icon for which tabs have changed compared to bookmark
- firefox port when manifest 3 is ready https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Build_a_cross_browser_extension
- masonry grid for groups. or wait for grid implementation

## nice to have
- click individual tabs to go to them
- drag & drop functionality
- order windows by last used
- save tab history to localstorage
- hover over item to see address
- toggle mode that shows address under tab titles
- search bar
- move current window into existing bookmark?
- custom window names do not persist on reload
- add context menu on right click. tried https://stackoverflow.com/a/26760703/3510803 but didn't work 
- button for group emoticon?
  
## component libraries/ui helpers
- https://every-layout.dev/rudiments/modular-scale/
- https://hihayk.github.io/shaper
- https://shoelace.style/
- https://headlessui.com/
- https://tailwindui.com/
- [bootstrap](https://getbootstrap.com/docs/5.3/examples/)
- [daisyui](https://daisyui.com/theme-generator/) https://daisyui.com/docs/colors/
- https://www.fluid-type-scale.com/calculate
- https://contrast-grid.eightshapes.com/
- https://www.radix-ui.com/
- vuetify


## operations status
- bind: ok
- unbind: ok
- persist: ok
- archive: ok
- restore: ok
- delete: bounded window leaves bookmarked group
- rename: ok