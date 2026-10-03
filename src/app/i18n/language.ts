import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { resolveCatalogMessage } from './translation-catalog';

export type AppLanguage = 'en' | 'fr';
export type TranslationParameters = Readonly<Record<string, unknown>>;
export const LANGUAGE_STORAGE_KEY = 'foody-clear-language';

@Injectable({ providedIn: 'root' })
export class Language {
  private readonly document = inject(DOCUMENT);
  private readonly selected = signal<AppLanguage>(this.initialLanguage());
  readonly current = this.selected.asReadonly();
  readonly locale = computed(() => this.current() === 'fr' ? 'fr-FR' : 'en-GB');
  private readonly numberFormats = new Map<string, Intl.NumberFormat>();

  constructor() {
    effect(() => {
      this.document.documentElement.lang = this.current();
    });
  }

  set(language: AppLanguage): void {
    this.selected.set(language);
    try {
      this.document.defaultView?.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // The language switch also works when browser storage is unavailable.
    }
  }

  formatNumber(value: number, maximumFractionDigits = 2): string {
    const key = `${this.locale()}:${maximumFractionDigits}`;
    let formatter = this.numberFormats.get(key);
    if (!formatter) {
      formatter = new Intl.NumberFormat(this.locale(), { maximumFractionDigits });
      this.numberFormats.set(key, formatter);
    }
    return formatter.format(value);
  }

  hasTranslation(source: string): boolean {
    return source.split('\n').every((line) => resolveCatalogMessage(line) !== null);
  }

  translate(source: string | null | undefined, parameters: TranslationParameters = {}): string {
    if (source == null) return '';
    if (source.includes('\n')) {
      return source.split('\n').map((line) => this.translate(line, parameters)).join('\n');
    }
    const resolved = resolveCatalogMessage(source);
    const entry = resolved?.entry;
    const message: string = Array.isArray(entry)
      ? entry[this.current() === 'en' ? 0 : 1]
      : this.current() === 'fr' && typeof entry === 'string' ? entry : resolved?.source ?? source;
    const values = { ...resolved?.parameters, ...parameters };
    // The unit caption's parameter is an API enum, not a user-owned name.
    if (resolved?.source === 'Product unit ({p0})' && typeof values['p0'] === 'string' &&
        ['Paquet', 'Bouteille', 'Boite', 'Sachet', 'Canette', 'Bocal', 'Unite', 'Autre'].includes(values['p0'])) {
      values['p0'] = this.translate(values['p0']);
    }
    return message.replace(/\{([a-zA-Z]\w*)\}/g, (placeholder, key: string) =>
      Object.hasOwn(values, key) ? String(values[key] ?? '') : placeholder,
    );
  }

  private initialLanguage(): AppLanguage {
    const window = this.document.defaultView;
    try {
      const stored = window?.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === 'en' || stored === 'fr') return stored;
    } catch {
      // Private mode may prevent access to localStorage.
    }
    return window?.navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
  }
}
