# Units and nutrition

Quantity, packaging, portions, pricing and nutrition use related but different fields. This reference explains which basis each field describes.

## Product quantity and normalization

`quantityPerUnit` and `quantityUnit` describe one purchasable product unit. Normalized quantities use grams for mass, millilitres for volume, or the count basis for count products.

| Quantity unit | Normalized factor | Example |
| --- | --- | --- |
| `mg` | 0.001 g | 1,000 mg = 1 g |
| `g` | 1 g | 500 g = 500 normalized grams |
| `kg` | 1,000 g | 0.5 kg = 500 g |
| `ml` | 1 ml | 250 ml = 250 normalized millilitres |
| `l` | 1,000 ml | 0.25 l = 250 ml |
| `unit` | Count basis | One unit of a count-based product |
| `pack` | Count basis | Package count for a count-based product |

For stock and food input, `unit` and `pack` can represent a whole product unit using the product's package quantity. For a product defined as 500 g per unit, 2 product units therefore mean 1,000 g.

Mass and volume are distinct dimensions. The app cannot infer density to turn grams into millilitres. Choose a compatible quantity unit rather than assuming these are interchangeable.

## Package type

`unitType` is a container label, not a conversion factor. Its stored values are:

`Paquet`, `Bouteille`, `Boite`, `Sachet`, `Canette`, `Bocal`, `Unite`, `Autre`.

These mean package, bottle, box, bag, can, jar, unit and other. Keep the stored spelling when creating JSON or calling the API.

## Portions

Supported portion names are `tranche` (slice), `piece`, `part`, `bouteille` (bottle) and `portion` (serving).

Configure a portion unit and its size or count before consuming in that unit. For a 500 g product with five equal portions, one portion is 100 g.

The form/API field `portionQuantityNormalized` is already expressed in the normalized base unit. The JSON creation field `portionQuantity` uses the product's declared `quantityUnit` and is normalized during import. For a 0.5 kg product with 0.1 kg portions, JSON `portionQuantity=0.1` becomes 100 normalized grams.

Available quantity choices depend on the product. Editing an existing line preserves its stored unit, including a default unit, instead of silently converting it to a different input basis.

## Price units

Prices are shown in euros in the current interface. Supported price-unit values are:

`kg`, `g`, `l`, `ml`, `unite`, `paquet`, `bouteille`, `boite`, `sachet`, `canette`, `bocal`, `autre`.

Mass/volume prices describe those units. Package and container prices describe a product unit. Supply price and price unit together so purchase accounting can calculate the amount.

## Nutrition values

Product nutrition rows use uppercase stored keys:

| Key | Meaning | Allowed units |
| --- | --- | --- |
| `ENERGY_KCAL` | Energy in kilocalories | `KCAL` |
| `ENERGY_KJ` | Energy in kilojoules | `KJ` |
| `FAT` | Total fat | `G`, `MG` |
| `SATURATED_FAT` | Saturated fat | `G`, `MG` |
| `CARBOHYDRATE` | Carbohydrates | `G`, `MG` |
| `SUGARS` | Sugars | `G`, `MG` |
| `PROTEIN` | Protein | `G`, `MG` |
| `FIBER` | Fibre | `G`, `MG` |
| `SALT` | Salt | `G`, `MG` |

References are `PER_100G` for mass products and `PER_100ML` for volume products. The metadata endpoints expose keys and quantity units; see [HTTP API](./api.md#metadata).

For a product containing 10 g protein per 100 g, consuming 250 g contributes 25 g protein. The recorded amount is scaled by normalized quantity and the nutrition reference.

An absent row is unknown and can produce an incomplete indicator in reporting. A zero row is an explicit known zero. Removing rows in a product editor removes them from persisted product nutrition.

Cycle/day-set/slot targets describe their planning totals, rather than a product serving. External entries supply whole-entry macros directly with `energyKcal`, `proteins`, `carbs` and `lipids`.
