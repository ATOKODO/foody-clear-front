# Templates

A daily template is a reusable list of food you intend to consume. It can contain products, dishes and meals. A shopping template instead describes purchases; manage those in [Shopping lists](./shopping-lists.md).

## Create a daily template

1. Open **Templates**, choose the add action and enter a title.
2. Create the template, then add food lines.
3. For each line, choose **Product**, **Plat** (dish) or **Meals**, and select the item.
4. Enter a positive quantity and, for a product, a compatible unit. **Default unit** keeps the product's default basis.
5. Optionally select an explicit slot, enter a free `slotKey` or set a preferred time.
6. Add the line. Use **Edit**, **Update** or **Remove** to maintain it.

Preferred time uses local clock time, such as `08:30`. An explicit slot refers to an existing [time slot](./cycles.md#time-slots); a free slot key is a textual grouping key. Keep slot choices consistent with the day set or cycle that will use the template.

## Apply a template to a day

Templates can come from three places, in priority order:

1. A manual template selected for the date in the day editor.
2. The active day set's template.
3. The cycle's default template, on a day that uses the cycle defaults.

A day set can have no template. In that case the cycle default is not automatically substituted for that day set. A manual template can also be used on a date with no cycle assignment.

Clearing a manual selection removes that override and allows the applicable planning template to show again. It does not delete the reusable template definition.

## Planned and actual food

The day view separates planned template lines from actual recorded entries. Projected totals can include pending planned food; actual totals include recorded food.

**Convert** applies a planned line to the day, expanding dishes and meals into product quantities and consuming stock from the selected inventories. The item then becomes an effective entry linked to its template line.

**Restore to template** removes the effective conversion and restores its stock allocations. The planned item becomes pending again. Converting and restoring are actual data operations; simply selecting a template does not consume anything.

See [Record your day](./day-input.md) for inventory selection, unavailable ingredients and entry editing.

## Maintain templates

Use a clear title that describes the plan, such as `Training day breakfast`. Review references from day sets and cycles before deleting a template. Existing consumption is managed in its recorded day; changing the reusable plan is not a substitute for correcting those entries.
