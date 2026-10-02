# Statistics and prices

Statistics combines spending, daily nutrition comparisons and product price history. Open **Statistics** (`/statistic`) and choose an analysis view.

## Select a period

Use **7 days**, **30 days** or **90 days**, or set **From**, **To** and **Timezone** manually, then choose **Load**. **Refresh** reloads the current selection.

Date ranges are local calendar dates in the selected timezone. A purchase near midnight can belong to another date if you change that timezone.

## Spending

The spending view shows the total amount, tracked purchases, incomplete purchases and a daily timeline. Select a day for its event details.

Stock additions create purchase events using the product's applicable price. Free and excluded additions have different accounting statuses; missing price information remains visible as incomplete. Paid external meals also contribute spending.

Use **Refunded** to exclude a purchase event from counted spending. **Reintegrer** restores an excluded event to accounting. This changes reporting, not inventory stock. The API also accepts an exclusion reason; see [HTTP API](../reference/api.md#statistics).

Review purchase quantity, quantity unit, inventory and event time when a total is unexpected. Enter a product price with its correct price unit before adding stock if you want complete purchase accounting.

## Goals and day input

The nutrition view compares actual recorded intake against daily targets. Choose an energy or macro metric to inspect its timeline and day details.

The detail view identifies the cycle, active day set, target source, entered item count and incomplete nutrition keys. A template is intended food until converted; actual consumption must be recorded to appear as actual intake.

Targets come from your planning configuration. An absent target or an unknown product value has a different meaning from a target or nutrition value explicitly set to zero.

## Product price history

Choose a product to inspect versioned price changes, including old and new prices, price units, absolute changes and percentage deltas when available.

Editing a catalog price creates a new version. The correction form in Statistics can supply a replacement price, unit and effective start/end interval. Use it to correct the pricing history for a specific period, then reload the analysis.

Do not compare a per-package price and a per-kilogram price as if their bases were identical. The [unit reference](../reference/units-nutrition.md) explains pricing units.

## When results are incomplete

Check the period, timezone, purchase accounting mode, price versions, recorded consumption and missing nutrition rows. See [Troubleshooting](../troubleshooting.md#statistics-are-incomplete) for a checklist.
