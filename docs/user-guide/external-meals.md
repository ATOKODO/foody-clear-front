# External meals

External entries record unplanned food such as restaurant meals. They add nutrition and optional spending to a day without consuming inventory or requiring a catalog product.

## Add an external entry

Open **External entry** on Home, or choose **Add external meal** from the planning day's actions.

Complete the dialog:

| Field | What to enter |
| --- | --- |
| Date and time | When you ate the food |
| Meals / slot | An existing slot, or no slot |
| Meal / dish name | A recognizable name |
| Restaurant / source | Optional source of the meal |
| Status | Paid, free or refunded |
| Price | A positive amount for paid food |
| Energy | Total kcal for this entry |
| Proteins, carbs, lipids | Total grams for this entry |
| Note | Optional explanation |

Submit **Add**. The entry appears in the day and contributes its totals to nutrition reporting.

## Whole-entry nutrition

External-entry macros describe the **entire recorded meal**, not values per 100 g or 100 ml. For example, entering 600 kcal and 30 g protein records those totals for the entry directly.

All four macro fields are required and must be nonnegative. If your information is only an estimate, record that context in the note. These fields do not use the catalog's nutrition-key/reference format.

## Spending status

- **Paid:** the supplied price contributes to spending.
- **Free:** the entry has no paid spending amount.
- **Refunded:** the entry is excluded from counted spending.

The interface indicates when a price is not counted. These statuses are distinct from stock purchase accounting, described in [Inventories](./inventories.md#purchase-accounting).

## Correct an entry

Use the external-entry actions in the day editor to update or remove it. Edits affect the meal's own nutrition and spending; inventory remains unaffected.

Check [Statistics](./statistics.md) after changes to confirm the selected date range and timezone include the meal.
