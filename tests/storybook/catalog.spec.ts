import { readFileSync, readdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';

interface StoryEntry { id: string; type: string; title: string; name: string }
const index = JSON.parse(readFileSync('dist/storybook/index.json', 'utf8')) as { entries: Record<string, StoryEntry> };
const entries = Object.values(index.entries).filter(entry => entry.type === 'story');
const variants = [
  { theme: 'light', language: 'en', width: 1440, height: 960 },
  { theme: 'dark', language: 'fr', width: 390, height: 844 },
];

for (const theme of ['light', 'dark']) {
  test(`edit button keeps readable blue styling in ${theme} mode`, async ({ page }) => {
    await page.goto(`/iframe.html?id=ui-button--edit&viewMode=story&globals=theme:${theme};language:en`);
    const button = page.locator('button.app-ui-button--edit');
    await expect(button).toBeVisible();
    const colors = await button.evaluate(element => {
      const context = document.createElement('canvas').getContext('2d')!;
      const luminance = (color: string) => {
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        const rgb = Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3)
          .map(value => value / 255)
          .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
      };
      const style = getComputedStyle(element);
      const text = luminance(style.color);
      const background = luminance(style.backgroundColor);
      context.fillStyle = style.backgroundColor;
      context.fillRect(0, 0, 1, 1);
      const [red, , blue] = context.getImageData(0, 0, 1, 1).data;
      return { contrast: (Math.max(text, background) + 0.05) / (Math.min(text, background) + 0.05), red, blue };
    });
    expect(colors.contrast).toBeGreaterThanOrEqual(4.5);
    expect(colors.blue).toBeGreaterThan(colors.red);
  });

  for (const width of [390, 1440]) {
    test(`catalogue has no decorative gradient in ${theme} mode at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 960 });
      await page.goto(`/iframe.html?id=screens-product--populated&viewMode=story&globals=theme:${theme};language:en`);
      const catalogue = page.getByTestId('product-page');
      await expect(catalogue).toBeVisible();
      await expect(catalogue).toHaveCSS('background-image', 'none');
      await expect(catalogue).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      const decoration = await catalogue.evaluate(element => {
        const style = getComputedStyle(element, '::before');
        return { content: style.content, backgroundImage: style.backgroundImage };
      });
      expect(decoration).toEqual({ content: 'none', backgroundImage: 'none' });
      await expect(page.getByTestId('catalogue-view-toggle')).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath('catalogue.png') });
    });
  }
}

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

for (const theme of ['light', 'dark']) {
  for (const width of [390, 1440]) {
    for (const screen of [
      { story: 'screens-shoppinglist--populated', alternate: 'Shopping template' },
      { story: 'screens-inventory--populated', alternate: null },
      { story: 'screens-mealprepfeature--populated', alternate: 'Meals' },
      { story: 'screens-cyclefeature--populated', alternate: null },
    ]) {
      test(`shared blue Edit actions: ${screen.story} ${theme} ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 960 });
        const globals = `viewMode=story&globals=theme:${theme};language:en`;
        await page.goto(`/iframe.html?id=ui-button--edit&${globals}`);
        const reference = page.locator('button.app-ui-button--edit');
        await expect(reference).toBeVisible();
        const colors = await reference.evaluate(element => {
          const style = getComputedStyle(element);
          return { background: style.backgroundColor, border: style.borderTopColor, text: style.color };
        });
        await page.goto(`/iframe.html?id=${screen.story}&${globals}`);
        const checkEditButtons = async () => {
          const buttons = page.getByRole('button', { name: 'Edit', exact: true });
          await expect(buttons.first()).toBeVisible();
          for (const button of await buttons.all()) {
            if (!await button.isVisible()) continue;
            await expect(button).toHaveClass(/app-ui-button--edit/);
            await expect(button).toHaveCSS('background-color', colors.background);
            await expect(button).toHaveCSS('border-top-color', colors.border);
            await expect(button).toHaveCSS('color', colors.text);
          }
        };
        await checkEditButtons();
        if (screen.alternate) {
          await page.getByRole('radio', { name: screen.alternate, exact: true }).click();
          await checkEditButtons();
        }
      });
    }
  }
}

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

