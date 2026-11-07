# Testing

Run checks from the indicated repository after installing its dependencies. Choose checks appropriate to the change; database and browser tests require their own prerequisites.

## Frontend

From `foody-clear-front`:

| Command | Checks |
| --- | --- |
| `npm run build` | Angular production compilation and bundle budgets |
| `npm run lint` | Angular TypeScript/template linting |
| `npm run style:check` | Repository style conventions |
| `npm run test:i18n` | Static coverage of translated application copy |
| `npm test -- --no-watch --browsers=ChromeHeadlessNoSandbox` | Unit tests using the configured headless browser launcher |
| `npm run test:coverage` | Unit tests with coverage; requires ChromeHeadless |
| `npm run typecheck:e2e` | Playwright TypeScript compilation |
| `npm run e2e` | Application browser tests |
| `npm run e2e:headed` | Application tests with a visible browser |
| `npm run e2e:smoke` | Tests marked `@smoke` |
| `npm run e2e:report` | Last application browser report |
| `npm run e2e:pwa` | Production build plus PWA/virtual-camera tests |
| `npm run e2e:vrt` | Compare the UI against committed screenshot references |
| `npm run e2e:vrt:update` | Generate references for reviewed, intentional visual changes |
| `npm run e2e:vrt:report` | Visual comparison report with expected/actual/diff images |
| `npm run storybook:check` | Coverage of every production component and story TypeScript compilation |
| `npm run build-storybook` | Static component/design-system workbench |
| `npm run storybook:test` | All built stories, themes/languages, network isolation and key interactions |

Install browser binaries if your environment does not already supply them:

```sh
npx playwright install --with-deps chromium firefox webkit
```

The default application suite uses Chromium for all cases and Firefox/WebKit for `@smoke` cases. To run only Chromium, install it with `npx playwright install --with-deps chromium` and use `npm run e2e -- --project=chromium`. This installs the headless shell needed by the application and PWA configurations. The visual and Storybook suites use the full Chromium binary through `channel: 'chromium'`; their `--no-shell` installation alone does not prepare the default application suite.

See `playwright.config.ts`, `playwright.pwa.config.ts`, `playwright.visual.config.ts` and `playwright.storybook.config.ts` for the separate servers and browser settings. Karma needs a Chrome/Chromium executable; set `CHROME_BIN` when it is not discovered automatically. The no-sandbox launcher is intended for environments where the ordinary launcher cannot run.

Browser tests cover navigation, CRUD/editor behavior, stock-backed planning, keyboard interaction, scanner behavior and production app installation/offline shell behavior. Use the PWA configuration for service-worker behavior rather than assuming the development server tests it.

See [Visual regression](./visual-regression.md) for the reference Linux environment, all ten viewport/theme profiles, screenshot review and CI artifacts. See [Storybook](./storybook.md) for the isolated component catalog, seeded scenarios and design-system maintenance.

## Mock API for development and tests

The application tests and visual suite use an in-memory API; they do not need the application backend or PostgreSQL. These fixtures are included in the repository, so a fork can run the same scenarios and customize the sample data.

| Location | Responsibility |
| --- | --- |
| `tests/mocks/state.ts` | English sample products, inventories, slots, plans and metadata |
| `tests/mocks/realistic-state.ts` | Full household scenario used by screen previews and visual comparisons |
| `tests/mocks/backend.ts` and `tests/mocks/handlers/` | Playwright request interception and in-memory CRUD responses |
| `tests/mocks/supplementary.ts` | Shared shopping, recipe availability and external-entry handlers |
| `tests/mocks/factories/` | Builders for additional test records |
| `tests/fixtures/test.ts` | Fresh mock state, default English interface and fixed clock per test |
| `tests/visual/fixture.ts` | Realistic mock setup and visual readiness checks |
| `stories/support/environment.ts` and `supplementary-api.ts` | Storybook HTTP adapter and re-export of the shared supplementary API |

Import `test` and `expect` from `tests/fixtures/test.ts` in application tests. The automatic fixture installs the mock and provides `mockApi`; change its state before opening a page when a scenario needs different data. Requests to unhandled application API paths return 501 rather than reaching the real backend. Add a typed fixture and handler for a new endpoint.

