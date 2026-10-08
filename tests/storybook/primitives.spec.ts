import { expect, test } from '@playwright/test';

for (const language of ['en', 'fr']) {
  for (const width of [320, 390]) {
    test(`calendar navigation stays within the mobile viewport (${language}, ${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      for (const view of ['year', 'month', 'week', 'day']) {
        await page.goto(`/iframe.html?id=components-calendar--${view}&viewMode=story&globals=language:${language}`);
        await expect(page.getByTestId('calendar-root')).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        for (const id of ['calendar-today', 'calendar-prev', 'calendar-next']) {
          const button = page.getByTestId(id);
          await expect(button).toBeVisible();
          const rect = await button.evaluate(element => element.getBoundingClientRect().toJSON());
          expect(rect.left, `${view}/${id}: left edge`).toBeGreaterThanOrEqual(0);
          expect(rect.right, `${view}/${id}: right edge`).toBeLessThanOrEqual(width);
        }
      }
      await page.setViewportSize({ width: 1440, height: 844 });
      const heading = page.locator('[data-testid="calendar-root"] header h2');
      await expect(heading).toHaveCSS('min-width', '200px');
    });
  }
}

for (const theme of ['light', 'dark']) {
  test(`overview metrics keep value-label geometry and responsive owner placement (${theme})`, async ({ page }) => {
    await page.setViewportSize({ width: theme === 'dark' ? 390 : 1440, height: 844 });
    const metric = page.locator('#storybook-root [appOverviewMetric]');
    await page.goto(`/iframe.html?id=ui-overview-metric--zero&viewMode=story&globals=theme:${theme}`);
    await expect(metric.locator('.app-overview-metric__value')).toHaveText('0');
    await expect(metric).toHaveCSS('display', 'flex');
    await expect(metric).toHaveCSS('flex-direction', 'column');
    await expect(metric).toHaveCSS('border-radius', '16px');
    await expect(metric).toHaveCSS('padding-top', '12.8px');
    await expect(metric).toHaveCSS('padding-left', '15.2px');
    await expect(metric.locator('.app-overview-metric__value')).toHaveCSS('font-size', '18.4px');
    await expect(metric.locator('.app-overview-metric__value')).toHaveCSS('font-weight', '700');
    await expect(metric.locator('.app-overview-metric__label')).toHaveCSS('font-size', '11.52px');
    await expect(metric.locator('.app-overview-metric__label')).toHaveCSS('text-transform', 'uppercase');
    expect(await metric.getAttribute('role')).toBeNull();
    expect(await metric.getAttribute('aria-live')).toBeNull();
    expect(await metric.evaluate(element => (element as HTMLElement).tabIndex)).toBe(-1);
    await page.goto(`/iframe.html?id=ui-overview-metric--formatted-value&viewMode=story&globals=theme:${theme}`);
    await expect(metric.locator('.app-overview-metric__value')).toHaveText('1 234,5');
    await page.goto(`/iframe.html?id=ui-overview-metric--long-label&viewMode=story&globals=theme:${theme}`);
    await expect(metric.locator('.app-overview-metric__label')).toContainText('active calendar months');
    expect(await metric.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
    for (const [view, count, value] of [['year', 3, '12'], ['month', 4, '31'], ['week', 4, null]] as const) {
      await page.goto(`/iframe.html?id=components-calendar--${view}&viewMode=story&globals=theme:${theme}`);
      await expect(metric).toHaveCount(count);
      if (value) await expect(metric.first().locator('.calendar-week-overview__value')).toHaveText(value);
      const cards = await metric.evaluateAll(elements => elements.map(element => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width, top: rect.top, minWidth: getComputedStyle(element).minWidth, flexBasis: getComputedStyle(element).flexBasis };
      }));
      expect(cards.every(card => card.width >= 120)).toBe(true);
      if (theme === 'dark') {
        expect(cards.every(card => card.flexBasis === '128px')).toBe(true);
        expect(cards[0].top).toBeCloseTo(cards[1].top, 1);
        expect(cards[2].top).toBeGreaterThan(cards[0].top);
        expect(await page.locator('html').evaluate(element => element.scrollWidth)).toBeLessThanOrEqual(390);
      }
    }
  });

  test(`date summaries retain optional detail and planning dialog geometry (${theme})`, async ({ page }) => {
    await page.setViewportSize({ width: theme === 'dark' ? 390 : 1440, height: 844 });
    const badge = page.locator('#storybook-root [appDateBadge]');
    await page.goto(`/iframe.html?id=ui-date-badge--date-only&viewMode=story&globals=theme:${theme}`);
    await expect(badge.locator('.app-date-badge__value')).toHaveText('2026-03-25');
    await expect(badge.locator('.app-date-badge__detail')).toHaveCount(0);
    await expect(badge).toHaveCSS('display', 'grid');
    await expect(badge).toHaveCSS('min-width', '168px');
    await expect(badge).toHaveCSS('border-radius', '16px');
    await expect(badge).toHaveCSS('padding-top', '12.8px');
    await expect(badge).toHaveCSS('padding-left', '15.2px');
    await expect(badge.locator('.app-date-badge__label')).toHaveCSS('font-size', '10.56px');
    await expect(badge.locator('.app-date-badge__label')).toHaveCSS('font-weight', '800');
    await expect(badge.locator('.app-date-badge__value')).toHaveCSS('font-size', '15.68px');
    await expect(badge.locator('.app-date-badge__value')).toHaveCSS('font-weight', '700');
    expect(await badge.getAttribute('role')).toBeNull();
    expect(await badge.evaluate(element => (element as HTMLElement).tabIndex)).toBe(-1);
    await page.goto(`/iframe.html?id=ui-date-badge--with-time&viewMode=story&globals=theme:${theme}`);
    await expect(badge.locator('.app-date-badge__detail')).toHaveText('08:30');
    await expect(badge.locator('.app-date-badge__detail')).toHaveCSS('font-size', '12.8px');
    await page.goto(`/iframe.html?id=ui-date-badge--empty-detail&viewMode=story&globals=theme:${theme}`);
    await expect(badge.locator('.app-date-badge__detail')).toHaveCount(0);
    await page.goto(`/iframe.html?id=ui-date-badge--long-value&viewMode=story&globals=theme:${theme}`);
    await expect(badge.locator('.app-date-badge__value')).toContainText('Europe/Paris');
    expect(await badge.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
    await page.goto(`/iframe.html?id=screens-planningfeature--day-actions&viewMode=story&globals=theme:${theme};language:en`);
    await expect(page.getByTestId('planning-modal-actions')).toBeVisible();
    await expect(badge.locator('.planning-actions-modal__date-value')).toHaveText('2026-03-25');
    await expect(badge.locator('.app-date-badge__detail')).toHaveCount(0);
    await expect(badge).toHaveCSS('padding-top', '12.8px');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('planning-modal-actions')).toHaveCount(0);
  });

  test(`external entry markers preserve emphasis hosts and tiny badge sizing (${theme})`, async ({ page }) => {
    await page.setViewportSize({ width: theme === 'dark' ? 390 : 1440, height: 844 });
    const marker = page.locator('#storybook-root em[appStatusBadge]');
    await page.goto(`/iframe.html?id=ui-status-badge--external&viewMode=story&globals=theme:${theme}`);
    await expect(marker).toHaveText('External');
    await expect(marker).toHaveCSS('font-size', '9.92px');
    await expect(marker).toHaveCSS('font-style', 'normal');
    await expect(marker).toHaveCSS('font-weight', '850');
    await expect(marker).toHaveCSS('padding-top', '1.92px');
    await expect(marker).toHaveCSS('padding-left', '7.2px');
    await expect(marker).toHaveCSS('min-height', '18.4px');
    await expect(marker).toHaveCSS('border-top-width', '0px');
    expect(await marker.getAttribute('role')).toBeNull();
    expect(await marker.getAttribute('aria-live')).toBeNull();
    expect(await marker.evaluate(element => (element as HTMLElement).tabIndex)).toBe(-1);
    await page.goto(`/iframe.html?id=ui-status-badge--long-external&viewMode=story&globals=theme:${theme}`);
    await expect(marker).toContainText('managed inventories');
    expect(await marker.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
    await page.goto(`/iframe.html?id=screens-home--external-entry&viewMode=story&globals=theme:${theme};language:en`);
    await expect(marker).toHaveClass(/home-day-entry__badge/);
    await expect(marker).toHaveText('External');
    await expect(marker).toHaveCSS('font-weight', '850');
    await expect(marker).toHaveCSS('padding-top', '1.92px');
    await expect(page.locator('.home-day-entry').filter({ hasText: 'Restaurant meal' })).toContainText('External');
  });
}

for (const theme of ['light', 'dark']) {
  test(`calendar and cycle owners apply the extracted label variants (${theme})`, async ({ page }) => {
    await page.setViewportSize({ width: theme === 'dark' ? 390 : 1440, height: 844 });
    await page.goto(`/iframe.html?id=components-calendar--year&viewMode=story&globals=theme:${theme}`);
    const statuses = page.locator('.calendar-year-card__status');
    await expect(statuses).toHaveCount(12);
    await expect(statuses.first()).toHaveAttribute('appCalendarTag', '');
    await expect(statuses.first()).toHaveClass(/app-calendar-tag--year-status/);
    const count = page.locator('.calendar-year-chip__value').first();
    await expect(count).toBeVisible();
    await expect(count).toHaveCSS('font-size', '13.12px');
    await expect(count).toHaveCSS('font-weight', '800');
    await page.goto(`/iframe.html?id=components-listcycle--single-selection&viewMode=story&globals=theme:${theme}`);
    const metadata = page.locator('.lc-meta-chip').first();
    await expect(metadata).toHaveAttribute('appBreakdownBadge', '');
    await expect(metadata).toHaveClass(/app-breakdown-badge--expanded/);
    await expect(metadata).toHaveCSS('font-size', '14px');
    await expect(metadata).toHaveCSS('font-weight', '500');
    await page.goto(`/iframe.html?id=components-listcycle--populated&viewMode=story&globals=theme:${theme}`);
    await expect(metadata).not.toHaveClass(/app-breakdown-badge--expanded/);
    await expect(metadata).toHaveCSS('font-size', '12px');
    await expect(metadata).toHaveCSS('font-weight', '600');
  });

  test(`calendar tags preserve legacy type, density and surface palettes (${theme})`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: theme === 'dark' ? 390 : 1440, height: 844 });
    const tag = page.locator('#storybook-root span[appCalendarTag]');
    for (const [story, size, weight, block, inline] of [
      ['year-free', 10.88, '700', 5.44, 9.92],
      ['year-active', 10.88, '700', 5.44, 9.92],
      ['year-count', 10.88, '700', 5.44, 9.92],
      ['year-cycles', 10.88, '700', 5.44, 9.92],
      ['current-month', 10.88, '700', 5.44, 9.92],
      ['month-today', 10.24, '700', 3.84, 8.8],
      ['week-today', 10.56, '700', 4, 8.8],
      ['mobile-today', 10.4, '700', 3.2, 8],
      ['day-set', 11.52, '600', 6.72, 11.52],
      ['target', 11.52, '600', 6.72, 11.52],
      ['compact-chip', 10.24, '600', 5.12, 8.96],
      ['metadata', 11.52, '600', 5.76, 10.88],
      ['compact-alert', 8.64, '800', 3.52, 7.04],
      ['assignment', 11.2, '700', 5.76, 10.4],
      ['source', 11.52, '800', 6.72, 12.8],
    ] as const) {
      await page.goto(`/iframe.html?id=ui-calendar-tag--${story}&viewMode=story&globals=theme:${theme}`);
      await expect(tag).toBeVisible();
      const geometry = await tag.evaluate(element => {
        const style = getComputedStyle(element);
        return { size: parseFloat(style.fontSize), block: parseFloat(style.paddingTop), inline: parseFloat(style.paddingLeft) };
      });
      expect(geometry.size).toBeCloseTo(size, 2);
      expect(geometry.block).toBeCloseTo(block, 2);
      expect(geometry.inline).toBeCloseTo(inline, 2);
      await expect(tag).toHaveCSS('font-weight', weight);
      expect(await tag.getAttribute('role')).toBeNull();
      expect(await tag.getAttribute('aria-live')).toBeNull();
      expect(await tag.evaluate(element => (element as HTMLElement).tabIndex)).toBe(-1);
      if (story === 'year-count') {
        await expect(tag.locator('.app-calendar-tag__value')).toHaveText('0');
        await expect(tag.locator('.app-calendar-tag__label')).toHaveText('days');
        await expect(tag.locator('.app-calendar-tag__value')).toHaveCSS('font-size', '13.12px');
      }
    }
    for (const [story, background, foreground] of [
      ['surface-over', '--app-surface-soft', '--app-text-strong'],
      ['surface-projected', '--app-info-bg', '--app-info-strong-text'],
      ['surface-template', '--app-warning-bg', '--app-warning-text'],
      ['on-color-over', '--app-contrast-surface-muted', '--app-text-on-color'],
      ['on-color-projected', '--app-info-bg', '--app-text-on-color'],
      ['on-color-template', '--app-warning-border', '--app-text-on-color'],
    ]) {
      await page.goto(`/iframe.html?id=ui-calendar-tag--${story}&viewMode=story&globals=theme:${theme}`);
      await expect(tag).toBeVisible();
      expect(await tag.evaluate((element, tokens) => {
        const probe = document.createElement('span');
        probe.style.background = `var(${tokens[0]})`;
        probe.style.color = `var(${tokens[1]})`;
        element.appendChild(probe);
        const actual = getComputedStyle(element);
        const expected = getComputedStyle(probe);
        const result = { background: actual.backgroundColor === expected.backgroundColor, foreground: actual.color === expected.color };
        probe.remove();
        return result;
      }, [background, foreground])).toEqual({ background: true, foreground: true });
      await expect(tag).toHaveCSS('font-weight', '800');
      await expect(tag).toHaveCSS('text-transform', 'uppercase');
    }
    await page.goto(`/iframe.html?id=ui-calendar-tag--long-label&viewMode=story&globals=theme:${theme}`);
    await expect(tag).toContainText('selected calendar assignment');
    expect(await tag.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
  });

  test(`cycle breakdown badges preserve states and expanded selection geometry (${theme})`, async ({ page }) => {
    await page.setViewportSize({ width: theme === 'dark' ? 390 : 1440, height: 844 });
    const badge = page.locator('#storybook-root span[appBreakdownBadge]');
    for (const [story, size, weight, padding] of [
      ['metadata', '12px', '600', '4px'],
      ['expanded-metadata', '14px', '500', '4px'],
      ['under', '12px', '700', '4px'],
      ['exact', '12px', '700', '4px'],
      ['over', '12px', '700', '4px'],
      ['missing', '12px', '700', '4px'],
      ['overview-over', '12px', '600', '4px'],
      ['overview-missing', '12px', '600', '4px'],
      ['expanded-overview', '12px', '700', '8px'],
    ]) {
      await page.goto(`/iframe.html?id=ui-breakdown-badge--${story}&viewMode=story&globals=theme:${theme}`);
      await expect(badge).toBeVisible();
      await expect(badge).toHaveCSS('font-size', size);
      await expect(badge).toHaveCSS('font-weight', weight);
      await expect(badge).toHaveCSS('padding-top', padding);
      await expect(badge).toHaveCSS('padding-left', '12px');
      expect(await badge.getAttribute('role')).toBeNull();
      expect(await badge.evaluate(element => (element as HTMLElement).tabIndex)).toBe(-1);
      if (['under', 'exact', 'over', 'missing'].includes(story)) {
        await expect(badge).toHaveClass(new RegExp(`lc-status-${story}`));
        await expect(badge).toHaveCSS('min-height', '32px');
      }
      if (story === 'expanded-metadata') {
        expect(await badge.evaluate(element => {
          const probe = document.createElement('span');
          probe.style.background = 'var(--app-surface)';
          probe.style.color = 'var(--app-text-muted)';
          element.appendChild(probe);
          const actual = getComputedStyle(element);
          const expected = getComputedStyle(probe);
          const matches = actual.backgroundColor === expected.backgroundColor && actual.color === expected.color;
          probe.remove();
          return matches;
        })).toBe(true);
      }
    }
    await page.goto(`/iframe.html?id=ui-breakdown-badge--long-metadata&viewMode=story&globals=theme:${theme}`);
    await expect(badge).toContainText('cycle duration');
    expect(await badge.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
  });
}

for (const theme of ['light', 'dark']) {
  test(`summary pills preserve the shared counter geometry and wrap long labels (${theme})`, async ({ page }) => {
    await page.setViewportSize({ width: theme === 'dark' ? 390 : 1440, height: 844 });
    const pill = page.locator('#storybook-root span.app-summary-pill');
    await page.goto(`/iframe.html?id=ui-summary-pill--count&viewMode=story&globals=theme:${theme}`);
    await expect(pill).toHaveText('3 products in catalog');
    await expect(pill).toHaveCSS('font-size', '12.8px');
    await expect(pill).toHaveCSS('font-weight', '600');
    await expect(pill).toHaveCSS('padding-top', '6.4px');
    await expect(pill).toHaveCSS('padding-left', '11.2px');
    expect(await pill.getAttribute('role')).toBeNull();
    expect(await pill.evaluate(element => (element as HTMLElement).tabIndex)).toBe(-1);
    await page.goto(`/iframe.html?id=ui-summary-pill--long-label&viewMode=story&globals=theme:${theme}`);
    await expect(pill).toContainText('linked prepared meals');
    expect(await pill.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
    await page.goto(`/iframe.html?id=ui-summary-pill--rich-value&viewMode=story&globals=theme:${theme}`);
    await expect(pill.locator('strong')).toHaveText('12');
  });
}

for (const theme of ['light', 'dark']) {
  test(`business badges preserve borderless geometry and meaningful labels (${theme})`, async ({ page }) => {
    await page.setViewportSize({ width: theme === 'dark' ? 390 : 1440, height: 844 });
    const badge = page.locator('#storybook-root span.app-status-pill');
    for (const [story, text, paddingInline, paddingBlock, weight, bare] of [
      ['template-stock-available', 'Stock OK', '8px', '4px', '500', false],
      ['template-low-stock', 'Low stock', '8px', '4px', '500', false],
      ['stock-unknown', 'Unknown stock', '8px', '4px', '500', true],
      ['stocked-card', 'Stocked', '8.8px', '4px', '700', false],
      ['empty-card', 'Empty', '8.8px', '4px', '700', false],
      ['prepared-stock-ready', 'In stock', '8.8px', '4px', '700', false],
      ['prepared-stock-missing', 'Incomplete stock', '8.8px', '4px', '700', false],
      ['shopping-template', 'Template', '8.8px', '4px', '700', false],
      ['shopping-progress', 'In progress', '8.8px', '4px', '700', false],
      ['selected-count', '3 selected', '12px', '4px', '500', false],
      ['pricing-excluded', 'Excluded', '8.8px', '3.2px', '400', true],
      ['pricing-incomplete', 'Missing price', '8.8px', '3.2px', '400', false],
    ] as const) {
      await page.goto(`/iframe.html?id=ui-status-badge--${story}&viewMode=story&globals=theme:${theme}`);
      await expect(badge).toHaveText(text);
      await expect(badge).toHaveCSS('border-top-width', '0px');
      await expect(badge).toHaveCSS('font-size', '12px');
      await expect(badge).toHaveCSS('font-weight', weight);
      await expect(badge).toHaveCSS('padding-left', paddingInline);
      await expect(badge).toHaveCSS('padding-top', paddingBlock);
      if (bare) await expect(badge).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      expect(await badge.getAttribute('role')).toBeNull();
      expect(await badge.evaluate(element => (element as HTMLElement).tabIndex)).toBe(-1);
    }
    await page.goto(`/iframe.html?id=ui-status-badge--counter&viewMode=story&globals=theme:${theme}`);
    await expect(badge).toHaveCSS('font-weight', '600');
  });
}

for (const variant of [
  { theme: 'light', language: 'en', width: 1440 },
  { theme: 'dark', language: 'fr', width: 390 },
]) {
  test(`compact stock and conversion badges preserve text, sizing and static semantics (${variant.theme})`, async ({ page }) => {
    await page.setViewportSize({ width: variant.width, height: 844 });
    const globals = `theme:${variant.theme};language:${variant.language}`;
    const badge = page.locator('#storybook-root span[appStatusBadge]');
    await page.goto(`/iframe.html?id=ui-status-badge--neutral&viewMode=story&globals=${globals}`);
    const originalHeight = await badge.evaluate(element => element.getBoundingClientRect().height);
    for (const [story, text, tone, padding] of [
      ['stock-available', 'Stock OK', 'success', '4px'],
      ['low-stock', 'Low stock', 'danger', '4px'],
      ['planned', 'Planned', 'info', '4px'],
      ['converted', 'Effective from template', 'success', '2px'],
    ]) {
      await page.goto(`/iframe.html?id=ui-status-badge--${story}&viewMode=story&globals=${globals}`);
      await expect(badge).toHaveText(text);
      await expect(badge).toHaveClass(new RegExp(`app-status-pill--${tone}`));
      await expect(badge).toHaveCSS('font-size', '12px');
      await expect(badge).toHaveCSS('font-weight', '500');
      await expect(badge).toHaveCSS('padding-top', padding);
      await expect(badge).toHaveCSS('border-top-width', '1px');
      expect(await badge.evaluate(element => element.getBoundingClientRect().height)).toBeLessThan(originalHeight);
      expect(await badge.getAttribute('role')).toBeNull();
      expect(await badge.getAttribute('aria-live')).toBeNull();
      expect(await badge.evaluate(element => (element as HTMLElement).tabIndex)).toBe(-1);
    }
    await page.goto(`/iframe.html?id=ui-status-badge--long-compact-label&viewMode=story&globals=${globals}`);
    await expect(badge).toHaveCSS('font-weight', '400');
    expect(await badge.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
    expect(await page.locator('html').evaluate(element => element.scrollWidth)).toBeLessThanOrEqual(variant.width);
  });
}

test('invalid Material fields use real validators and recover after entry', async ({ page }) => {
  await page.goto('/iframe.html?id=ui-material-text-field--invalid&viewMode=story&globals=language:en');
  const input = page.getByRole('textbox', { name: 'Product' });
  // Material deliberately omits aria-invalid for an empty required native input.
  // Check the actual form validity and the accessible error association instead.
  await expect(input).toHaveClass(/ng-invalid/);
  await expect(page.locator('mat-error')).toHaveText('This field is required.');
  await expect(input).toHaveAttribute('aria-describedby', (await page.locator('mat-error').getAttribute('id'))!);
  await input.fill('Banana');
  await input.blur();
  await expect(input).toHaveAttribute('aria-invalid', 'false');
  await expect(input).toHaveClass(/ng-valid/);
  await expect(page.locator('mat-error')).not.toBeVisible();
});

test('Material selection controls remain keyboard accessible', async ({ page }) => {
  await page.goto('/iframe.html?id=ui-material-checkbox--unchecked&viewMode=story&globals=language:en');
  const checkbox = page.getByRole('checkbox', { name: 'Select product' });
  await checkbox.focus();
  await page.keyboard.press('Space');
  await expect(checkbox).toBeChecked();
  await page.goto('/iframe.html?id=ui-material-select--multiple&viewMode=story&globals=language:en');
  await page.getByRole('combobox', { name: 'Inventory' }).click();
  const freezer = page.getByRole('option', { name: 'Freezer', exact: true });
  await freezer.click();
  await expect(freezer).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('combobox', { name: 'Inventory' })).toContainText('Freezer');
});

test('Material date picker updates the bound date and disabled inputs cannot open it', async ({ page }) => {
  await page.goto('/iframe.html?id=ui-material-date-picker--selected&viewMode=story&globals=language:en');
  const original = await page.getByRole('textbox', { name: 'Date' }).inputValue();
  await page.getByRole('button', { name: 'Open calendar' }).click();
  await page.locator('mat-calendar').getByText('26', { exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Date' })).not.toHaveValue(original);
  await expect(page.locator('mat-calendar')).toHaveCount(0);
  await page.goto('/iframe.html?id=ui-material-date-picker--disabled&viewMode=story&globals=language:en');
  await expect(page.getByRole('textbox', { name: 'Date' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Open calendar' })).toBeDisabled();
});

test('tabs, progress and data tables expose their actual Material states', async ({ page }) => {
  await page.goto('/iframe.html?id=ui-material-tabs--interactive&viewMode=story');
  await page.getByRole('tab', { name: 'JSON', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('JSON product entry');
  await page.goto('/iframe.html?id=ui-material-progress--determinate&viewMode=story');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');
  await page.goto('/iframe.html?id=ui-material-data-table--populated&viewMode=story');
  await expect(page.getByRole('table', { name: 'Inventory products' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Quantity' })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Select Banana', exact: true }).check();
  await expect(page.getByRole('checkbox', { name: 'Select Banana', exact: true })).toBeChecked();
});

test('feedback stories preserve native disclosure and code focus behavior', async ({ page }) => {
  await page.goto('/iframe.html?id=ui-alert--with-details&viewMode=story');
  await expect(page.getByRole('alert')).toContainText('The request failed.');
  const summary = page.locator('summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('details')).toHaveAttribute('open', '');
  await expect(page.locator('pre[appCodePanel]')).toBeVisible();
  await page.locator('pre[appCodePanel]').focus();
  await expect(page.locator('pre[appCodePanel]')).toBeFocused();
});

test('native table density, headers and editable cells use the real shared components', async ({ page }) => {
  await page.goto('/iframe.html?id=ui-native-table--standard&viewMode=story');
  const quantity = page.getByRole('cell', { name: '400 g', exact: true });
  await expect(page.getByRole('table', { name: 'Current stock' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Quantity' })).toHaveCSS('text-align', 'end');
  await expect(page.getByRole('rowheader', { name: 'Banana' })).toHaveAttribute('scope', 'row');
  const standardPadding = await quantity.evaluate(element => parseFloat(getComputedStyle(element).paddingTop));
  await page.goto('/iframe.html?id=ui-native-table--compact&viewMode=story');
  await expect(quantity).toBeVisible();
  expect(await quantity.evaluate(element => parseFloat(getComputedStyle(element).paddingTop))).toBeLessThan(standardPadding);
  await page.goto('/iframe.html?id=ui-native-table--editable&viewMode=story');
  const input = page.getByRole('spinbutton', { name: 'Quantity' });
  await input.fill('12');
  await input.press('Tab');
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('12');
});

test('table viewports scroll using the keyboard and empty-state actions stay reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/iframe.html?id=ui-table-viewport--outlined&viewMode=story');
  const viewport = page.getByRole('region', { name: 'Inventory products', exact: true });
  await viewport.focus();
  await expect(viewport).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => viewport.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  await page.goto('/iframe.html?id=ui-native-table--empty&viewMode=story');
  await expect(page.getByRole('cell', { name: 'No products available.' })).toHaveAttribute('colspan', '2');
  await page.goto('/iframe.html?id=ui-empty-state--with-action&viewMode=story');
  const action = page.getByRole('button', { name: 'Create inventory', exact: true });
  await action.focus();
  await page.keyboard.press('Enter');
  await expect(action).toBeFocused();
  await expect(page.locator('div[appEmptyState]')).not.toHaveAttribute('role', 'alert');
});

test('shared icons distinguish decorative button glyphs from named images', async ({ page }) => {
  await page.goto('/iframe.html?id=ui-icon--named&viewMode=story');
  await expect(page.getByRole('img', { name: 'Calendar day' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Calendar day' }).locator('svg')).toHaveAttribute('aria-hidden', 'true');
  await page.goto('/iframe.html?id=ui-icon--button&viewMode=story');
  await expect(page.getByRole('img')).toHaveCount(0);
  const button = page.getByRole('button', { name: 'Edit entry', exact: true });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(button).toBeFocused();
  await expect(button.locator('app-icon')).toHaveAttribute('aria-hidden', 'true');
});

test('shared disclosures retain keyboard expansion, hidden content and projected actions', async ({ page }) => {
  await page.goto('/iframe.html?id=ui-disclosure--diagnostic&viewMode=story');
  const details = page.locator('details[appDisclosure]');
  const summary = page.locator('summary[appDisclosureSummary]');
  const code = page.locator('pre[appCodePanel]');
  await expect(code).not.toBeVisible();
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open', '');
  await expect(code).toBeVisible();
  await page.keyboard.press('Space');
  await expect(details).not.toHaveAttribute('open', '');
  await expect(code).not.toBeVisible();
  await expect(summary).toBeFocused();
  await page.goto('/iframe.html?id=ui-disclosure--with-action&viewMode=story');
  await page.locator('summary').focus();
  // The projected code panel is itself a keyboard scroll target.
  await page.keyboard.press('Tab');
  await expect(page.locator('pre[appCodePanel]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Use this example', exact: true })).toBeFocused();
});
