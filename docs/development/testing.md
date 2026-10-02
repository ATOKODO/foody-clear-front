# Testing

Run checks from the indicated repository after installing its dependencies. Choose checks appropriate to the change; database and browser tests require their own prerequisites.

## Frontend

From `foody-clear-front`:

| Command | Checks |
| --- | --- |
| `npm run build` | Angular production compilation and bundle budgets |
| `npm run lint` | Angular TypeScript/template linting |
| `npm run style:check` | Repository style conventions |
| `npm test -- --no-watch --browsers=ChromeHeadlessNoSandbox` | Unit tests using the configured headless browser launcher |
| `npm run test:coverage` | Unit tests with coverage; requires ChromeHeadless |
| `npm run typecheck:e2e` | Playwright TypeScript compilation |
| `npm run e2e` | Application browser tests |
| `npm run e2e:smoke` | Tests marked `@smoke` |
| `npm run e2e:pwa` | Production build plus PWA/virtual-camera tests |

Install browser binaries if your environment does not already supply them:

```sh
npx playwright install chromium
```

See `playwright.config.ts` and `playwright.pwa.config.ts` for web-server and browser configuration. Karma needs a Chrome/Chromium executable; set `CHROME_BIN` when it is not discovered automatically. The no-sandbox launcher is intended for environments where the ordinary launcher cannot run.

Browser tests cover navigation, CRUD/editor behavior, stock-backed planning, keyboard interaction, scanner behavior and production app installation/offline shell behavior. Use the PWA configuration for service-worker behavior rather than assuming the development server tests it.

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

For stock and quantity changes, test two inventories jointly satisfying one entry, insufficient stock for a specific recipe ingredient, editing/deleting recorded consumption, stored unit preservation and exact source restoration.

For nutrition changes, test clearing all values and distinguishing absent values from zero. For time changes, test local midnight, timezone changes, daylight-saving transitions and overnight calendar entries.
