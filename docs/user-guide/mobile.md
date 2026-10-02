# Mobile app and offline access

Foody Clear can be installed as a Progressive Web App (PWA). It uses the same application and backend as the browser version; it is not a separate native app or an app-store download.

## Before installing

Use a production build served from a trusted HTTPS origin. The Angular development server is useful for coding, but it does not provide the production service worker.

Open the HTTPS address on your phone and confirm it loads without a certificate warning. The backend must also be reachable through the application origin, normally via `/api`. See [Docker deployment](../deployment/docker.md) and [HTTPS setup](../deployment/https.md).

## Android

Open the app in a supporting browser and choose **Installer l’app**. If the browser offers an installation prompt, accept it. Otherwise use the browser menu's **Install app** or **Add to home screen** option.

Launch the resulting icon from your home screen. The app opens in standalone mode when the browser supports installation.

## iPhone and iPad

Open the app in **Safari**, open the share menu and choose **Add to Home Screen** (`Sur l’écran d’accueil`). Launch it from the new icon.

The in-app installation control displays these instructions when the browser cannot provide a direct install prompt.

## Camera scanning

Allow camera access when opening the product scanner. Use the rear camera, give the barcode enough light and keep it steady. Manual barcode entry is also available.

Camera scanning needs a trusted secure origin. A plain `http://192.168.…` LAN address does not provide that on a phone. Desktop `localhost` has different browser treatment and is not your phone's connection to the server. See [Barcode lookup](./barcode.md).

## What works offline

After a successful online visit, the production service worker caches the application shell and route code. That allows the interface to open or reload without downloading the app again.

| Operation | Connectivity needed |
| --- | --- |
| Open the cached interface | Can work offline after initial caching |
| Load catalog, stock, planning or statistics | Application backend |
| Save or edit data | Application backend |
| Look up a barcode | Internet access to Open Food Facts |

There is no offline write queue or background data synchronization in this release. Do not assume an unsuccessful offline save will be submitted later.

## Update the installed app

When the app detects a new version, **Mettre à jour l’app** reloads it to activate the update. Finish edits before reloading. The server must allow fresh requests for `ngsw.json` and `ngsw-worker.js`; the supplied Nginx configuration sets these files to `no-cache`.

For an old version that persists or an install prompt that is missing, see [Troubleshooting](../troubleshooting.md#pwa-installation-or-updates-fail).
