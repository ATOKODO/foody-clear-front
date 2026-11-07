# Visual regression

The dedicated Playwright suite compares the actual Angular interface against committed PNG references. It uses the [mock API](./testing.md#mock-api-for-development-and-tests), so no backend or database is needed. English is the default interface language; selected French scenarios check translated screens with the same English sample names.

## Reference environment

Use **Ubuntu 24.04, Node 24 and Playwright 1.58.2** with its bundled Chromium in new headless mode (`channel: 'chromium'`). The exact Playwright version is pinned in the root package and lockfile. Browser versions, operating-system rendering and fonts affect comparisons.

From the frontend repository:

```sh
npm ci
npx playwright install --with-deps --no-shell chromium
sudo apt-get install -y fonts-noto-core fonts-dejavu-core fonts-liberation
npm run e2e:vrt
npm run e2e:vrt:report
```

Windows/macOS users should use an Ubuntu 24.04 VM or Linux environment for these comparisons and reference updates. When using a custom browser install location, export `PLAYWRIGHT_BROWSERS_PATH` during both installation and test execution.

`tests/visual/fonts.conf` fixes fallback-font selection. Chromium runs with software rendering and LCD subpixel text rendering disabled. The tests use application styles without masking page content.

The suite starts its own development server at **127.0.0.1:4400** and does not reuse another server. Service workers are blocked so they cannot bypass API interception. Reports go to `playwright-report/visual/`; actual images and diffs go to `test-results/visual/`. Both directories are ignored by Git.

## Coverage and profiles

All 16 registered routes use the full household mock: 31 products, five stock locations, five training/recovery cycles and 45 days of recorded food. Shopping and meal-prep responses come from the same shared handlers as Storybook, including stock-based recipe availability. Additional cases cover calendar year/week/day views, product creation, the nested inventory product picker, shopping-list empty/error states and mobile navigation. French cases cover Home, Calendar, product creation and the shopping-list error state.

Each viewport runs in both light and dark themes:

| Project prefix | Viewport | Input emulation |
| --- | --- | --- |
| `desktop` | 1440 × 1000 | Desktop |
| `mobile` | 390 × 844 | Mobile/touch |
| `iphone16pro` | 402 × 874 | Mobile/touch |
| `ipadpro11` | 834 × 1194 | Mobile/touch |
| `macbookpro14` | 1512 × 982 | Desktop |

Append `-light` or `-dark` to select a project, for example `ipadpro11-dark`. These ten profiles use Chromium with DPR 1. Device names identify viewport sizes; they do not represent Safari, macOS font rendering, Retina resolution or real-device validation.

The mobile drawer scenario is skipped above the 1024px shell breakpoint. Desktop page captures use full-page images. Phone/tablet captures use overlapping viewport images (`*-scroll-N.png`) to cover long pages; dialogs and drawers use a single viewport. Annual-calendar and planning cases also capture the current month/day after scrolling. Content hidden inside independently scrolling panels and every possible interaction are not covered automatically.

## Deterministic comparisons

Each test starts with a fresh browser context and cloned API state. Time is fixed at **25 March 2026, 12:00 Europe/Paris**, with locale `en-GB`, reduced motion and hidden text carets. The fixture waits for API requests, Angular testability when available, loading indicators and fonts before capturing.

Unexpected browser errors, failing API requests and external network dependencies fail the test. Only explicit error-state cases allow their deliberate API failure. Ordinary runs fail if a reference is missing.

The comparison allows **zero differing pixels** after a per-pixel color threshold of 0.1. There are no retries or automatically approved references. A changed sample name is still an intentional visual change because it can alter wrapping and layout.

## Review and update references

1. Run `npm run e2e:vrt` and inspect expected, actual and diff images with `npm run e2e:vrt:report`.
2. Fix unintended changes. Confirm the browser, fonts and operating system match the reference environment.
3. Update only the reviewed scenarios or profiles:

   ```sh
   npm run e2e:vrt:update -- --grep 'product' --project=desktop-light
   npm run e2e:vrt:update -- --project=iphone16pro-light --project=iphone16pro-dark
   ```

   For an intentional change affecting the whole interface or shared mock data:

   ```sh
   npm run e2e:vrt:update
   ```

4. Review the changed images in `tests/visual/__screenshots__/`.
5. Run `npm run e2e:vrt` again without updating, then commit the references together with the relevant code or fixture change.

Reference PNGs are versioned so a fork can compare against the same starting point. Reports and diffs are generated artifacts. Do not update references merely to silence a failure or generate new baselines in CI.

## Add a scenario

Add a test to `tests/visual/pages.visual.spec.ts`, importing `test` and `expect` from its local `fixture.ts`. Use `visual.open(path, landmarkTestId)` to load the page and `visual.ready()` after interactions. `visual.capture('name.png')` handles full-page or paged viewport captures; use `expect(page).toHaveScreenshot('name.png', { fullPage: false })` for a dialog or drawer.

Use visible landmarks and readiness checks instead of arbitrary delays. Extend the shared mock handlers or the typed supplementary data in `tests/visual/fixture.ts` when adding an endpoint. Unhandled API routes return 501 and must be implemented before recording references.

## Continuous integration

`.github/workflows/visual-regression.yml` runs on pull requests, pushes to `main` and manual dispatch. It installs the Ubuntu reference environment, checks browser-test types and compares the existing screenshots. It uploads the HTML report, actual captures and diffs for **14 days**; it does not approve or publish new references.

The separate Storybook workflow checks the component catalog and interactions. A passing visual suite does not replace [functional, backend or PostgreSQL checks](./testing.md).
