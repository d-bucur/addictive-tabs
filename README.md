# Addictive Tabs browser extension

Do you constantly find yourself with a bazillion tabs opened at a time?

Break up your tabs into different windows. Put aside the ones you're not actively using so you can focus on your current task. Easily reopen archived windows and pick up where you left off.

Archived tabs are saved as bookmarks so you can easily manage them and sync them between devices.

## Usage

### Development

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


## Credits

https://github.com/antfu/vitesse-webext for the starter template

