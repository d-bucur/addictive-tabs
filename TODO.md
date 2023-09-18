## wip

## next version
- single button for bind and persist (or make it an alternative to archive that doesn't close)
- each group should have active tab selected
- order windows by last used (or at least selected window should be first)
- bookmarks should be in same order as in bookmarks menu
- make links in group clickable. window click takes you to tab. bookmarks are normal links
- don't discard active tab
- make it clearer which tabs are discarded from memory
- user feedback when saving group
- move categories into archived section
- favicon background
- style icon (not visible on dark themes)

- revise css and better colors
- dark mode support
- custom CSS scrollbars

## post release
- bug: sometimes favicons don't update properly until extension is reloaded
- bindings should be saved to localstorage ASAP instead of on close
- bindings do not persist between browser reloads as windows change ids
- chrome groups support: one level of bm folder nesting maps to group. optional groups permission
- move ownership of groups to background script so updates can happen in the bg. still needed?
- changing bookmark root redraws whole page. Should avoid flickering
- auto sync (needs more details)
- icon for which tabs have changed compared to bookmark. removed items show greyed out
- firefox port when manifest 3 is ready https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Build_a_cross_browser_extension

## nice to have
- custom window names do not persist on reload
- ability to change root bookmark folder
- chrome.tabGroups ts types not working
- drag & drop functionality
- save tab history locally
- button to open group folder in bookmarks
- select and delete multiple tabs
- hover over item to see address
- toggle mode that shows address under tab titles
- search bar
- move current window into existing bookmark group?
- add context menu on right click. tried https://stackoverflow.com/a/26760703/3510803 but didn't work 
- button for group emoticon?
- abstract bookmarks as persist method, provide other storage types. Alternative can be localstorage
- masonry grid for groups. or wait for grid implementation. https://css-tricks.com/piecing-together-approaches-for-a-css-masonry-layout/
- removing existing bookmarks and re-adding might increase ids. is this a problem? could be solved by diffing current window vs archived one
  
## component libraries/ui helpers
- https://every-layout.dev/rudiments/modular-scale/
- https://hihayk.github.io/shaper
- https://open-props.style/
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
- delete: ok
- rename: ok