import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export async function gotoRoute(page: Page, route: string): Promise<void> {
  await page.goto(route);
  await expect(page.locator('main')).toBeVisible();
}

export async function expectShellTitle(page: Page, title: string): Promise<void> {
  await expect(page.locator('.app-shell__header-title')).toHaveText(title);
}

export async function openSidebarRoute(page: Page, routeLabel: string): Promise<void> {
  await page
    .getByLabel('Main navigation')
    .getByRole('link', { name: new RegExp(routeLabel, 'i') })
    .first()
    .click();
}
