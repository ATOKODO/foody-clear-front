import { expect, type Page } from '@playwright/test';

/** Check the rendered control, including ancestors that could hide an overflow. */
export async function expectProductSearchContained(page: Page): Promise<void> {
  for (const field of await page.locator('.product-list__search-field:visible').all()) {
    const geometry = await field.evaluate(element => {
      const bounds = element.getBoundingClientRect();
      const input = element.querySelector('input')!.getBoundingClientRect();
      const label = element.querySelector('label')?.getBoundingClientRect();
      let left = 0;
      let right = window.innerWidth;
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        if (!['auto', 'scroll', 'hidden', 'clip'].includes(style.overflowX)) continue;
        const rect = parent.getBoundingClientRect();
        left = Math.max(left, rect.left + parseFloat(style.borderLeftWidth));
        right = Math.min(right, rect.right - parseFloat(style.borderRightWidth));
      }
      return {
        field: { left: bounds.left, right: bounds.right, width: bounds.width },
        input: { left: input.left, right: input.right, width: input.width },
        label: label ? { left: label.left, right: label.right } : null,
        clip: { left, right },
        overflow: element.scrollWidth - element.clientWidth,
      };
    });
    const context = `Search control must stay inside its visible container: ${JSON.stringify(geometry)}`;
    expect(geometry.field.left, context).toBeGreaterThanOrEqual(geometry.clip.left - 1);
    expect(geometry.field.right, context).toBeLessThanOrEqual(geometry.clip.right + 1);
    expect(geometry.input.width, context).toBeGreaterThan(0);
    expect(geometry.input.left, context).toBeGreaterThanOrEqual(geometry.field.left);
    expect(geometry.input.right, context).toBeLessThanOrEqual(geometry.field.right + 1);
    expect(geometry.overflow, context).toBeLessThanOrEqual(1);
    if (geometry.label) {
      expect(geometry.label.left, context).toBeGreaterThanOrEqual(geometry.field.left - 1);
      expect(geometry.label.right, context).toBeLessThanOrEqual(geometry.field.right + 1);
    }
  }
}
