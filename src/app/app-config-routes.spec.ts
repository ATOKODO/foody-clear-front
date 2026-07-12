import { appConfig } from './app.config';
import { routes } from './app.routes';
import { environment as productionEnvironment } from '../environments/environment.production';

describe('application configuration', () => {
  it('exposes the router and HTTP providers', () => {
    expect(appConfig.providers?.length).toBeGreaterThan(0);
    expect(routes.length).toBeGreaterThan(10);
    expect(routes[0]).toEqual({ path: '', pathMatch: 'full', redirectTo: 'home' });
    expect(routes.map((route) => route.path)).toContain('meal-prep');
    expect(routes.map((route) => route.path)).toContain('calendar');
  });

  it('contains the production environment values', () => {
    expect(productionEnvironment).toEqual({
      production: true,
      apiBaseUrl: '/api',
    });
  });

  it('resolves every lazy route component', async () => {
    const lazyRoutes = routes.filter((route) => route.loadComponent);
    expect(lazyRoutes.length).toBe(routes.length - 1);
    for (const route of lazyRoutes) {
      expect(await route.loadComponent?.()).toBeTruthy();
    }
  });
});
