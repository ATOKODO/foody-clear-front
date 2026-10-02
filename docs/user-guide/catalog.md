# Catalog and organization

The catalog describes products independently of where you keep them. Editing a product changes its description; it does not add stock to an inventory.

## Create or edit a product

1. Open **Catalog** (`/product`).
2. Choose **Add**, or select a product and choose **Edit**.
3. Enter a name, package/container type (`unitType`), positive package quantity (`quantityPerUnit`) and quantity unit (`quantityUnit`).
4. Optionally add a barcode, category, generic product, tags, portions, price, URL and memo.
5. Add the nutrition values you know and save with **Valider**.

The creation dialog also offers **JSON** and **Scanner** tabs. See [Product JSON](../reference/product-json.md) and [Barcode lookup](./barcode.md).

## Organize products

| Item | Purpose | Example |
| --- | --- | --- |
| Category | A product's category | Cereals |
| Generic product | A broader name grouping concrete products | Rolled oats |
| Tags | Multiple labels associated with a product | Organic, breakfast |

Use the Catalog management views to create, rename or remove these reference items. They also have direct routes: `/category`, `/generic-product` and `/tag`. Create reference items first when importing a product JSON that refers to them by name.

Search matches names, barcodes, categories, generic products and tags. The catalog list supports selection and product management actions.

## Package size, portions and price

A 500 g bag has `quantityPerUnit=500`, `quantityUnit=g`, and a package type such as `Paquet`. This describes one package, even if you have several bags in stock.

Optional portion fields describe slices, pieces, parts, bottles or servings. Configure portions before using those units for inventory or consumption. `portionQuantityNormalized` is expressed in the normalized base unit; the JSON creation tab instead accepts `portionQuantity` in the product's quantity unit.

Price and price unit should describe the same basis: for example €2.50 per package or €5.00 per kg. Editing a price creates a version and preserves older prices. `priceEffectiveFrom` can date an edit; in this release it is not applied during product creation. See [Statistics and prices](./statistics.md).

## Nutrition

Add rows by nutrition key, amount, unit and reference (`PER_100G` or `PER_100ML`). Removing a row and saving removes that stored value, including when you remove every nutrition row.

An absent value means **unknown**. A saved amount of zero means **known to be zero**. Keep that distinction so reporting can flag incomplete nutrition. See [Units and nutrition](../reference/units-nutrition.md).

## Removing products

Products can be referenced by inventory, shopping, recipes and recorded entries. Review those uses before removal. If an operation fails, the displayed backend error can explain the conflicting data; see [Troubleshooting](../troubleshooting.md).
