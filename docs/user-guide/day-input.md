# Record your day

Day input records actual food consumption and connects it to inventory and nutrition. You can open it from **Home → Open quick entry**, **Assignments → Edit day**, or directly at `/input-day`.

## Set the context

Choose the date when using the standalone editor. Embedded editors inherit the selected day from their parent screen. The timezone is determined automatically from the browser and the day's API response.

Select one or more inventories to load available products and calculate whether planned food can be consumed. A batch slot can apply the same slot to all products in a batch. Individual entries can also have an explicit slot, a free slot key and an occurrence time.

Check that the selected date and occurrence time match when you ate the food. Local dates use `YYYY-MM-DD`; occurrence timestamps represent a specific moment.

## Add a manual product entry

1. Select the source inventories.
2. Choose a product available from that pool.
3. Enter a positive quantity and a compatible unit.
4. Select the slot or time context if needed.
5. Submit the entry or the selected batch of products.

Actual stock is deducted when the backend accepts the entry. The day refreshes to show entered items, nutrition totals and comparisons with targets.

Mass or volume can be entered directly when compatible with the product. Portions require a product portion definition. Refer to [Units and nutrition](../reference/units-nutrition.md).

## Convert planned food

The associated template area shows the active daily template. You can choose a manual template override or clear it to return to the planning context.

Choose **Convert** on a template item. A product becomes actual consumption; a dish or meal expands into ingredient products. Selected inventories can jointly provide the required stock. Availability must be sufficient for every ingredient before the conversion succeeds.

Converted lines are linked to the template. **Restore to template** returns them to planned status and restores their recorded stock allocations. See [Templates](./templates.md) for source priority and projected totals.

## Edit or remove entries

Use the entered-items actions to edit quantity, unit, slot or occurrence time, or to remove a record.

For stock-backed entries, the backend restores the old allocations before applying an edit's replacement consumption. Removal restores the recorded source quantities. An entry consumed from several inventories remembers those sources, so it can restore them rather than guessing one inventory.

If an inventory or product has been removed since the original entry, review the result and any available-stock error. Do not assume that deleting an old entry recreates deleted inventory locations.

## Understand the totals

The editor shows recorded items, grouping by slot, actual totals, targets and deltas. Pending template food can contribute to projected totals without being counted as actual consumption.

An incomplete nutrition indicator means at least one required product value is unknown. Entering zero changes that meaning; only do so for a value you know is zero. See [nutrition reference](../reference/units-nutrition.md#nutrition-values).

Meals outside stock should be entered as [external meals](./external-meals.md). These contribute nutrition without requiring a catalog product or changing inventory.
