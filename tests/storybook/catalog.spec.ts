import { readFileSync, readdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';

interface StoryEntry { id: string; type: string; title: string; name: string }
const index = JSON.parse(readFileSync('dist/storybook/index.json', 'utf8')) as { entries: Record<string, StoryEntry> };
const entries = Object.values(index.entries).filter(entry => entry.type === 'story');
const variants = [
  { theme: 'light', language: 'en', width: 1440, height: 960 },
  { theme: 'dark', language: 'fr', width: 390, height: 844 },
];

test('every component group has generated API metadata without extraction errors', () => {
  const groups = new Set(entries.map(entry => entry.id.split('--')[0]));
  const directory = 'dist/storybook/services/core/docgen';
  const documented = new Set<string>();
  for (const file of readdirSync(directory)) {
    const data = JSON.parse(readFileSync(`${directory}/${file}`, 'utf8')) as { components: Record<string, { name: string; error?: unknown }> };
    for (const [id, component] of Object.entries(data.components)) {
      expect(component.error, component.name).toBeUndefined();
      documented.add(id);
    }
  }
  // UiModal is a directive usage template, not a component meta entry.
  for (const group of groups) if (group !== 'ui-modal') expect(documented.has(group), group).toBe(true);
});

for (const variant of variants) {
  for (const story of entries) {
    test(`${variant.theme}/${variant.language}: ${story.title}/${story.name}`, async ({ page }) => {
      const failures: string[] = [];
      const external: string[] = [];
      page.on('pageerror', error => failures.push(error.message));
      page.on('request', request => {
        if (/^https?:/.test(request.url()) && !request.url().startsWith('http://127.0.0.1:6007')) external.push(request.url());
      });
      await page.setViewportSize(variant);
      await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=theme:${variant.theme};language:${variant.language}`);
      // An accessible icon-only button is rendered even when it has no text content.
      await expect.poll(() => page.locator('#storybook-root').evaluate(root => root.childElementCount), { timeout: 20_000 }).toBeGreaterThan(0);
      await expect(page.locator('#storybook-root')).toHaveAttribute('data-story-finished-id', story.id, { timeout: 20_000 });
      await expect(page.locator('#storybook-root')).toHaveAttribute('data-story-finished-status', 'success');
      await expect(page.locator('html')).toHaveAttribute('lang', variant.language);
      await expect.poll(() => page.locator('html').evaluate(el => el.classList.contains('dark'))).toBe(variant.theme === 'dark');
      await expect(page.locator('.sb-errordisplay')).not.toBeVisible();
      await expect(page.locator('.sb-nopreview')).not.toBeVisible();
      await page.waitForTimeout(200);
      expect(failures, 'Runtime errors').toEqual([]);
      expect(external, 'Stories must not send requests to the real backend').toEqual([]);
      await expect(page.locator('#storybook-root')).not.toContainText('Unmocked Storybook request');
      if (story.title.startsWith('Screens/') && ['Populated', 'Empty'].includes(story.name)) {
        await expect(page.locator('app-ui-error-panel')).toHaveCount(0);
      }
      if (story.id === 'design-system-foundations--tokens') {
        const tokens = await page.locator('.token code').allTextContents();
        expect(tokens.length).toBeGreaterThan(100);
        for (const token of tokens) {
          const value = await page.locator('html').evaluate((el, name) => getComputedStyle(el).getPropertyValue(name).trim(), token);
          expect(value, token).not.toBe('');
        }
      }
    });
  }
}

test('segmented control updates selection and modal restores focus', async ({ page }) => {
  await page.goto('/iframe.html?id=ui-segmented-toggle--interactive&viewMode=story&globals=language:en');
  await page.getByRole('radio', { name: 'Week', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Week', exact: true })).toBeChecked();
  await page.goto('/iframe.html?id=ui-modal--interactive&viewMode=story');
  const trigger = page.getByRole('button', { name: 'Open modal' });
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('Controls update inputs, Actions record outputs and Autodocs exposes the API', async ({ page }) => {
  await page.goto('/?path=/story/ui-segmented-toggle--interactive');
  await page.getByRole('tab', { name: 'Controls' }).click();
  const row = page.getByRole('row').filter({ has: page.getByText('ariaLabel', { exact: true }) });
  await row.getByRole('textbox').fill('Demo selection');
  await row.getByRole('textbox').blur();
  const canvas = page.frameLocator('#storybook-preview-iframe');
  await expect(canvas.locator('mat-button-toggle-group')).toHaveAttribute('aria-label', 'Demo selection');
  await canvas.getByRole('radio', { name: 'Week', exact: true }).click();
  await page.getByRole('tab', { name: /^Actions\b/ }).click();
  await expect(page.getByText('valueChange', { exact: false }).last()).toBeVisible();
  await page.goto('/?path=/docs/ui-segmented-toggle--docs');
  await expect(page.frameLocator('#storybook-preview-iframe').getByRole('heading', { name: 'Segmented toggle', exact: true })).toBeVisible();
  await expect(page.frameLocator('#storybook-preview-iframe').getByText('ariaLabel', { exact: true })).toBeVisible();
});

test('manual scanner lookup also works inside the product creation form', async ({ page }) => {
  const external: string[] = [];
  page.on('request', request => {
    if (/^https?:/.test(request.url()) && !request.url().startsWith('http://127.0.0.1:6007')) external.push(request.url());
  });
  await page.goto('/iframe.html?id=components-productform--create&viewMode=story&globals=language:en');
  await page.getByRole('tab', { name: 'Scanner', exact: true }).click();
  await page.locator('input[name="barcode"]').fill('3017620422003');
  await page.locator('.scanner__search button').click();
  await expect(page.getByTestId('food-facts-product')).toContainText('Demo banana');
  await page.locator('.scanner__result > button').click();
  await expect(page.locator('input[formcontrolname="name"]')).toHaveValue('Demo banana');
  expect(external).toEqual([]);
});

test('shopping list creation persists in memory and reload resets the story', async ({ page }) => {
  await page.goto('/iframe.html?id=screens-shoppinglist--populated&viewMode=story&globals=language:en');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('input').fill('Storybook groceries');
  await dialog.locator('.shopping-list-modal-card__body > button').click();
  await expect(page.locator('.shopping-list-list-card__title').filter({ hasText: 'Storybook groceries' })).toBeVisible();
  await expect(page.locator('app-ui-error-panel')).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId('shopping-list-panel')).toBeVisible();
  await expect(page.locator('.shopping-list-list-card__title').filter({ hasText: 'Storybook groceries' })).toHaveCount(0);
});

test('recipe editing saves through the isolated API', async ({ page }) => {
  await page.goto('/iframe.html?id=screens-mealprepfeature--populated&viewMode=story&globals=language:en');
  await page.locator('.meal-prep-list-card__actions').first().getByRole('button', { name: 'Edit', exact: true }).click();
  const editor = page.getByTestId('meal-prep-editor-dialog');
  await editor.getByLabel('Dish name', { exact: true }).fill('Storybook recipe');
  await editor.getByRole('button', { name: 'Save dish', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(page.locator('.meal-prep-list-card__title').filter({ hasText: 'Storybook recipe' })).toBeVisible();
  await expect(page.locator('app-ui-error-panel')).toHaveCount(0);
});

test('shell navigation stays inside the canvas and uses isolated data', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto('/iframe.html?id=application-shell--home&viewMode=story&globals=language:en');
  await expect(page.locator('.app-shell__header-title')).toHaveText('Home');
  await page.locator('.app-shell__nav-link').filter({ hasText: 'Shopping list' }).click();
  await expect(page.getByTestId('shopping-list-page')).toBeVisible();
  await expect(page.locator('.shopping-list-list-card__title').first()).toHaveText('Courses de la semaine');
  await expect(page).toHaveURL(/\/iframe\.html\?/);
  await expect(page.locator('app-ui-error-panel')).toHaveCount(0);
});

test('shared buttons support keyboard activation, disabled/loading states and accessible icons', async ({ page }) => {
  await page.goto('/iframe.html?id=ui-button--primary&viewMode=story');
  const button = page.getByRole('button', { name: 'Save', exact: true });
  await button.evaluate(node => {
    node.setAttribute('data-activations', '0');
    node.addEventListener('click', () => node.setAttribute('data-activations', String(Number(node.getAttribute('data-activations')) + 1)));
  });
  await button.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await expect(button).toHaveAttribute('data-activations', '2');
  for (const state of ['disabled', 'loading']) {
    await page.goto(`/iframe.html?id=ui-button--${state}&viewMode=story`);
    await expect(button).toBeDisabled();
    if (state === 'loading') await expect(button).toHaveAttribute('aria-busy', 'true');
    await button.evaluate(node => {
      node.setAttribute('data-activations', '0');
      node.addEventListener('click', () => node.setAttribute('data-activations', '1'));
      node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    await expect(button).toHaveAttribute('data-activations', '0');
  }
  await page.goto('/iframe.html?id=ui-button--icon&viewMode=story');
  await expect(page.getByRole('button', { name: 'Add', exact: true })).toBeVisible();
  await expect(page.locator('button svg')).toHaveAttribute('aria-hidden', 'true');
});

test('button variants are editable in Controls and activation is recorded in Actions', async ({ page }) => {
  await page.goto('/?path=/story/ui-button--primary');
  await page.getByRole('tab', { name: 'Controls' }).click();
  const variant = page.getByRole('row').filter({ has: page.getByText('variant', { exact: true }) });
  await variant.getByRole('combobox').selectOption('danger');
  const button = page.frameLocator('#storybook-preview-iframe').getByRole('button', { name: 'Save', exact: true });
  await expect(button).toHaveClass(/app-ui-button--danger/);
  await button.click();
  await page.getByRole('tab', { name: /^Actions\b/ }).click();
  await expect(page.getByText('activated', { exact: false }).last()).toBeVisible();
});
