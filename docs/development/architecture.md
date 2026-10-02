# Architecture

Foody Clear is split into an Angular frontend and a NestJS backend, with PostgreSQL persistence. The backend is a modular monolith, not a set of separately deployed feature services.

## Runtime responsibilities

| Layer | Responsibility |
| --- | --- |
| Angular frontend | Screens, forms, calendar presentation, browser preferences and PWA |
| NestJS HTTP controllers | API routing and request/response handling |
| Application/domain services | Planning rules, stock operations, nutrition and pricing calculations |
| TypeORM infrastructure | Entities, database queries, transactions and migrations |
| PostgreSQL | Durable application data |
| Open Food Facts | External barcode product information |

Production Nginx serves the frontend and proxies `/api` to the backend. The current barcode scanner makes a separate direct browser request to Open Food Facts `.net`; the backend also has an optional proxy endpoint.

## Frontend source map

| Path | Contents |
| --- | --- |
| `src/app/app.routes.ts` | Lazy-loaded application routes |
| `src/app/app.navigation.ts` | Main navigation and header contexts |
| `src/features/` | Feature screens and their local state/view models |
| `src/components/` | Forms, lists, calendar and shared feature components |
| `src/app/ui/` | Modal behavior, errors, PWA and common controls |
| `src/services/` | HTTP clients, barcode decoding, mapping, theme and PWA services |
| `src/interfaces/` | Shared API/view types |
| `src/utils/` | Quantity, availability, date and latest-request helpers |
| `src/styles/` | Theme tokens, primitives and Material/Tailwind integration |
| `tests/e2e/` | Playwright application tests |
| `docs/` | Independent VitePress site and package |

Angular signals and feature state coordinate the UI. Replaceable read requests use cancellation to prevent an older response overwriting a newer selection. Save guards prevent repeated mutations while a request is in flight.

## Backend source map

| Path | Contents |
| --- | --- |
| `src/contexts/catalog/` | Catalog context wiring |
| `src/contexts/inventory/` | Inventory context wiring |
| `src/contexts/planning/` | Planning domain, application ports/use cases and infrastructure |
| `src/contexts/reporting/` | Reporting context wiring |
| `src/product/`, `src/inventory/`, etc. | Resource controllers, DTOs, entities and services |
| `src/shared/` | Shared quantity/date/validation logic |
| `src/database/` | Database configuration, lifecycle and migrations |
| `src/open-food-facts/` | Optional upstream lookup service |
| `test/` | HTTP integration/contract test configuration |

Planning separates domain rules from application use cases and persistence adapters. Some resource implementations remain in top-level feature directories; follow the existing dependency boundaries when changing them.

## Data invariants to preserve

- Product package quantity and stock quantity are distinct.
- Quantity conversion keeps mass, volume and count dimensions compatible.
- A recipe's stock availability is checked per product.
- Recorded consumption remembers its source allocations and restores them during edits/removal.
- Planned food is not actual consumption until converted.
- Day-set settings take precedence on their cycle day; manual template overrides affect food planning.
- Assignments use inclusive local-date ranges and may not overlap.
- Missing nutrition is distinct from a known zero.
- Price changes preserve effective history and purchase accounting.

Changes to these boundaries warrant meaningful API or database tests. See [Testing](./testing.md).

## Configuration and boundaries

Read [Configuration](../reference/configuration.md) before changing startup, migrations, API addresses or proxy settings. There is currently no authentication or tenant/profile boundary. Planned features are described in [Project status](../project.md).
