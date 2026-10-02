# Maintain these docs

This site uses **VitePress 1.6.4** with the default theme and a small green color customization. Its package and lockfile live inside `foody-clear-front/docs`, independently of Angular's dependency graph. The docs package pins Vite 6.4.3 through an override to use a patched build tool with the stable VitePress release. A small resolver alias keeps local-search hot updates compatible with this Vite version.

## Run locally

From `foody-clear-front`:

```sh
npm run docs:install
npm run docs:dev
```

Open **http://localhost:5173**. You do not need the application backend, PostgreSQL or Angular dev server to read or edit the documentation.

Equivalent commands from `docs` are `npm ci` and `npm run dev`. The root scripts are convenience wrappers.

## Site structure

| Location | Purpose |
| --- | --- |
| `index.md` | Home page and task-oriented entry links |
| `getting-started/` | Overview, source installation and first-use walkthrough |
| `user-guide/` | Every feature workflow and mobile instructions |
| `reference/` | Feature/route index, API, configuration, formats and glossary |
| `deployment/` | Docker, HTTPS, backups and updates |
| `development/` | Architecture, tests and documentation maintenance |
| `.vitepress/config.mts` | Navigation, sidebar, local search, metadata and hosting base |
| `.vitepress/theme/` | Theme entry and color overrides |
| `public/examples/` | Downloadable Compose, environment and product JSON examples |
| `scripts/check-site.mjs` | Post-build link, anchor and coverage checks |

## Add or change a page

1. Write English Markdown in the appropriate section.
2. Add a sidebar link in `.vitepress/config.mts`.
3. Link the new topic from a relevant guide or the feature index.
4. For a new app route, update `reference/features.md` with its exact route and guide link.
5. Build and fix any reported page, anchor or route-coverage failures. VitePress excludes example localhost addresses from its dead-link check; real generated page links remain checked.

Use relative `.md` links between source pages, and quote real app labels when necessary. Keep documented workflows aligned with both frontend behavior and backend rules. Distinguish current behavior from planned features.

The local search index is generated from the documentation. No hosted search service, token or external account is required.

## Build and host

```sh
npm run docs:build
npm run docs:preview
```

Preview at **http://localhost:4173**. Publish the contents of `docs/.vitepress/dist` to a static HTTP(S) host. `preview` is a local verification server, not the deployment artifact.

The default output uses `.html` page URLs. A static server must serve the generated nested HTML files and assets. Do not apply the Angular application's `index.html` fallback to every documentation URL; missing pages should produce a 404.

For hosting under a subpath, build with the matching base:

```sh
FOODY_DOCS_BASE=/foody-clear/ npm run docs:build
FOODY_DOCS_BASE=/foody-clear/ npm run docs:preview
```

This example expects the site to be available at `/foody-clear/`. The base must start and end with a slash. A build for `/` is different from a build for a repository subpath.

For a standalone check of an already-built subpath site, keep the same `FOODY_DOCS_BASE` when running `npm --prefix docs run check`.

The generated site is portable and needs no Node.js process when served statically. See the official [VitePress v1 deployment guide](https://vuejs.github.io/vitepress/v1/guide/deploy) for host-specific setup.

## Generated files and application builds

Git ignores docs dependencies, VitePress cache and generated output. The frontend Docker build excludes the documentation directory because that image serves the Angular app. Build and host the documentation separately.

Commit Markdown, theme/configuration, scripts and the docs lockfile together when changing the site. External publishing is a separate deployment action.
