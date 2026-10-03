# Auxiliary tools

The main workflow is available from the application navigation. A few direct routes expose supporting screens or diagnostic tools.

## Standalone day input

At `/input-day`, the full day editor includes a date picker, inventory selection, entries, templates and daily totals. It uses the same recording operations as the embedded editor in Home or Assignments. API configuration and timezone are handled automatically; there are no diagnostic or demo controls.

Select source inventories and inspect the date before submitting. See [Record your day](./day-input.md).

## Standalone calendar

At `/calendar`, the calendar component runs without the full planning hub's assignment and input-data loading. It is useful for inspecting the component's views. Use `/planning` for the actual [Assignments workflow](./assignments.md).

## Supporting management routes

Categories, tags, generic products, day sets and time slots have direct management screens even though the main navigation groups them into Catalog and Cycles.

The complete mapping is in [Features and routes](../reference/features.md). These routes do not add an authentication boundary; they share the same application's access and backend.
