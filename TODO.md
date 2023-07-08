- archive: bind + sync + close
- decent ui

- pages added as soon as tab opens do not have details as they haven't been loaded yet
- more granular updates instead of reloading everything
- extract list into component and try it in popup
- bindings do not persist between browser reloads as windows change ids

- ignore extension tabs and maybe others as well
- better reactive updates on changes
- change root bm folder and edge cases
- drag & drop functionality
- possibility to change names of groups and auto window naming like TBP
- auto sync (needs details)

- move ownership of groups to background script so the state is persisted between page reloads?
- abstract bookmarks as persist method, provide other storage types
