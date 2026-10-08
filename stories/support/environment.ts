import { InjectionToken, inject, provideAppInitializer, signal, type Provider, type EnvironmentProviders } from '@angular/core';
import { HttpErrorResponse, HttpResponse, provideHttpClient, withInterceptors, type HttpInterceptorFn } from '@angular/common/http';
import { provideLocationMocks } from '@angular/common/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withDisabledInitialNavigation } from '@angular/router';
import { defer, NEVER, of } from 'rxjs';
import type { StoryContext } from '@storybook/angular-vite';
import { Language } from '../../src/app/i18n/language';
import { ThemeService } from '../../src/services/theme-service';
import { PwaService } from '../../src/services/pwa-service';
import { OpenFoodFactsService } from '../../src/services/open-food-facts-service';
import { demoFoodFactsProduct } from './food-facts';
import { routes } from '../../src/app/app.routes';
import { createMockApiState, type MockApiState } from '../../tests/mocks/state';
import type { MockApiRequestContext } from '../../tests/mocks/shared';
import { handleCatalogRequest } from '../../tests/mocks/handlers/catalog';
import { handlePlanningRequest } from '../../tests/mocks/handlers/planning';
import { handleExecutionRequest } from '../../tests/mocks/handlers/execution';
import { handleAnalyticsRequest } from '../../tests/mocks/handlers/analytics';
import { createSupplementaryState, handleSupplementaryRequest, type SupplementaryState } from './supplementary-api';
import type { ExternalMealEntrySummary } from '../../src/interfaces/input-day.interface';

type Scenario = 'populated' | 'empty' | 'loading' | 'error';
const STORY_STATE = new InjectionToken<{ state: MockApiState; extra: SupplementaryState; scenario: Scenario }>('Isolated Storybook API');

// Reuse the contract exercised by E2E tests. Never pass requests to a real HTTP backend.
const storyApi: HttpInterceptorFn = (request) => {
  const { state, extra, scenario } = inject(STORY_STATE);
  if (scenario === 'loading') return NEVER;
  return defer(async () => {
    if (scenario === 'error') throw new HttpErrorResponse({ status: 503, error: { message: 'Demo API unavailable' }, url: request.url });
    const url = new URL(request.urlWithParams, 'http://storybook.invalid');
    const path = url.pathname.replace(/^\/api(?=\/)/, '');
    let body: unknown;
    let status = 200;
    const context: MockApiRequestContext = {
      url, path, state,
      request: { method: () => request.method },
      nextId: (key) => state.nextIds[key]++,
      readJson: async <T>() => structuredClone(request.body ?? {}) as T,
      json: async (value, code = 200) => { body = structuredClone(value); status = code; },
      noContent: async (code = 204) => { body = null; status = code; },
      notFound: async (message = 'Not found') => { body = { message }; status = 404; },
    };
    const handled = await handleSupplementaryRequest(context, extra) || await handleCatalogRequest(context) || await handlePlanningRequest(context) ||
      await handleExecutionRequest(context) || await handleAnalyticsRequest(context);
    if (!handled) throw new HttpErrorResponse({ status: 501, error: { message: `Unmocked Storybook request: ${request.method} ${path}` }, url: request.url });
    if (status >= 400) throw new HttpErrorResponse({ status, error: body, url: request.url });
    const date = path.match(/^\/input-days\/([\d-]+)$/)?.[1];
    if (date && body && typeof body === 'object') Object.assign(body, { externalEntries: extra.externalEntries.get(date) ?? [] });
    return new HttpResponse({ status, body, url: request.url });
  });
};

function scenarioState(scenario: Scenario): MockApiState {
  const state = createMockApiState();
  if (scenario === 'empty') {
    for (const key of Object.keys(state) as (keyof MockApiState)[]) {
      if (Array.isArray(state[key]) && key !== 'quantityUnits' && key !== 'nutritionKeys') {
        Object.assign(state, { [key]: [] });
      }
    }
  }
  return state;
}

export function provideStoryEnvironment(context: StoryContext): (Provider | EnvironmentProviders)[] {
  const scenario: Scenario = context.parameters['apiScenario'] ?? 'populated';
  return [
    { provide: STORY_STATE, useFactory: () => {
      const state = scenarioState(scenario);
      const extra = createSupplementaryState(state, scenario === 'empty');
      const externalEntries = context.parameters['apiExternalEntries'] as Record<string, ExternalMealEntrySummary[]> | undefined;
      for (const [date, entries] of Object.entries(externalEntries ?? {})) extra.externalEntries.set(date, structuredClone(entries));
      return { state, extra, scenario };
    } },
    provideHttpClient(withInterceptors([storyApi])),
    provideNoopAnimations(),
    provideRouter(routes, withDisabledInitialNavigation()),
    provideLocationMocks(),
    { provide: OpenFoodFactsService, useValue: { lookup: (barcode: string) => of({ ...structuredClone(demoFoodFactsProduct), barcode }) } },
    { provide: PwaService, useFactory: () => ({
      installed: signal(false), installAvailable: signal(false), installing: signal(false),
      online: signal(true), updateAvailable: signal(false), install: async () => false, reload: () => undefined,
    }) },
    provideAppInitializer(() => {
      inject(Language).set(context.globals['language'] === 'fr' ? 'fr' : 'en');
      inject(ThemeService).setMode(context.globals['theme'] === 'dark' ? 'dark' : 'light', false);
    }),
  ];
}
