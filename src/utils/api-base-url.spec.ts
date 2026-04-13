import { defaultApiBaseUrl, normalizeApiBaseUrl } from './api-base-url';

describe('api base url config', () => {
  it('uses the development api base url by default in tests', () => {
    expect(defaultApiBaseUrl).toBe('http://localhost:3000');
  });

  it('normalizes trailing slashes', () => {
    expect(normalizeApiBaseUrl('http://localhost:3000/')).toBe('http://localhost:3000');
    expect(normalizeApiBaseUrl('/api/')).toBe('/api');
  });
});