Functional CRUD tests start with the small `createMockApiState()` fixture. Storybook's populated screens and the visual suite use `createRealisticMockApiState()`: **31 products, 10 categories, nine tags, five stock locations, six time slots, six daily templates, eight day sets, five cycles and nine assignments**. The cycles cover recovery/deload, lean bulking, cutting, maintenance and plant-based recovery. A deterministic 45-day history contains 450 food entries; shopping and meal prep add eight dishes, six meals, four shopping lists and three shopping templates.

This fictional dataset includes long names, mass/volume/portion quantities, multiple price versions, incomplete product metadata, low ingredient stocks, an empty inventory and partially checked lists. It is checked into the repository and does not read or import a personal database. To use it in an application test, call `mockApi.reset(createRealisticMockApiState())` before navigation, importing the factory from `tests/mocks/realistic-state.ts`. Resetting also rebuilds the supplementary state and mutation IDs.

To explore it interactively, run `npm run storybook` and open **Application → Shell → Home** or any **Screens → Populated** story. Theme, language, component controls and the viewport toolbar remain available. Mutations stay in the story's memory, and a reload restores the seed.

Sample names stay in English when the interface switches to French. UI translation applies to application labels, not stored product or inventory names. Contract values such as `Paquet`, `Unite`, `unite` and `jour` retain their API spelling; see [Units and nutrition](../reference/units-nutrition.md).

The shared Playwright fixture fixes time at **25 March 2026, 12:00 Europe/Paris** and clones the API state for each test. Storybook uses the same sample date with its own preview clock. These are test/preview settings: `npm start` uses the configured real backend and normal browser time. The PWA suite has its own production-shell setup.

Mocked UI tests verify frontend behavior. Use the backend and PostgreSQL checks below to verify persistence, transactions and the real HTTP contract.

## Backend unit and build checks

From `foody-clear-back`:

```sh
npm run build
npm test -- --runInBand
npm run test:cov
```

`npm run lint` uses ESLint **with `--fix`**. `npm run format` also rewrites files. Review changes after either command.

## PostgreSQL contract tests

The real PostgreSQL suite checks HTTP DTO handling, stock transactions, nutrition removal and the inventory-allocation migration. It creates a dedicated `foody_contract_<pid>` database and drops that database after the run.

Use a local PostgreSQL server and a user permitted to create databases:

```sh
FOODY_CONTRACT_PG_PORT=5432 \
FOODY_CONTRACT_PG_USER=postgres \
npm run test:contract
```

Set `FOODY_CONTRACT_PG_PASSWORD` privately if required. The suite connects to `127.0.0.1` and does not read the application's normal database configuration. Its exact contract and options are recorded in the backend's `test/README.md`.

`npm run test:e2e` uses a separate Jest configuration. It is not an alias for the PostgreSQL contract suite.

## Documentation

```sh
npm run docs:install
npm run docs:build
```

VitePress validates Markdown page links during compilation. The post-build checker then verifies generated local links, assets and anchors, sidebar page coverage and coverage of every registered application route in the feature reference.

For changes to the theme or navigation, preview the site and check desktop/mobile navigation, search, appearance switching, direct page loads and downloadable examples. See [Maintain these docs](./documentation.md).

## Useful regression scenarios

### Language changes

Run `npm run test:i18n` for static-template coverage, including nested Angular control-flow branches and component text inputs. Use `node scripts/i18n-code-inventory.mjs` to review generated labels and validation messages; its candidates include technical constants and user-owned data, so this inventory requires manual classification. A clean static inventory does not prove that every dynamic screen is translated.

`tests/e2e/smoke/language.spec.ts` checks all registered pages in EN and FR, persistence, mobile positioning beside the theme, and draft preservation. The functional fixtures seed English only when no language has been saved. Cover both languages when changing forms, dialogs, empty states, error summaries or date controls; run the functional and visual suites as well.

Add application-owned copy to `src/app/i18n/messages.ts`. A string maps an English source to French; a pair normalizes an older source into `[English, French]`. Use named parameters for names, counts and dates. Keep product names, inventory names, recipe titles, API enum values and technical JSON unchanged. Translate only display labels, never values sent to the backend. Use `Language.locale()` for formatted output and preserve ISO/date-local values in requests.

### Stock, nutrition and time

For stock and quantity changes, test two inventories jointly satisfying one entry, insufficient stock for a specific recipe ingredient, editing/deleting recorded consumption, stored unit preservation and exact source restoration.

For nutrition changes, test clearing all values and distinguishing absent values from zero. For time changes, test local midnight, timezone changes, daylight-saving transitions and overnight calendar entries.
