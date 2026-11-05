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
  // These are standalone UI compositions rather than component meta entries:
  // UiModal is a directive usage template, and the card story catalogs a shared Material surface.
  const compositionGroups = new Set(['ui-modal', 'ui-modal-card-surface']);
  for (const group of groups) if (!compositionGroups.has(group)) expect(documented.has(group), group).toBe(true);
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

test('production creation actions are primary and utility actions are secondary', async ({ page }) => {
  await page.goto('/iframe.html?id=screens-category--populated&viewMode=story&globals=language:en');
  const refresh = page.getByRole('button', { name: 'Refresh', exact: true });
  await expect(refresh).toHaveClass(/app-ui-button--secondary/);
  const addCategory = page.getByTestId('category-add');
  await expect(addCategory).toHaveClass(/app-ui-button--primary/);
  await addCategory.click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Create', exact: true })).toHaveClass(/app-ui-button--primary/);

  await page.goto('/iframe.html?id=screens-statisticfeature--populated&viewMode=story&globals=language:en');
  await expect(page.getByTestId('stat-refresh')).toHaveClass(/app-ui-button--secondary/);
  await expect(page.getByTestId('stat-load')).toHaveClass(/app-ui-button--secondary/);
  await page.getByTestId('stat-view-prices').click();
  await expect(page.getByTestId('stat-price-correction-submit')).toHaveClass(/app-ui-button--primary/);

  await page.goto('/iframe.html?id=components-calendar--week&viewMode=story&globals=language:en');
  const desktopAdd = page.getByTestId('calendar-week-add-2026-03-25');
  await expect(desktopAdd).toBeVisible();
  await expect(desktopAdd).toHaveClass(/app-ui-button--primary/);
  await expect(desktopAdd).toHaveAccessibleName('Add an item for 2026-03-25');
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileAdd = page.getByTestId('calendar-week-mobile-add-2026-03-25');
  await expect(mobileAdd).toBeVisible();
  await expect(mobileAdd).toHaveClass(/app-ui-button--primary/);
  await expect(mobileAdd).toHaveAccessibleName('Add an item for 2026-03-25');

  await page.goto('/iframe.html?id=components-product-scanner--manual-lookup&viewMode=story&globals=language:en');
  const search = page.getByRole('button', { name: 'Search for the product', exact: true });
  await expect(search).toHaveClass(/app-ui-button--secondary/);
  await page.getByLabel('Product barcode', { exact: true }).fill('3017620422003');
  await search.click();
  await expect(page.getByRole('button', { name: 'Use this information', exact: true })).toHaveClass(/app-ui-button--primary/);
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

test('meal prep shopping-list success uses the shared status notice', async ({ page }) => {
  await page.goto('/iframe.html?id=screens-mealprepfeature--populated&viewMode=story&globals=language:en');
  await page.getByRole('button', { name: 'Shopping list', exact: true }).first().click();
  const status = page.getByRole('status');
  await expect(status).toContainText('List created:');
  await expect(status).toHaveClass(/app-alert--success/);
});

test('cycle warning copy is documented in the warning-context component story', async ({ page }) => {
  await page.goto('/iframe.html?id=components-listcycle--warning-context&viewMode=story&globals=language:en');
  const card = page.locator('.lc-card').first();
  await card.locator('.lc-toggle-btn').click();
  await expect(card.getByText('1 day(s) without a day set use the cycle target directly.')).toBeVisible();
  await expect(card.getByText('Slot breakdown is unavailable for this day set.').first()).toBeVisible();
});

test('calendar template revert action uses the shared compact edit button', async ({ page }) => {
  await page.goto('/iframe.html?id=components-calendar--template-revert-action&viewMode=story&globals=language:en');
  const button = page.getByTestId(/^calendar-day-revert-template-/);
  await expect(button).toBeVisible();
  await expect(button).toHaveClass(/app-ui-button--edit/);
  await expect(button).toHaveClass(/app-ui-button--small/);
});

test('cycle form overflow story exposes the blocking visual state', async ({ page }) => {
  await page.goto('/iframe.html?id=components-formcycle--overflow&viewMode=story&globals=language:en');
  const items = page.locator('.fc-order-item');
  await expect(items).toHaveCount(2);
  await expect(items.nth(1)).toHaveClass(/border-app-danger-border/);
  await expect(items.nth(1)).toHaveClass(/bg-app-danger-surface/);
  await expect(items.nth(1)).toContainText('Position is outside the cycle duration. Move this day set before saving.');
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
});

test('calendar today story marks the real current date after using the Today action', async ({ page }) => {
  await page.goto('/iframe.html?id=components-calendar--today&viewMode=story&globals=language:en');
  const today = page.locator('.calendar-month-day--today');
  await expect(today).toBeVisible();
  await expect(today.locator('.calendar-month-day__today-pill')).toHaveText('Today');
});

test('form components have explicit compact dialog-spacing stories', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/iframe.html?id=components-formcycle--in-dialog&viewMode=story');
  const cycleForm = page.locator('#storybook-root app-form-cycle > section');
  await expect(cycleForm).toHaveClass(/px-3/);
  await expect(cycleForm).toHaveClass(/py-5/);
  await expect(cycleForm).not.toHaveClass(/py-10/);

  await page.goto('/iframe.html?id=components-daysetform--in-dialog&viewMode=story');
  const daySetForm = page.locator('#storybook-root app-day-set-form > section');
  await expect(daySetForm).toHaveClass(/px-3/);
  await expect(daySetForm).toHaveClass(/py-4/);
  await expect(daySetForm).not.toHaveClass(/py-8/);
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