for (const width of [390, 834, 1024, 1440, 1512]) {
  test(`planning view options remain pill-shaped at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 982 });
    await page.goto('/iframe.html?id=screens-planningfeature--populated&viewMode=story&globals=language:en');
    const group = page.getByTestId('planning-view-toggle');
    await expect(group).toBeVisible();
    const buttons = group.locator('mat-button-toggle');
    await expect(buttons).toHaveCount(4);
    const groupBounds = (await group.boundingBox())!;
    for (const button of await buttons.all()) {
      const bounds = (await button.boundingBox())!;
      expect(bounds.width / bounds.height).toBeGreaterThanOrEqual(1.5);
      expect(bounds.x).toBeGreaterThanOrEqual(groupBounds.x);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(groupBounds.x + groupBounds.width);
      await expect(button).toHaveCSS('border-radius', '999px');
    }
    await group.screenshot({ path: testInfo.outputPath('planning-view-toggle.png') });
    await group.getByRole('radio', { name: 'Week', exact: true }).click();
    await expect(group.getByRole('radio', { name: 'Week', exact: true })).toBeChecked();
  });
}

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

test('day sets keeps the list and add action without a redundant hero banner', async ({ page }) => {
  await page.goto('/iframe.html?id=screens-daysetfeature--populated&viewMode=story&globals=language:en');
  await expect(page.getByTestId('day-set-list')).toBeVisible();
  await expect(page.getByTestId('day-set-add')).toBeVisible();
  await expect(page.locator('.bg-app-hero')).toHaveCount(0);
});

test('slots keeps the list and add action without a redundant hero banner', async ({ page }) => {
  await page.goto('/iframe.html?id=screens-slotfeature--populated&viewMode=story&globals=language:en');
  await expect(page.getByTestId('slot-list')).toBeVisible();
  await expect(page.getByTestId('slot-add')).toBeVisible();
  await expect(page.locator('.bg-app-hero')).toHaveCount(0);
});

for (const theme of ['light', 'dark']) {
  for (const width of [390, 834, 1440]) {
    test(`calendar item counters stay on one centered line in ${theme} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 960 });
      await page.goto(`/iframe.html?id=components-calendar--day&viewMode=story&globals=theme:${theme};language:en`);
      const counters = page.locator('.calendar-week-meta-pill').filter({ hasText: /\bitems$/ });
      await expect(counters).toHaveCount(2);
      for (const counter of await counters.all()) {
        await expect(counter).toHaveCSS('white-space', 'nowrap');
        const text = await counter.evaluate(element => {
          const range = document.createRange();
          range.selectNodeContents(element);
          const text = range.getBoundingClientRect();
          const pill = element.getBoundingClientRect();
          return { lines: range.getClientRects().length, centerOffset: (text.left + text.right - pill.left - pill.right) / 2 };
        });
        expect(text.lines).toBe(1);
        expect(Math.abs(text.centerOffset)).toBeLessThanOrEqual(1);
      }
    });
  }

  test(`monthly cycle cards retain readable text and tags in ${theme} mode`, async ({ page }) => {
    await page.goto(`/iframe.html?id=components-calendar--month&viewMode=story&globals=theme:${theme};language:en`);
    const card = page.getByTestId('calendar-month-day-2026-03-25').locator('.calendar-month-day__assignment');
    await expect(card).toBeVisible();
    for (const tone of ['blue', 'green', 'red', 'orange', 'violet', 'pink', 'amber']) {
      const contrasts = await card.evaluate((element, tone) => {
        element.classList.remove(...Array.from(element.classList).filter(name => name.startsWith('app-tone--')));
        element.classList.add(`app-tone--${tone}`);
        const context = document.createElement('canvas').getContext('2d')!;
        const luminance = () => {
          const rgb = Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3)
            .map(value => value / 255)
            .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
          return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
        };
        const background = getComputedStyle(element).backgroundColor;
        const nodes = element.querySelectorAll('.calendar-month-day__assignment-type, .calendar-month-day__assignment-title, .calendar-month-day__assignment-progress, .calendar-month-day__assignment-meta, .app-calendar-tag');
        return Array.from(nodes, node => {
          const style = getComputedStyle(node);
          context.fillStyle = background;
          context.fillRect(0, 0, 1, 1);
          context.fillStyle = style.backgroundColor;
          context.fillRect(0, 0, 1, 1);
          const bg = luminance();
          context.fillStyle = style.color;
          context.fillRect(0, 0, 1, 1);
          const fg = luminance();
          return { text: node.textContent?.trim(), contrast: (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05) };
        });
      }, tone);
      expect(contrasts.length).toBeGreaterThan(2);
      for (const result of contrasts) expect(result.contrast, `${tone}: ${result.text}`).toBeGreaterThanOrEqual(4.5);
    }
  });
}

