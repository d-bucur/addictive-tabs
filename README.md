# Addictive Tabs browser extension

<div align="center">

![screenshot](https://lh3.googleusercontent.com/lfTVjpOx3gOr29w7PJapTr4a65URgmncZ-tQjurcVlxfJmsydWN1C1juIC1pt2MKzmIDa6bZtcp8z2izOJYUvLqQMQ=w640-h400-e365-rj-sc0x00ffffff)

[Download (Chrome Store)](https://chrome.google.com/webstore/detail/addictive-tabs/cikplcdpjhhbhbkliobodliiknpdhaja)
</div>

Do you constantly find yourself with a bazillion tabs opened at a time?

Break up your tabs into different windows. Put aside the ones you're not actively using so you can focus on your current task and save some battery life. Easily reopen archived windows and pick up where you left off.

Archived tabs are saved as bookmarks so you can easily manage them and sync them between devices.

## Usage

You can open the main view in the following ways:

- **Popup**: click on the extension icon in the action bar (top right)
- **Side panel**: click on the side panel button and select Addictive Tabs in the selection button
- **Full tab**: Click on the `Full` button in the top right of the previous views or use the keyboard shortcut `Alt+A`

Your currently opened windows and tabs will be displayed at the top and any archived (closed) will be in the second part.

### Window actions
- **Bind**: bind the active window to a folder inside your bookmarks. This will make it easier to sync changes between the open window and the bookmark folder it is bound to
- **Persist**: Save the current tabs in the window to the bound bookmark folder (in the future it will be somewhat automated)
- **Archive**: quick way to close and store a window for later. Will be saved as a bookmark folder. Basically a bind + persist + close
- **Restore**: reopen an archived window. Will restore the binding
- **Unbind**: remove previous binding. Can now save the window to a new folder
- **Remove**: delete a saved bookmark folder
- **Rename**: rename the folder name. Note: window renames are currently not saved
- **Close**: close the window
- **Discard**: unload the window. Useful if you're not going to use it soon and it's using too much CPU/RAM in the background

> [!NOTE]
> The actions will be somewhat simplified in a future release

### Bookmark folder
You can select between different bookmark groups where windows will be saved to. You can also manage the saved windows and the top level categories inside the Chrome bookmarks manager (click the first button to open it up to the root folder).

This allows for powerful management provided natively in the browser. And syncing between devices. You can now even view and manage your archived tabs on Chrome mobile, which doesn't allow extensions.

### Options page
Right click the icon in the action bar and click options. Pretty bare bones for now

## Development

```bash
pnpm dev
```

Then load extension in browser with the `extension/` folder.


`web-ext` auto reloads the extension when `extension/` files change.

The server has to be running for the extension to work.

> While Vite handles HMR automatically in the most of the case, [Extensions Reloader](https://chrome.google.com/webstore/detail/fimgfedafeadlieiabdeeaodndnlbhid) is still recommanded for cleaner hard reloading.

### Build

```bash
pnpm build
```

Creates a static bundle of the extension that can be loaded as an unpacked extension in Chrome

```bash
pnpm pack:zip
```

Creates a zip of the extension that is ready to be uploaded to the Chrome store

## Privacy

See the full [Privacy policy](PRIVACY.md). TLDR: no data is collected at all

## Changelog

[Full changelog](CHANGELOG.md)

## Credits

https://github.com/antfu/vitesse-webext for the starter template

