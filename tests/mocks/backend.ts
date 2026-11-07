import type { Page } from '@playwright/test';
import { handleAnalyticsRequest } from './handlers/analytics';
import { handleCatalogRequest } from './handlers/catalog';
import { handleExecutionRequest } from './handlers/execution';
import { handlePlanningRequest } from './handlers/planning';
import { cloneMockApiState, createMockApiState, type MockApiState } from './state';
import { createSupplementaryState, handleSupplementaryRequest, type SupplementaryState } from './supplementary';
import {
  fulfillJson,
  fulfillNoContent,
  type IdKey,
  type MockApiRequestContext,
} from './shared';

export class MockApi {
  state: MockApiState;
  supplementary: SupplementaryState;

  constructor(initialState?: Partial<MockApiState>) {
    this.state = cloneMockApiState({ ...createMockApiState(), ...initialState });
    this.supplementary = createSupplementaryState(this.state, this.state.products.length === 0);
  }

  reset(overrides?: Partial<MockApiState>): void {
    this.state = cloneMockApiState({ ...createMockApiState(), ...overrides });
    this.supplementary = createSupplementaryState(this.state, this.state.products.length === 0);
  }

  applyState(overrides: Partial<MockApiState>): void {
    Object.entries(structuredClone(overrides)).forEach(([key, value]) => {
      (this.state as Record<string, unknown>)[key] = value as unknown;
    });
    this.supplementary = createSupplementaryState(this.state, this.state.products.length === 0);
  }

  async install(page: Page): Promise<void> {
    await page.route('http://localhost:3000/**', async (route, request) => {
      const url = new URL(request.url());
      const path = url.pathname;
      const context: MockApiRequestContext = {
        route,
        request,
        url,
        path,
        state: this.state,
        nextId: (key: IdKey) => {
          const currentValue = this.state.nextIds[key];
          this.state.nextIds[key] += 1;
          return currentValue;
        },
        readJson: async <T>() => {
          const payload = request.postData() ?? '{}';
          return JSON.parse(payload) as T;
        },
        json: async (body: unknown, status = 200) => {
          const date = path.match(/^\/input-days\/([\d-]+)$/)?.[1];
          if (date && body && typeof body === 'object') {
            Object.assign(body, { externalEntries: this.supplementary.externalEntries.get(date) ?? [] });
          }
          await fulfillJson(route, body, status);
        },
        noContent: async (status = 204) => {
          await fulfillNoContent(route, status);
        },
        notFound: async (message = 'Not found') => {
          await fulfillJson(route, { message }, 404);
        },
      };

      const handled =
        (await handleSupplementaryRequest(context, this.supplementary)) ||
        (await handleCatalogRequest(context)) ||
        (await handlePlanningRequest(context)) ||
        (await handleExecutionRequest(context)) ||
        (await handleAnalyticsRequest(context));

      if (handled) {
        return;
      }

      await fulfillJson(
        route,
        {
          message: `Unhandled mock route: ${request.method()} ${path}`,
        },
        501,
      );
    });
  }
}
