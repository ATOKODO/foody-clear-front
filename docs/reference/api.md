# HTTP API

This reference lists the backend controller routes for the current release. The backend has no global `/api` prefix: use `http://localhost:3000` from source, or the frontend origin plus `/api` through the production Nginx proxy.

Requests with a body use `Content-Type: application/json`. IDs in these paths refer to backend records. This API has no account/login flow or generated Swagger site in the current bootstrap.

## CRUD resources

Each resource below supports `GET /resource`, `GET /resource/:id`, `POST /resource`, `PATCH /resource/:id` and `DELETE /resource/:id`.

| Resource | Create-body essentials | Guide |
| --- | --- | --- |
| `/product` | `name`, `unitType`, `quantityPerUnit`, `quantityUnit`; optional relation IDs and nutrition | [Catalog](../user-guide/catalog.md) |
| `/category` | `name` | [Catalog](../user-guide/catalog.md) |
| `/generic-product` | `name` | [Catalog](../user-guide/catalog.md) |
| `/tag` | `name` | [Catalog](../user-guide/catalog.md) |
| `/inventory` | `name`, optional products | [Inventories](../user-guide/inventories.md) |
| `/shopping-list` | `name`, optional items | [Shopping](../user-guide/shopping-lists.md) |
| `/template` | `title` | [Templates](../user-guide/templates.md) |
| `/slot` | `key`, `title`, `sortOrder`, optional `nutritionValues` | [Slots](../user-guide/cycles.md#time-slots) |
| `/day-set` | `title`, optional targets, `slotIds`, `templateId` | [Day sets](../user-guide/cycles.md#day-sets) |
| `/cycle` | `title`, `color`, `durationDays`, optional targets, slots, template and day-set order | [Cycles](../user-guide/cycles.md) |
| `/cycle-assignment` | `cycleId`, `startDateLocal`; end date derived from cycle duration | [Assignments](../user-guide/assignments.md) |

Accepted controller aliases are `/slots`, `/daySet`, `/cycle-assignments` and `/cycle_assignment`. Prefer the canonical paths above for new integrations.

`GET /template/:id` additionally accepts `compareDaySetId`. `GET /cycle-assignment` accepts a `from` / `to` date range.

### Product example

```sh
curl --fail http://localhost:3000/product \
  -H 'Content-Type: application/json' \
  -d '{"name":"Rolled oats","unitType":"Paquet","quantityPerUnit":500,"quantityUnit":"g","nutritionValuesCreated":[{"nutritionKey":"PROTEIN","amount":13,"unit":"G","reference":"PER_100G"}]}'
```

Backend creation uses `categoryId`, `genericProductId`, `tagIds` and `nutritionValuesCreated`. It does not accept the JSON tab's name-based `category`, `tags` or `nutritionValues` fields as that user-facing format. See [Product JSON format](./product-json.md).

Nutrition values are managed through their owning resources; there is no standalone `/nutrition-value` CRUD endpoint.

Product updates can create nutrition rows, update existing owned rows and remove rows using `nutritionValueIdsToRemove`. An empty list of newly created rows alone does not instruct the API to delete existing rows. Do not update and remove the same nutrition ID in one request.

## Metadata

| Method and path | Purpose |
| --- | --- |
| `GET /meta/quantity-units` | Quantity-unit definitions |
| `GET /meta/nutrition-keys` | Nutrition keys and allowed units |
| `GET /` | Root greeting endpoint |

## Inventory

| Method and path | Purpose |
| --- | --- |
| `GET /inventory/:id/products` | Products held in an inventory |
| `PATCH /inventory/:id/products/add` | Add stock quantities |
| `PATCH /inventory/:id/products/remove` | Remove stock quantities/products |
| `PATCH /inventory/:id/products/reconcile` | Set the requested current product quantities |

Stock quantity rows use `productId`, `qty`, optional `qtyUnit` and optional `purchaseAccountingMode` (`paid`, `free`, `excluded`). Reconciliation uses a `products` array. Check the operation-specific DTO before sending a removal or additive payload.

## Shopping lists

| Method and path | Purpose |
| --- | --- |
| `POST /shopping-list/:id/items` | Add a list item |
| `PATCH /shopping-list/:id/items/:itemId` | Update a list item |
| `DELETE /shopping-list/:id/items/:itemId` | Remove a list item |
| `PATCH /shopping-list/:id/check-all` | Check or uncheck every line |
| `POST /shopping-list/:id/convert-checked` | Convert checked lines; body includes `inventoryId` |
| `POST /shopping-list/:id/save-template` | Save contents as a shopping template |
| `GET /shopping-list/templates` | List shopping templates |
| `GET /shopping-list/templates/:id` | Read a shopping template |
| `POST /shopping-list/templates` | Create a shopping template |
| `PATCH /shopping-list/templates/:id` | Update a shopping template |
| `DELETE /shopping-list/templates/:id` | Remove a shopping template |
| `POST /shopping-list/templates/:id/create-list` | Create a list from a template |

## Meal prep

For both `/meal-prep/dishes` and `/meal-prep/meals`:

| Method and path | Purpose |
| --- | --- |
| `GET /meal-prep/{dishes\|meals}` | List compositions with availability |
| `POST /meal-prep/{dishes\|meals}` | Create a composition |
| `PATCH /meal-prep/{dishes\|meals}/:id` | Update a composition |
| `DELETE /meal-prep/{dishes\|meals}/:id` | Remove a composition |
| `POST /meal-prep/{dishes\|meals}/:id/create-shopping-list` | Generate whole-product-unit shopping quantities for the recipe |

The braces are reference notation, not literal URL characters. A dish's `items` contain product IDs and quantities. A meal's items specify `itemType` (`product` or `dish`) and its matching ID. The controller does not expose a single-item GET route for dishes or meals.

## Daily templates

| Method and path | Purpose |
| --- | --- |
| `POST /template/:id/items` | Add a planned product, dish or meal |
| `PATCH /template/:id/items/:itemId` | Update a planned item |
| `DELETE /template/:id/items/:itemId` | Remove a planned item |

Item fields include `itemType`, the corresponding `productId`, `dishId` or `mealId`, `qty`, optional `qtyUnit`, `slotId`, `slotKey` and `preferredTime`.

## Day input

Let `:dateLocal` be a valid date such as `2026-03-25`. Read endpoints accept a `timezone` query parameter; use an IANA name such as `Europe/Paris`.

| Method and path | Purpose |
| --- | --- |
| `GET /input-days/:dateLocal` | One day's planning context, actual and projected totals |
| `GET /input-days/week/:startDateLocal` | Week data starting on the supplied date |
| `GET /input-days/month/:dateLocal` | Month containing the supplied date |
| `POST /input-days/:dateLocal/items` | Add one stock-backed food entry |
| `POST /input-days/:dateLocal/items/bulk` | Add several entries |
| `PATCH /input-days/:dateLocal/items/:itemId` | Update an entry and its stock allocations |
| `DELETE /input-days/:dateLocal/items/:itemId` | Remove an entry and restore available source stock |
| `PUT /input-days/:dateLocal/template` | Set or clear a manual template override |
| `POST /input-days/:dateLocal/template-items/:templateItemId/convert` | Convert a planned item into actual stock consumption |
| `POST /input-days/:dateLocal/external-entries` | Add a meal without inventory impact |
| `PATCH /input-days/:dateLocal/external-entries/:entryId` | Update an external meal |
| `DELETE /input-days/:dateLocal/external-entries/:entryId` | Remove an external meal |

An item creation example, with IDs replaced by existing records:

```json
{
  "productId": 1,
  "inventoryIds": [1, 2],
  "qty": 100,
  "qtyUnit": "g",
  "slotKey": "breakfast",
  "occurredAt": "2026-03-25T07:30:00Z"
}
```

`inventoryIds` pools stock across selected inventories. Legacy `inventoryId` is also supported. Template conversion accepts these source fields without a product quantity override. Set a manual template with `{ "templateId": 1 }`; clear it with `{ "templateId": null }`.

External meals use `name`, `occurredAt`, `paymentStatus`, optional `priceAmount`, and `nutritionValue` containing `energyKcal`, `proteins`, `carbs` and `lipids`. Optional fields include slot, restaurant and note. See [External meals](../user-guide/external-meals.md).

## Statistics

| Method and path | Purpose |
| --- | --- |
| `GET /statistics/timeline?from=…&to=…&timezone=…` | Spending and nutrition analysis for a local-date range |
| `GET /statistics/product-price-history/:productId?from=…&to=…&timezone=…` | Versioned product prices |
| `PATCH /statistics/purchase-events/:eventId/exclusion?from=…&to=…&timezone=…` | Change purchase reporting exclusion |
| `POST /statistics/product-price-corrections?timezone=…` | Correct product pricing over an effective interval |

Exclusion body: `{ "excludedFromStats": true, "exclusionReason": "refunded" }`. Reasons are `refunded`, `manual` or `other`. Restore with `excludedFromStats=false`.

Price correction fields: `productId`, `price`, `priceUnit`, `effectiveFrom`, optional `effectiveTo` and optional `recalculatePurchases`.

## Open Food Facts proxy

`GET /open-food-facts/products/:barcode` is an optional read-only backend lookup. It validates 8-, 12-, 13- or 14-digit barcodes and returns mapped source information without saving a catalog product.

The proxy normally uses `world.openfoodfacts.org`; `OPEN_FOOD_FACTS_ENV=staging` selects `.net`. It has an 8-second upstream timeout, a bounded 10-minute cache, request deduplication and a limit of 15 uncached upstream reads per minute per backend instance.

| Status | Meaning |
| --- | --- |
| 400 | Invalid barcode |
| 404 | Product absent |
| 429 | Local upstream-read limit reached |
| 502 | Invalid upstream response |
| 503 | Upstream unavailable |
| 504 | Upstream timeout |

The current frontend scanner calls `.net` **directly** instead of using this endpoint. See [Barcode lookup](../user-guide/barcode.md).

## Contract source and errors

The operation DTOs and controllers in the backend repository are the source of truth for accepted fields. Business services validate stock, date ranges, ownership and overlapping assignments. The bootstrap does not install a global `ValidationPipe`; do not assume every DTO decorator automatically rejects every malformed field in production.

Errors include HTTP status and, when available, business messages. Inspect those messages before retrying a save. See [Architecture](../development/architecture.md) for source locations and [Testing](../development/testing.md) for real PostgreSQL contract checks.
