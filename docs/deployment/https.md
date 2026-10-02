# HTTPS and phone cameras

Phone camera access and PWA installation require a trusted secure origin. Use a production deployment and serve the app over HTTPS without a browser certificate warning.

## Choose an HTTPS setup

- If you already have a trusted HTTPS reverse proxy, point it at the frontend container and preserve `/api` requests.
- For a local hostname, the repository provides a Caddy overlay using an internal certificate authority. Your phone must trust that authority and resolve the hostname to your server.

The following example builds on this documentation's [Compose deployment](./docker.md), so it does not depend on extra files outside the repositories.

## Local hostname with Caddy

From the workspace containing `compose.yml` and both repositories:

```sh
export FOODY_HOST=foody.home.arpa
export FOODY_MOBILE_CADDYFILE="$(pwd)/foody-clear-front/deploy/mobile/Caddyfile"
docker compose -f compose.yml -f foody-clear-front/deploy/mobile/compose.yml up -d --build
```

Port `443` must be available. The overlay adds Caddy and persists its certificates in named volumes. It proxies to the Compose `front` service.

Configure local DNS so `foody.home.arpa` resolves to the server's LAN address from your phone. Setting a hosts-file entry only on your laptop does not configure the phone. Keep `FOODY_HOST` consistent with the address you open.

## Trust the local certificate authority

Export the root certificate:

```sh
docker compose -f compose.yml -f foody-clear-front/deploy/mobile/compose.yml \
  cp mobile-https:/data/caddy/pki/authorities/local/root.crt /tmp/foody-local-ca.crt
```

Transfer that certificate to your device using a method you control.

- **iOS/iPadOS:** install the certificate profile, then enable full trust in Settings → General → About → Certificate Trust Settings.
- **Android:** install the CA certificate through the device's security/certificate settings. Names differ by device and Android version.

Trust only the authority you exported from your own deployment. Keep Caddy's `/data` volume private because it also contains the authority's private key. If you delete or recreate that volume, devices may need to trust a new certificate.

Open **https://foody.home.arpa** and confirm the page is trusted before trying the camera or installing the app. See [Caddy's local HTTPS guidance](https://caddyserver.com/docs/automatic-https#local-https) for how its internal CA works.

## Existing reverse proxy

Route the HTTPS hostname to the frontend's HTTP service. Keep the application at `/` unless you have deliberately configured an Angular subpath deployment. Requests to `/api/` must reach the frontend Nginx proxy or an equivalent backend route.

Avoid caching `ngsw.json` and `ngsw-worker.js` in a proxy or CDN. The supplied frontend Nginx sets `Cache-Control: no-cache` for them so mobile updates can be detected.

## Verify on the phone

1. Load the application with no certificate warning.
2. Confirm Catalog can load and a normal save reaches the backend.
3. Try manual barcode lookup to check Open Food Facts connectivity.
4. Allow camera access and scan a product.
5. Follow [Mobile app and offline access](../user-guide/mobile.md) to install it.

The more detailed original mobile setup notes are maintained in `deploy/mobile/README.md` in the frontend repository. For camera permissions, DNS and stale certificates, see [Troubleshooting](../troubleshooting.md).
