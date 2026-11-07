# Troubleshooting

Start with the relevant symptom. For a backend error, read the business message displayed in the app and the backend logs before retrying.

## The app opens but data does not load

1. Confirm the backend is running and PostgreSQL is ready.
2. From a source installation, request `http://localhost:3000/product`.
3. From a production deployment, request the frontend address plus `/api/product`.
4. Inspect the browser's Network tab for the failing URL and status.

Development uses `http://localhost:3000`; production uses `/api`. A phone interprets `localhost` as itself. Use the [production proxy and HTTPS setup](./deployment/https.md) for access from other devices.

For Docker, inspect `docker compose -f compose.yml logs --tail=100 back`. An Nginx `502` can mean the `back` service is unavailable or its upstream name was changed.

## Backend startup or database connection fails

Check all required `POSTGRES_*` variables, the host from the backend's point of view, port conflicts and matching credentials. Docker's `db` name resolves inside the Compose network; a source process normally uses `localhost`.

PostgreSQL container initialization credentials are applied when its data directory is first created. Editing `.env` does not automatically change passwords in an existing database.

With an empty schema, `AUTO_SYNC_ON_EMPTY_DB=false` intentionally blocks automatic initialization. With existing tables, inspect migration failures rather than enabling routine `SYNC`. See [Configuration](./reference/configuration.md).

## Barcode lookup fails

The current scanner requests `https://world.openfoodfacts.net` directly. A request going to the application's API URL is not the expected frontend lookup path.

- Preserve leading zeros and enter 8, 12, 13 or 14 digits without spaces.
- A `404` means the product is absent from this source. The `.net` staging database can have fewer entries than `.org`.
- Check internet access from the browser, not just from the backend container.
- Browser extensions, filtering proxies or upstream CORS/authentication failures can block the direct request.
- A timeout or invalid upstream response can require retrying later or entering the product manually.

The frontend supplies the staging server's public credentials. Do not put application or database credentials into the scanner. The optional backend proxy has separate configuration and status codes; see [HTTP API](./reference/api.md#open-food-facts-proxy).

## Camera access fails

Open the app over trusted HTTPS. A LAN HTTP address is insufficient on a phone. Resolve certificate warnings and hostname DNS before checking browser camera permissions.

If permission was denied, re-enable it in the browser's site settings. Another app may be using the camera. Try the manual code field to separate a camera problem from an upstream lookup problem.

For local Caddy, install and trust the exported CA on the phone. If Caddy's data volume was replaced, export the current certificate again. See [HTTPS setup](./deployment/https.md).

## PWA installation or updates fail

Use a production build, a supported browser and a trusted origin. On iOS, use Safari's share menu. A browser may hide its install prompt if the app is already installed or an earlier prompt was dismissed.

For updates, check that `ngsw.json` and `ngsw-worker.js` are served fresh. Finish edits, then use **Update app** when available. A cached interface loading offline does not imply catalog data or saves can work offline.

See [Mobile app and offline access](./user-guide/mobile.md) for the supported boundary.

## A quantity cannot be saved or converted

Check that the quantity is positive, its unit is compatible and its product definition has the required package or portion size.

Select source inventories before converting a template. A recipe needs sufficient stock for **every** ingredient; adding more of a different ingredient cannot satisfy a missing product. Multiple inventories can jointly supply the same ingredient.

Refresh inventory and planning after external edits. If a source stock location has been removed, review the recorded entry and its available source pool. See [Day input](./user-guide/day-input.md).

## A cycle assignment conflicts

Assignments cannot overlap, including their start and end dates. Their end is derived from cycle duration. Move or remove the existing assignment, or choose a start date outside its range.

When editing a cycle, keep all day-set positions within the new duration and review the assignment impact dialog. See [Cycles](./user-guide/cycles.md).

## Dates or goals look wrong

Compare the selected local date, timezone and occurrence timestamp. Use valid IANA timezone names such as `Europe/Paris` and local dates such as `2026-03-25`.

Daily goals come from the active day set, otherwise the assigned cycle. A manual template overrides the food plan, not the goal source. A day set without targets does not automatically borrow the cycle's targets.

Home follows the current local day. If a tab was left open overnight, return to it or refresh. Overnight calendar segments do not imply duplicate food entries.

## Statistics are incomplete

- Check that the selected date range and timezone include the event.
- Confirm food was recorded or converted, rather than only planned.
- Add missing product nutrition rows where values are known.
- Check price, price unit and effective price version for stock purchases.
- Review free, refunded or excluded accounting statuses.

Missing nutrition and pricing are reported as incomplete; do not fill unknown values with zero merely to remove the indicator. See [Statistics](./user-guide/statistics.md).

## Product JSON is rejected

Use one object and the supported [JSON-tab format](./reference/product-json.md). Match enum spelling, use numeric amounts, remove unknown fields and create related names first. Backend response objects and ID-based DTOs are different formats.

## Browser tests cannot start or show old data

An error mentioning a missing browser executable usually means the installed binaries do not match the pinned Playwright version or the suite's browser configuration. Run `npm ci`, then install the browsers required by [Testing](./development/testing.md). The default application suite includes Firefox and WebKit smoke cases; Storybook and visual tests use full Chromium, while ordinary Chromium/PWA tests also need its headless shell.

If Storybook still displays old sample names or component behavior, run `npm run build-storybook` before `npm run storybook:test`: the tests serve the last static build. Normal application startup does not activate the mock API.

For screenshot differences, use the [visual reference environment and review workflow](./development/visual-regression.md#review-and-update-references). Check the browser, fonts and operating system before accepting new references.

## Documentation commands fail

Run `npm run docs:install` from the frontend before `docs:dev` or `docs:build`. The docs have their own lockfile; a root `npm ci` alone installs the Angular dependencies.

`FOODY_DOCS_BASE` must begin and end with a slash. Rebuild with the intended base before hosting at a subpath. Serve the generated site over HTTP(S), not by opening its HTML files directly. See [Maintain these docs](./development/documentation.md).
