# Meal prep

Meal prep creates reusable food compositions. A **dish** contains catalog products. A **meal** contains products and dishes. These definitions can be used in planning templates and expanded into actual product consumption.

## Create a dish

1. Open **Meal prep**, select the dish view and choose **New dish**.
2. Enter the dish name.
3. Add a line, choose a catalog product, enter a positive quantity and select a compatible unit.
4. Add the remaining ingredients and save with **Create dish**.

For example, a dish could contain 100 g of oats and 200 ml of milk. Every selected ingredient needs a valid quantity; incomplete selected rows must be corrected before saving.

## Create a meal

Choose **New meal**, enter a name and add lines. Set each line's type to **Product** or **Dish**, choose the item and enter its quantity. Save with **Create meal**.

Dish quantities act as composition multipliers. Product lines use the selected product's units. Use **Default unit** only when you intend to use the product's default quantity basis. See [Units and nutrition](../reference/units-nutrition.md).

## Check current availability

Select a dish or meal to see its contents and stock status:

- **In stock / Ready with current stock:** the required ingredients are available.
- **Incomplete stock / Shopping needed:** at least one required product is short.

Availability combines relevant inventory stock by product, converts compatible units and checks each ingredient's requirement. The number of possible preparations is limited by the first ingredient that runs out.

Creating or editing a recipe does not consume ingredients or create a separate inventory item for the prepared food. Actual consumption is recorded through [day input](./day-input.md) and template conversion.

## Generate a recipe shopping list

Choose **Shopping list** in the selected dish or meal's detail view. The backend expands the recipe's product requirements and rounds them up to whole purchasable product units. In this release, generation uses the full recipe requirements and does not subtract existing stock. Review the list against your inventories before buying.

Open **Shopping lists** to adjust quantities, check purchases and transfer them into inventory.

Refresh Meal prep afterward to update the availability display.

## Reuse and maintain recipes

Add dishes and meals to a [daily template](./templates.md) to plan them repeatedly. A converted dish or meal expands into its product ingredients for stock and nutrition tracking.

Use **Edit** or **Remove** in the dish or meal list to manage definitions. Review dependent templates and meals when changing or removing a dish.
