# All features and routes

This index covers every registered application screen, plus cross-screen features. Routes below belong to the **application**, not this documentation site. `/` redirects to `/home`.

## Main screens

| App route | Feature | Guide |
| --- | --- | --- |
| `/home` | Today's plan, conversion and restoration, entries, goals, spending, quick editor | [Navigation and dashboard](../user-guide/navigation.md) |
| `/product` | Product CRUD, search, form/JSON/scanner creation, package and portion definitions, nutrition and price versions | [Catalog](../user-guide/catalog.md) |
| `/shopping-list` | Lists, checked items, stock conversion, reusable shopping templates | [Shopping lists](../user-guide/shopping-lists.md) |
| `/inventory` | Stock locations, additions, reconciliation, removals, purchase accounting | [Inventories](../user-guide/inventories.md) |
| `/meal-prep` | Dishes, meals, ingredient stock availability, recipe shopping generation | [Meal prep](../user-guide/meal-prep.md) |
| `/template` | Planned product/dish/meal lines, units, slots and preferred times | [Templates](../user-guide/templates.md) |
| `/cycle` | Duration, color, daily goals, default slots/template, ordered day sets, assignment impact | [Cycles](../user-guide/cycles.md) |
| `/planning` | Year/month/week/day calendar, assignment CRUD, day actions and food entry context | [Assignments](../user-guide/assignments.md) |
| `/statistic` | Spending events, exclusions, nutrition goals vs actuals, versioned price history and corrections | [Statistics](../user-guide/statistics.md) |

## Supporting screens

| App route | Feature | Guide |
| --- | --- | --- |
| `/category` | Category creation, editing and removal; also embedded in Catalog | [Catalog organization](../user-guide/catalog.md#organize-products) |
| `/generic-product` | Generic product grouping; also embedded in Catalog | [Catalog organization](../user-guide/catalog.md#organize-products) |
| `/tag` | Product labels; also embedded in Catalog | [Catalog organization](../user-guide/catalog.md#organize-products) |
| `/day-set` | Daily targets, slots and template; also embedded in Cycles | [Day sets](../user-guide/cycles.md#day-sets) |
| `/slot` | Slot keys, titles, ordering and nutrition targets; also embedded in Cycles | [Time slots](../user-guide/cycles.md#time-slots) |
| `/input-day` | Standalone daily recording, batch entries, template override/conversion, stock sources, totals and external entries | [Record your day](../user-guide/day-input.md) |
| `/calendar` | Calendar component without the planning hub's backend orchestration | [Auxiliary tools](../user-guide/tools.md#standalone-calendar) |

## Features used across screens

| Feature | Where to learn more |
| --- | --- |
| Barcode camera decoding and manual Open Food Facts lookup | [Barcode lookup](../user-guide/barcode.md) |
| Name-based single-product JSON creation | [Product JSON format](./product-json.md) |
| Shared quantity conversion and portion handling | [Units and nutrition](./units-nutrition.md) |
| Multiple inventory sources and exact consumption allocations | [Day input](../user-guide/day-input.md) |
| Actual and projected nutrition, incomplete-value indicators | [Templates](../user-guide/templates.md) · [Statistics](../user-guide/statistics.md) |
| Restaurant/unplanned meals, macros and paid/free/refunded spending | [External meals](../user-guide/external-meals.md) |
| EN/FR switching, light/dark theme, responsive navigation and keyboard modal controls | [Navigation](../user-guide/navigation.md) |
| PWA installation, cached shell and update prompt | [Mobile guide](../user-guide/mobile.md) |
| Application API, metadata endpoints and optional backend barcode proxy | [HTTP API](./api.md) |

## Features not yet available

Authentication, multiple profiles, cloud accounts, queued offline writes and automatic offline synchronization are not part of this release. See [Project status](../project.md).
