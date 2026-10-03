# Visual regression tests

The dedicated Playwright suite compares the rendered UI with committed PNG references.
It is independent of the existing functional/PWA suites and does not need a backend.

## Run

The reference environment is **Ubuntu 24.04, Node 24, Playwright 1.58.2 and its bundled
Chromium in its new headless mode (`channel: 'chromium'`)**. Use the same environment for comparisons and reference updates:
browser versions, OS rendering and fonts affect screenshots. The suite supplies a
fixed Fontconfig configuration (`fonts.conf`) so workstation font preferences do not
change the Linux fallback fonts. It does not override application styles or mask content.
Chromium uses software rendering with LCD subpixel text rendering disabled to reduce
variation from GPU hardware and text rasterization; see the
[Chromium flag definition](https://github.com/chromium/chromium/blob/main/content/public/common/content_switches.cc).

```sh
npm ci
npx playwright install --with-deps --no-shell chromium
sudo apt-get install -y fonts-noto-core fonts-dejavu-core fonts-liberation
npm run e2e:vrt
npm run e2e:vrt:report
```

Windows/macOS can run the functional tests, but should use an Ubuntu 24.04 VM or Linux
environment for this suite; do not overwrite the Linux references with other platforms.
When browsers are installed in a custom directory, export `PLAYWRIGHT_BROWSERS_PATH`
both during installation and execution.

The dedicated development server runs on `127.0.0.1:4400`; the suite starts/stops it and
never reuses another server. It tests the actual Angular application styles and layout.
Service workers are blocked to keep API mocking independent of caches.

## Coverage and determinism

- All 17 routes, with populated catalog/inventory/planning/execution data.
- Calendar month/year/week/day, product creation dialog, nested inventory product picker.
- Shopping list empty/error states and the mobile navigation drawer.
- Desktop 1440 × 1000 and mobile 390 × 844, each in light and dark mode (DPR 1).
- A fresh browser context and cloned API state per test; date fixed at 25 March 2026,
  locale `en-GB`, timezone `Europe/Paris`, reduced motion and hidden text carets.
- Screenshots wait for completed API calls, Angular testability when available, loading indicators and fonts.
- Unexpected API/browser errors or external network dependencies fail tests. Only the
  explicit error-state scenario allows its deliberate 503 response and consequent
  client-side cancellation of sibling XHRs.

Desktop page/state captures are full-page; dialogs and the navigation drawer use viewport size.
Mobile pages use successive overlapping 390 × 844 viewport captures (`*-scroll-N.png`)
to cover content below the fold without Chromium's unstable very tall full-page rasterization.
The overlap accounts for the sticky app header. The two desktop drawer cases are intentionally skipped.
The long mobile annual calendar uses two actual 390 × 844 viewport captures: its overview
and the current month after scrolling. This avoids mixing visible/offscreen text raster
caches in a very tall screenshot while checking the real mobile presentation.
The mobile planning calendar likewise captures its overview and today's cell after scrolling.
This is an emulated responsive Chromium viewport, not validation on a real phone or
Safari. Offscreen content inside independently scrolling elements and every interaction
state are not exhaustive; add targeted captures when introducing new UI states.

The comparison allows **zero differing pixels** after a per-pixel color threshold of
0.1. There are no automatic retries or ignored dynamic regions. Missing references fail
ordinary runs too: tests must never silently create or approve a baseline.

## Review intentional changes

1. Run the comparison and inspect the HTML report's expected/actual/diff images.
2. Verify that each difference is intentional; fix regressions first.
3. Update only the affected references in the canonical environment:

   ```sh
   npm run e2e:vrt:update -- --grep 'product' --project=desktop-light
   # For an intentional global redesign:
   npm run e2e:vrt:update
   ```

4. Review the changed PNGs in `tests/visual/__screenshots__/` and run `npm run e2e:vrt`
   again without updating. Commit the references together with the related code.

Do not update snapshots in CI or merely to make a failing build pass. A Playwright or
font upgrade must be reviewed like a global UI change; the exact dependency is pinned.

## Add a capture

Add a test to `pages.visual.spec.ts`, import `test`/`expect` from `fixture.ts`, use
`visual.open(path, landmarkTestId)`, perform interactions, and call `visual.ready()`
before `visual.capture('descriptive-state.png')`. This uses full-page desktop captures
and paged mobile captures; for an overlay use `expect(page).toHaveScreenshot` with
`{ fullPage: false }` instead.
Use explicit visible landmarks rather than arbitrary sleeps. Extend the typed read-only
data in the fixture or the shared mock API for new endpoints; unexpected routes return
501 and fail the test instead of becoming error-page references.

## CI

`.github/workflows/visual-regression.yml` runs on pull requests, pushes to `main` and
manual dispatch. It uses Ubuntu 24.04 and the locked dependency, compares existing
references, and uploads the HTML report, screenshots and diffs for 14 days.
Generated reports/results are ignored by Git; references are not.

Reference: [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots).
