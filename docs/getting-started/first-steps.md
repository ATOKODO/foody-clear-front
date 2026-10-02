# Your first day

This walkthrough starts from an empty installation. It creates a product, adds stock, plans a day and records actual consumption. You can also start with stock and day input alone, then add planning later.

## 1. Add a product

Open **Catalog**, choose **Add**, and use the **Formulaire** tab (the product form).

Create an example product:

| Field | Example |
| --- | --- |
| Name | Rolled oats |
| `unitType` | `Paquet` (package) |
| `quantityPerUnit` | `500` |
| `quantityUnit` | `g` |
| Price / price unit | `2.50` / `paquet`, if you know the purchase price |
| Energy | `370`, `KCAL`, `PER_100G` |
| Protein | `13`, `G`, `PER_100G` |

These numbers are walkthrough data, not a nutritional recommendation. Use the packaging values for real products. Leave unknown nutrition rows absent rather than entering zero.

Save with **Valider**. Categories, generic products and tags are optional; you can add them later. You can also use [barcode lookup](../user-guide/barcode.md) or the [JSON tab](../reference/product-json.md).

## 2. Create an inventory

Open **Inventories**, choose **Add inventory**, and name it `Pantry`. Select the oats as an initial product and enter **500 g**. Save.

The quantity is the stock you own. A product's `quantityPerUnit` describes one package; it is separate from the current inventory quantity. The [unit reference](../reference/units-nutrition.md) explains conversions.

If you prefer the shopping workflow, create a [shopping list](../user-guide/shopping-lists.md), check the oats and convert the checked line into `Pantry` instead of adding the same stock twice.

## 3. Create a reusable plan

1. In **Cycles**, use the time-slot management view to create `Breakfast`, with key `breakfast` and an appropriate sort order.
2. In **Templates**, create `Simple breakfast`.
3. Add the oats as a **Product** line, **100 g**, using the breakfast slot. Optionally set a preferred time such as `08:00`.
4. In **Cycles**, create a cycle lasting one day. Select the breakfast slot and `Simple breakfast` as its default template. Add nutrition targets if you want comparisons.

There is no stock movement yet. Templates describe intended meals. [Cycles](../user-guide/cycles.md) can also contain day sets for longer or varied plans.

## 4. Assign the cycle

Open **Assignments**. Select today's date and choose **Manage cycle** from the day actions. Select your cycle, check the start date and validate the assignment.

The day view and **Home** dashboard now show the plan for this date.

## 5. Record breakfast

From **Home**, convert the planned oats, or open the day editor and convert the template line. Select `Pantry` as the source inventory and submit the conversion.

The recorded **100 g** consumes that amount of oats. You should have **400 g** remaining. Day nutrition is computed from the values entered for the product: this example contributes 370 kcal and 13 g protein.

You can also add a manual entry from inventory. Editing or removing a recorded stock entry adjusts the affected inventory quantities. See [Record your day](../user-guide/day-input.md).

## 6. Review the result

- **Home** summarizes today's plan, entries, goals and spending.
- **Assignments** shows actual entries in the selected day.
- **Statistics** compares recorded nutrition with targets and shows purchase accounting.

Next, try [meal prep](../user-guide/meal-prep.md) to build a dish or [external meals](../user-guide/external-meals.md) to record a restaurant meal.
