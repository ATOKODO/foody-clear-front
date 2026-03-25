import type { MockApiRequestContext } from '../shared';
import { buildProductPriceHistory, buildStatisticsTimeline } from '../shared';

export async function handleAnalyticsRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path, request, url, state } = context;
  const method = request.method();

  if (method === 'GET' && path === '/statistics/timeline') {
    const fromDateLocal = String(url.searchParams.get('from') ?? '').trim();
    const toDateLocal = String(url.searchParams.get('to') ?? '').trim();
    const timezone = String(url.searchParams.get('timezone') ?? state.timezone).trim() || state.timezone;
    await context.json(buildStatisticsTimeline(state, fromDateLocal, toDateLocal, timezone));
    return true;
  }

  if (method === 'GET' && path.startsWith('/statistics/product-price-history/')) {
    const productId = Number(path.split('/')[3]);
    const fromDateLocal = String(url.searchParams.get('from') ?? '').trim();
    const toDateLocal = String(url.searchParams.get('to') ?? '').trim();
    const timezone = String(url.searchParams.get('timezone') ?? state.timezone).trim() || state.timezone;
    const response = buildProductPriceHistory(state, productId, fromDateLocal, toDateLocal, timezone);
    if (!response) {
      await context.notFound('Product not found');
      return true;
    }

    await context.json(response);
    return true;
  }

  return false;
}
