# Barcode lookup

The **Scanner** tab in the product creation dialog retrieves product information from Open Food Facts. You can use a camera or type a barcode.

## Look up a product

1. Open **Catalog → Add product → Scanner**.
2. Choose **Scan with camera**, or type the barcode and choose **Search for the product**.
3. If asked, allow the browser to use the camera. Point it at a clear, well-lit barcode.
4. Review the returned name, brand, package quantity, ingredients, declared allergens, Nutri-Score, image and nutrition values.
5. Choose **Use this information** to fill the product form.
6. Check the values, complete missing required fields and save the product.

A lookup does not create a catalog product automatically. Importing a result fills the editable form, and saving still requires your confirmation.

## Barcode formats

Manual lookup accepts **8, 12, 13 or 14 numeric digits**. Keep leading zeros. Do not type spaces, letters or separators.

The camera decoder supports EAN-8, EAN-13, UPC-A, UPC-E, ITF and numeric Code 128. A decoded value still has to meet the lookup's numeric length rule; a readable barcode may therefore be rejected if it does not identify a supported product.

The app prefers a rear-facing camera. Scanning stops after a match, when switching tabs, when hiding the app or when closing the dialog. Camera frames are processed in the browser; the lookup sends the decoded barcode.

## Where the request goes

The frontend calls:

```text
https://world.openfoodfacts.net/api/v2/product/{barcode}.json
```

This request is independent of the application API base URL. It does not go to `localhost:3000` or `/api`. The current `.net` host is the Open Food Facts staging environment; it may contain fewer products than the public `.org` database. The app provides the staging server's public `off` / `off` credentials automatically.

The backend also exposes an [optional lookup endpoint](../reference/api.md#open-food-facts-proxy). The current scanner uses the direct frontend request.

## Review imported values

- Name, quantity and nutrition may be missing or outdated; compare with the packaging.
- Select the package type yourself if it is missing.
- Category, tags and price are not guessed.
- Unknown nutrition is left absent, rather than set to zero.
- Mass products use nutrition per 100 g; volume products use per 100 ml when mapped from the source.
- Ingredients and allergens are source descriptions, not a guarantee that a food is suitable for a particular diet.

The result includes Open Food Facts attribution and a source link. Preserve attribution when reusing source data or images. See the upstream [data and image licenses](https://world.openfoodfacts.org/terms-of-use).

## Camera or lookup problems

Phone camera access requires a trusted HTTPS origin. Follow [HTTPS and phone cameras](../deployment/https.md). Manual barcode entry remains useful without camera access, but still needs internet connectivity. For missing products, invalid codes, timeouts or browser network failures, see [Troubleshooting](../troubleshooting.md#barcode-lookup-fails).
