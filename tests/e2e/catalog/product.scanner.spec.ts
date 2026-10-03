import { expect, test } from '../../fixtures/test';
import { gotoRoute } from '../../helpers/navigation';
import { selectMatOptionByLabel } from '../../helpers/material';

const foodFactsResponse = {
  status: 1,
  product: {
    product_name: 'Nutella', brands: 'Ferrero', quantity: '400 g',
    product_quantity: 400, product_quantity_unit: 'g', ingredients_text_fr: 'Sucre, noisettes, lait',
    allergens_tags: ['en:milk', 'en:nuts'], nutrition_grades: 'e',
    nutriments: { proteins_100g: 6.3 },
  },
};

const product = {
  barcode: '3017624010701', name: 'Nutella', brands: 'Ferrero', quantity: '400 g',
  quantityPerUnit: 400, quantityUnit: 'g', ingredients: 'Sucre, noisettes, lait',
  allergens: ['Lait', 'Fruits à coque'], nutriScore: 'E', imageUrl: null,
  sourceUrl: 'https://world.openfoodfacts.net/product/3017624010701',
  nutritionValues: [{ nutritionKey: 'PROTEIN', amount: 6.3, unit: 'G', reference: 'PER_100G' }],
};

test('reads a barcode on mobile, previews the facts, then imports for review before saving', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('https://world.openfoodfacts.net/api/v2/product/*', (route) => route.fulfill({ json: foodFactsResponse }));
  let writes = 0;
  page.on('request', (request) => { if (request.method() === 'POST' && new URL(request.url()).pathname === '/product') writes++; });
  await gotoRoute(page, '/product');
  await page.getByTestId('catalogue-add-action').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('tab', { name: 'Scanner', exact: true }).click();
  await dialog.getByLabel("Product barcode", { exact: true }).fill(product.barcode);
  const lookup = page.waitForRequest((request) => request.url().startsWith('https://world.openfoodfacts.net/api/v2/product/3017624010701.json?'));
  await dialog.getByRole('button', { name: "Search for the product", exact: true }).click();
  expect((await lookup).method()).toBe('GET');
  const result = dialog.getByTestId('food-facts-product');
  await expect(result).toContainText('Nutella');
  await expect(result).toContainText('Sucre, noisettes, lait');
  await expect(result).toContainText("Nutri-Score: E");
  await expect(result.getByRole('link', { name: 'Open Food Facts', exact: true })).toHaveAttribute('href', product.sourceUrl);
  expect(writes).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await dialog.locator('mat-dialog-content').evaluate((element) => { element.scrollTop = 0; });
  await page.screenshot({ path: testInfo.outputPath('mobile-scanner.png') });
  await dialog.getByRole('button', { name: "Use this information" }).click();
  await expect(dialog.getByRole('tab', { name: "Form", exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(dialog.getByLabel('Name *', { exact: true })).toHaveValue('Nutella');
  await expect(dialog.getByLabel("Quantity per unit *", { exact: true })).toHaveValue('400');
  expect(writes).toBe(0);
  await selectMatOptionByLabel(page, dialog, "Container type *", "Jar");
  const save = page.waitForRequest((request) => request.method() === 'POST' && new URL(request.url()).pathname === '/product');
  await dialog.getByRole('button', { name: "Confirm", exact: true }).click();
  expect((await save).postDataJSON()).toMatchObject({ name: 'Nutella', barcode: product.barcode, unitType: 'Bocal', quantityPerUnit: 400, nutritionValuesCreated: product.nutritionValues });
  await expect(dialog).toBeHidden();
});

test('keeps manual lookup available after camera permission is denied and handles missing products', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('Denied', 'NotAllowedError'));
  });
  await page.route('https://world.openfoodfacts.net/api/v2/product/*', (route) => route.fulfill({ json: { status: 0, status_verbose: 'product not found' } }));
  await gotoRoute(page, '/product');
  await page.getByTestId('catalogue-add-action').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('tab', { name: 'Scanner', exact: true }).click();
  await dialog.getByRole('button', { name: "Scan with camera" }).click();
  await expect(dialog.getByRole('alert')).toContainText('Camera access denied');
  await dialog.getByLabel("Product barcode", { exact: true }).fill('123');
  await dialog.getByRole('button', { name: "Search for the product", exact: true }).click();
  await expect(dialog.getByText("Enter a barcode with 8, 12, 13 or 14 digits.")).toBeVisible();
  await dialog.getByLabel("Product barcode", { exact: true }).fill('12345678');
  await dialog.getByRole('button', { name: "Search for the product", exact: true }).click();
  await expect(dialog.getByText(/Product not found in Open Food Facts/)).toBeVisible();
  await expect(dialog.getByTestId('food-facts-product')).toHaveCount(0);
});

test('decodes a real barcode video frame and stops the camera before reading product facts', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => {
      const canvas = document.createElement('canvas'); canvas.width = 800; canvas.height = 300;
      const context = canvas.getContext('2d')!;
      context.fillStyle = 'white'; context.fillRect(0, 0, 800, 300); context.fillStyle = 'black';
      const bits = '10100011010011001001000100001010011011010001101010111001011001101110010100010011100101100110101';
      [...bits].forEach((bit, index) => { if (bit === '1') context.fillRect(60 + index * 6, 50, 6, 200); });
      const stream = canvas.captureStream(10);
      Object.assign(window, { testCameraStream: stream });
      return Promise.resolve(stream);
    };
  });
  await page.route('https://world.openfoodfacts.net/api/v2/product/*', (route) => route.fulfill({ json: foodFactsResponse }));
  await gotoRoute(page, '/product');
  await page.getByTestId('catalogue-add-action').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('tab', { name: 'Scanner', exact: true }).click();
  await dialog.getByRole('button', { name: "Scan with camera" }).click();
  await expect(dialog.getByTestId('food-facts-product')).toContainText('Nutella');
  await expect(dialog.getByLabel("Product barcode", { exact: true })).toHaveValue(product.barcode);
  await expect.poll(() => page.evaluate(() => (window as typeof window & { testCameraStream: MediaStream }).testCameraStream.getTracks().every((track) => track.readyState === 'ended'))).toBe(true);
});

test('stops a running camera when changing tabs or closing the dialog', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => {
      const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480;
      const context = canvas.getContext('2d')!; context.fillStyle = 'white'; context.fillRect(0, 0, 640, 480);
      const stream = canvas.captureStream(10);
      Object.assign(window, { testCameraStream: stream });
      return Promise.resolve(stream);
    };
  });
  await gotoRoute(page, '/product');
  await page.getByTestId('catalogue-add-action').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('tab', { name: 'Scanner', exact: true }).click();
  await dialog.getByRole('button', { name: "Scan with camera" }).click();
  await expect.poll(() => dialog.locator('video').evaluate((video: HTMLVideoElement) => video.srcObject !== null)).toBe(true);
  await dialog.getByRole('tab', { name: 'JSON', exact: true }).click();
  expect(await page.evaluate(() => (window as typeof window & { testCameraStream: MediaStream }).testCameraStream.getTracks().every((track) => track.readyState === 'ended'))).toBe(true);
  await dialog.getByRole('tab', { name: 'Scanner', exact: true }).click();
  await dialog.getByRole('button', { name: "Scan with camera" }).click();
  await expect.poll(() => dialog.locator('video').evaluate((video: HTMLVideoElement) => video.srcObject !== null)).toBe(true);
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect.poll(() => page.evaluate(() => (window as typeof window & { testCameraStream: MediaStream }).testCameraStream.getTracks().every((track) => track.readyState === 'ended'))).toBe(true);
});