for (const width of [390, 1440]) {
  test(`generic products groups Refresh and Add without a hero at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 });
    await page.goto('/iframe.html?id=screens-genericproduct--populated&viewMode=story&globals=language:en');
    const refresh = page.getByTestId('generic-product-refresh');
    const add = page.getByTestId('generic-product-add');
    await expect(refresh).toBeVisible();
    await expect(add).toBeVisible();
    await expect(page.locator('.bg-app-hero')).toHaveCount(0);
    await expect(add.locator('..')).toContainText('Refresh');
    await refresh.click();
    await expect(page.getByTestId('generic-product-list')).toBeVisible();
    await add.click();
    await expect(page.getByTestId('generic-product-dialog')).toBeVisible();
  });
}

for (const width of [834, 1440, 1512]) {
  test(`French calendar Entry label is centered at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/iframe.html?id=components-calendar--month&viewMode=story&globals=language:fr');
    const button = page.getByTestId('calendar-month-manage-items-2026-03-25');
    const label = button.locator('.calendar-month-day__quick-action-label');
    await expect(label).toBeVisible();
    await expect(label).toHaveText('Entrée');
    const bounds = await label.evaluate(element => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const text = range.getBoundingClientRect();
      const button = element.closest('button')!.getBoundingClientRect();
      return { offsetX: (text.left + text.right - button.left - button.right) / 2,
        offsetY: (text.top + text.bottom - button.top - button.bottom) / 2 };
    });
    expect(Math.abs(bounds.offsetX)).toBeLessThanOrEqual(1);
    expect(Math.abs(bounds.offsetY)).toBeLessThanOrEqual(2);
  });
}

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

for (const theme of ['light', 'dark']) {
  for (const width of [1100, 1440, 1512]) {
    test(`shell divider lines stay aligned in ${theme} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 982 });
      await page.goto(`/iframe.html?id=application-shell--home&viewMode=story&globals=theme:${theme};language:en`);
      const header = page.locator('.app-shell__header');
      const brand = page.locator('.app-shell__brand');
      await expect(header).toBeVisible();
      const checkAlignment = async () => {
        await expect.poll(async () => {
          const [headerBox, brandBox] = await Promise.all([header.boundingBox(), brand.boundingBox()]);
          return Math.abs(headerBox!.y + headerBox!.height - brandBox!.y - brandBox!.height);
        }).toBeLessThanOrEqual(1);
      };
      await checkAlignment();
      await page.getByTestId('language-fr').click();
      await checkAlignment();
      await page.locator('a[href="/shopping-list"]').click();
      await expect(page.getByTestId('shopping-list-page')).toBeVisible();
      await checkAlignment();
      await page.setViewportSize({ width: width === 1100 ? 1512 : 1100, height: 982 });
      await checkAlignment();
    });
  }
}

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
