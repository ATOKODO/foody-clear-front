import { expect, test } from '../../fixtures/test';
import { gotoRoute } from '../../helpers/navigation';

test('creates a product from JSON with name-based links and a live preview', async ({ page, mockApi }) => {
  await gotoRoute(page, '/product');
  await page.getByTestId('catalogue-add-action').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('tab', { name: 'JSON', exact: true }).click();
  const product = {
    name: 'JSON Oats', barcode: '0012345678901', category: 'Fruits',
    genericProduct: 'Banane', tags: ['Bio', 'Batch'], unitType: 'Paquet',
    quantityPerUnit: 0.5, quantityUnit: 'kg', portionCount: 10, portionUnit: 'portion',
    portionQuantity: 0.05, price: 2.5, priceUnit: 'paquet',
    url: 'https://example.com/oats', memo: 'Store in a dry place',
    nutritionValues: [{ nutritionKey: 'PROTEIN', amount: 13, unit: 'G', reference: 'PER_100G' }],
  };
  await dialog.getByLabel('JSON du produit', { exact: true }).fill(JSON.stringify(product));
  await expect(dialog.getByTestId('product-json-preview')).toHaveText(JSON.stringify(product, null, 2));
  await expect(dialog.getByTestId('product-json-summary')).toContainText('JSON Oats');
  await expect(dialog.getByTestId('product-json-example')).not.toContainText('categoryId');
  const request = page.waitForRequest((request) => request.method() === 'POST' && new URL(request.url()).pathname === '/product');
  await dialog.getByRole('button', { name: 'Ajouter le produit', exact: true }).click();
  expect((await request).postDataJSON()).toEqual({
    name: product.name, barcode: product.barcode, categoryId: 1, genericProductId: 1,
    tagIds: [1, 2], unitType: 'Paquet', quantityPerUnit: 0.5, quantityUnit: 'kg',
    portionCount: 10, portionUnit: 'portion', portionQuantityNormalized: 50,
    price: 2.5, priceUnit: 'paquet', url: product.url, memo: product.memo,
    nutritionValuesCreated: product.nutritionValues,
  });
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('row').filter({ hasText: 'JSON Oats' })).toBeVisible();
  expect(mockApi.state.products.find((product) => product.name === 'JSON Oats')?.categoryId).toBe(1);
});

test('validates pasted JSON, refreshes its preview and keeps both tab drafts', async ({ page }) => {
  await gotoRoute(page, '/product');
  await page.getByTestId('catalogue-add-action').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name *', { exact: true }).fill('Manual draft');
  await dialog.getByRole('tab', { name: 'JSON', exact: true }).click();
  const input = dialog.getByLabel('JSON du produit', { exact: true });
  const submit = dialog.getByRole('button', { name: 'Ajouter le produit', exact: true });
  await expect(submit).toBeDisabled();
  await input.fill('{');
  await expect(dialog.getByRole('alert')).toContainText('JSON invalide');
  await expect(submit).toBeDisabled();
  await expect(dialog.getByTestId('product-json-preview')).toHaveCount(0);
  const json = { name: 'Preview draft', unitType: 'Paquet', quantityPerUnit: 500, quantityUnit: 'g' };
  await input.fill(JSON.stringify({ ...json, category: 'Missing' }));
  await expect(dialog.getByRole('alert')).toContainText('introuvable');
  await expect(submit).toBeDisabled();
  await input.fill(JSON.stringify(json));
  await expect(dialog.getByRole('alert')).toHaveCount(0);
  await expect(submit).toBeEnabled();
  await expect(dialog.getByTestId('product-json-summary')).toContainText('Preview draft');
  await dialog.getByRole('tab', { name: 'Formulaire', exact: true }).click();
  await expect(dialog.getByLabel('Name *', { exact: true })).toHaveValue('Manual draft');
  await dialog.getByRole('tab', { name: 'JSON', exact: true }).click();
  await expect(input).toHaveValue(JSON.stringify(json));
  await dialog.getByRole('button', { name: 'Utiliser cet exemple' }).click();
  await expect(submit).toBeEnabled();
  await expect(input).toHaveValue(await dialog.getByTestId('product-json-example').innerText());
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByTestId('catalogue-add-action').click();
  await dialog.getByRole('tab', { name: 'JSON', exact: true }).click();
  await expect(input).toHaveValue('');
  await expect(submit).toBeDisabled();
});

test('keeps the JSON available for retry after an API failure', async ({ page }) => {
  await gotoRoute(page, '/product');
  await page.getByTestId('catalogue-add-action').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('tab', { name: 'JSON', exact: true }).click();
  const json = JSON.stringify({ name: 'Retry product', unitType: 'Paquet', quantityPerUnit: 500, quantityUnit: 'g' });
  await dialog.getByLabel('JSON du produit', { exact: true }).fill(json);
  await page.route('**/product', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 400, json: { message: 'Creation failed' } });
    } else {
      await route.fallback();
    }
  }, { times: 1 });
  await dialog.getByRole('button', { name: 'Ajouter le produit', exact: true }).click();
  await expect(dialog.locator('app-ui-error-panel')).toBeVisible();
  await expect(dialog.getByLabel('JSON du produit', { exact: true })).toHaveValue(json);
  await dialog.getByRole('button', { name: 'Ajouter le produit', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('row').filter({ hasText: 'Retry product' })).toBeVisible();
});
