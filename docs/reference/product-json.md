# Product JSON format

The **JSON** tab in **Catalog → Add** creates one product from a single JSON object. It is a user-facing, name-based format; it is different from the backend product DTO, which refers to related records by ID.

## Minimal example

```json
{
  "name": "Rolled oats",
  "unitType": "Paquet",
  "quantityPerUnit": 500,
  "quantityUnit": "g"
}
```

Paste the object, inspect the preview and choose **Ajouter le produit** (add the product). You can also choose **Utiliser cet exemple** to load the dialog's built-in example.

## Full example

Create the `Cereals` category, `Oats` generic product and `Breakfast` tag first, or omit those fields:

```json
{
  "name": "Rolled oats",
  "barcode": "0123456789012",
  "category": "Cereals",
  "genericProduct": "Oats",
  "tags": ["Breakfast"],
  "unitType": "Paquet",
  "quantityPerUnit": 500,
  "quantityUnit": "g",
  "portionCount": 5,
  "portionUnit": "portion",
  "portionQuantity": 100,
  "price": 2.5,
  "priceUnit": "paquet",
  "url": "https://example.com/oats",
  "memo": "Walkthrough example; replace values with the package label.",
  "nutritionValues": [
    { "nutritionKey": "ENERGY_KCAL", "amount": 370, "unit": "KCAL", "reference": "PER_100G" },
    { "nutritionKey": "PROTEIN", "amount": 13, "unit": "G", "reference": "PER_100G" }
  ]
}
```

The barcode above is illustrative. Download a [minimal product example](/examples/product.json) for an import with no reference-data dependencies.

## Accepted fields

| Field | Rule |
| --- | --- |
| `name` | Required nonempty string |
| `unitType` | Required stored package-type enum |
| `quantityPerUnit` | Required positive JSON number |
| `quantityUnit` | Required `mg`, `g`, `kg`, `ml`, `l`, `unit` or `pack` |
| `barcode` | Optional string; keep leading zeros |
| `category`, `genericProduct` | Optional names of existing records |
| `tags` | Optional array of existing tag names |
| `portionCount` | Optional positive integer |
| `portionUnit` | Required when defining portions; supported portion enum |
| `portionQuantity` | Optional positive size in the product's quantity unit |
| `price`, `priceUnit` | Optional pair; amount is a nonnegative number |
| `url` | Optional complete HTTP(S) URL |
| `memo` | Optional text |
| `nutritionValues` | Optional array of known nutrition rows |

Each nutrition row accepts only `nutritionKey`, `amount`, `unit` and `reference`. Amounts are nonnegative numbers; enum values must match the [unit and nutrition reference](./units-nutrition.md).

## Validation and limits

- Submit one object, not an array or a bulk export.
- Unknown fields are rejected. Do not paste IDs, API response fields, `priceEffectiveFrom` or `portionQuantityNormalized` into this format.
- Numbers must be JSON numbers, not strings such as `"500"`.
- Reference names must resolve to existing records; import does not create categories or tags.
- Supply both price fields together.
- A portion needs its unit and either count or size.
- Omit unknown nutrition rather than assigning zero.

The preview reports parsing or validation errors before a request can be submitted. For automation against the backend, use the [HTTP API](./api.md) format instead.
