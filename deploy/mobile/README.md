# Foody Clear on a phone

Build and serve the production frontend to enable the Angular service worker. The app has a web manifest, home-screen icons, standalone display, an installation button, and an offline application shell. Product data and saves still require the backend; barcode lookups require an internet connection to Open Food Facts; there is no offline write queue.

## Install and scan

Open the app's **trusted HTTPS address** on your phone. On Android use **Installer l’app** or the browser's install menu. On iPhone/iPad use Safari's share menu → **Sur l’écran d’accueil**. HTTPS is required for installability and camera access; a plain HTTP LAN address such as `http://192.168.1.20` is insufficient. [PWA requirements](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [camera requirements](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#privacy_and_security).

In **Catalog → Add product → Scanner**, choose **Scanner avec la caméra**, or enter the barcode digits and search. The scanner prefers the rear camera and supports EAN-8, EAN-13, UPC-A, UPC-E, ITF and numeric Code 128 product codes. Camera frames stay in the browser; only the decoded barcode is sent directly to `https://world.openfoodfacts.net/api/v2/product/{barcode}.json`, independently of the application API URL. This staging server uses the documented public `off/off` HTTP Basic authentication; the browser supplies it automatically. The camera stops after a match, on tab changes, when the app is hidden, or when the dialog closes.

The result displays product name, brand, quantity, ingredients, declared allergens, Nutri-Score, nutrition and the Open Food Facts source. **Utiliser ces informations** fills the regular product form for review; it does not save automatically. Missing names or package quantities must be completed, and the container type remains a user choice. Categories, tags and prices are not guessed from the external record. Missing nutrition values remain missing; `_100g` values are mapped in their standard units, with a per-100ml reference for packages measured in ml.

## Local HTTPS with the supplied Compose overlay

This optional overlay adds a Caddy HTTPS gateway to the existing Compose stack. The phone must be able to reach the server on the local network.

1. Build the frontend and backend images from the updated repositories, using the image tags in your existing Compose stack:

   ```bash
   # Run from the parent workspace containing front, back and docker/.
   docker build -t foody-clear-front:1.0.0-alpha.1 ./foody-clear-front
   docker build -t foody-clear-back:1.0.0-alpha.1 ./foody-clear-back
   ```

2. Configure `foody.home.arpa` in your router's local DNS to point to the server's LAN IP. You can instead set `FOODY_HOST` to another local hostname, or to that LAN IP and open `https://<that-IP>`.

3. Start the existing stack with the overlay, from the parent workspace:

   ```bash
   export FOODY_HOST=foody.home.arpa
   export FOODY_MOBILE_CADDYFILE="$(pwd)/foody-clear-front/deploy/mobile/Caddyfile"
   docker compose -f docker/docker-compose.yml -f foody-clear-front/deploy/mobile/compose.yml up -d
   ```

   The existing `docker/.env` database configuration is still required. If you use a separate database, use `docker/docker-compose-no-db.yml` as the first file. Port 443 must be available on the server. The frontend's existing `/api` proxy keeps application API calls on the same HTTPS origin, so the phone never calls its own `localhost:3000`.

4. Caddy creates a local certificate authority. Export its **public root certificate**, then install and trust it on the phone:

   ```bash
   docker compose -f docker/docker-compose.yml -f foody-clear-front/deploy/mobile/compose.yml \
     cp mobile-https:/data/caddy/pki/authorities/local/root.crt /tmp/foody-local-ca.crt
   ```

   On iOS, install the certificate profile and enable full trust in **Settings → General → About → Certificate Trust Settings**. On Android, use the system settings to install a CA certificate. Open `https://foody.home.arpa` and verify there is no certificate error before installing the app or using the camera. [Caddy local HTTPS documentation](https://caddyserver.com/docs/automatic-https#local-https).

If your existing reverse proxy already provides trusted HTTPS, use it instead of the overlay. Preserve the same-origin `/api` route. The included Nginx configuration sends `Cache-Control: no-cache` for `ngsw-worker.js` and `ngsw.json`.

## Tests

```bash
npm run e2e -- tests/e2e/catalog/product.scanner.spec.ts --project=chromium
npm run e2e:pwa
```

The scanner tests feed an actual EAN-13 image as a video stream, verify the request/import flow and camera cleanup, and cover denied permissions. The PWA tests serve the production build, check Chrome's installation criteria in a normal browser profile, verify icons and service worker control, and reload/navigate with the browser offline. Playwright Chromium must be installed (`npx playwright install chromium`). Mobile browser emulation does not replace a final camera check on your physical phone.
