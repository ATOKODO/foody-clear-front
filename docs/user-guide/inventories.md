# Inventories

An inventory is a named stock location, such as `Pantry`, `Fridge` or `Freezer`. A product may be stocked in several inventories.

## Create an inventory

1. Open **Inventories** and choose **Add inventory**.
2. Enter a name.
3. Optionally choose initial products, enter positive quantities and compatible units.
4. Choose a **Stats** accounting option for each stock addition where offered, then save.

You can create an empty inventory and populate it later. The selected inventory's **Current stock** view is read-only; use **Edit** to manage its contents.

## Add, correct or remove stock

In the editor:

- **Open add products** opens the product picker. Enter the quantities to add, then submit **Add**.
- **Manage products** lets you edit current quantities and save the reconciliation.
- **Remove from list** removes a stock line when the edited contents are saved.
- **Empty inventory** clears its current stock.
- Renaming the inventory changes its label; removing the inventory removes the stock location.

An addition is a movement into stock. Reconciliation describes the stock that should remain, rather than blindly adding the displayed quantity again. To record eating food, use [day input](./day-input.md) instead of reducing stock manually: that keeps consumption and nutrition connected.

## Purchase accounting

Stock additions support these accounting modes:

| Mode | Meaning |
| --- | --- |
| `paid` | Record a purchase; its amount depends on product pricing |
| `free` | Record free stock without paid spending |
| `excluded` | Exclude the addition from spending accounting |

Missing pricing is visible as an incomplete purchase. It is separate from a product explicitly received free. Review events in [Statistics](./statistics.md).

## Consume from multiple inventories

The day editor can use several selected inventories as one source pool. Each product consumes only the quantities required, with allocations recorded against the actual source inventories.

For example, 60 g in `Pantry` plus 50 g in `Fridge` can satisfy a 100 g entry. A recipe checks availability separately for every required product; a high quantity of one ingredient cannot compensate for a missing different ingredient.

Editing a recorded entry restores its prior allocations before applying the replacement. Removing it restores stock to those source inventories. If a source inventory has since been deleted, the app cannot recreate that stock location; review inventory availability when changing older entries.

## Practical checks

Refresh after another workflow changes stock. If a quantity unit is unavailable, check the package and portion definitions in [Catalog](./catalog.md). Keep mass, volume and portion units consistent using the [unit reference](../reference/units-nutrition.md).
