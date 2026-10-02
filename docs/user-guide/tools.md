# Auxiliary tools

The main workflow is available from the application navigation. A few direct routes expose supporting screens or diagnostic tools.

## Nutrition-value tool

At `/nutrition-value`, the **Testeur valeurs nutritionnelles** screen lets you exercise nutrition-value API operations. It provides API configuration, request controls and a last-response area.

Use the backend's actual field names:

```json
{
  "productId": 1,
  "nutritionKey": "PROTEIN",
  "amount": 13,
  "unit": "G",
  "reference": "PER_100G"
}
```

Replace `productId` with an existing product ID. Keys, units and references are case-sensitive enums. This tool performs real API requests and can mutate data. Use a development database for experimentation. Manage a product's ordinary nutrition from [Catalog](./catalog.md) instead.

## Standalone day input

At `/input-day`, the full day editor includes date, timezone, API context and response information. It uses the same recording operations as the embedded editor in Home or Assignments.

Select source inventories and inspect the date before submitting. See [Record your day](./day-input.md).

## Standalone calendar

At `/calendar`, the calendar component runs without the full planning hub's assignment and input-data loading. It is useful for inspecting the component's views. Use `/planning` for the actual [Assignments workflow](./assignments.md).

## Supporting management routes

Categories, tags, generic products, day sets and time slots have direct management screens even though the main navigation groups them into Catalog and Cycles.

The complete mapping is in [Features and routes](../reference/features.md). These routes do not add an authentication boundary; they share the same application's access and backend.
