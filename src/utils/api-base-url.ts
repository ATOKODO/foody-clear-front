import { environment } from '../environments/environment';

export function normalizeApiBaseUrl(url: string): string {
  return url.replace(/\/$/, '');
}

export const defaultApiBaseUrl = normalizeApiBaseUrl(environment.apiBaseUrl);
