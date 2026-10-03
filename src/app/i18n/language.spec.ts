import { DOCUMENT } from '@angular/common';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LANGUAGE_STORAGE_KEY, Language } from './language';
import { TranslatePipe } from './translate-pipe';

@Component({
  imports: [TranslatePipe],
  template: `<p>{{ 'Home' | translate }}</p><span>{{ name }}</span>`,
})
class TranslationHost {
  name = 'Home';
}

describe('Language', () => {
  let saved: string | null;
  let previousLang: string;

  beforeEach(() => {
    saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    previousLang = document.documentElement.lang;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
    TestBed.configureTestingModule({ imports: [TranslationHost], providers: [provideZonelessChangeDetection()] });
  });

  afterEach(() => {
    if (saved === null) localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    else localStorage.setItem(LANGUAGE_STORAGE_KEY, saved);
    document.documentElement.lang = previousLang;
  });

  it('switches live, persists the choice and leaves user data unchanged', async () => {
    const fixture = TestBed.createComponent(TranslationHost);
    const language = TestBed.inject(Language);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('p').textContent).toBe('Home');

    language.set('fr');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('p').textContent).toBe('Accueil');
    expect(fixture.nativeElement.querySelector('span').textContent).toBe('Home');
    expect(document.documentElement.lang).toBe('fr');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr');

    language.set('en');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('p').textContent).toBe('Home');
    expect(document.documentElement.lang).toBe('en');
  });

  it('restores a saved preference before the first render', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr');
    expect(TestBed.inject(Language).current()).toBe('fr');
  });

  it('uses the browser language if the saved value is unsupported', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'es');
    spyOnProperty(navigator, 'language', 'get').and.returnValue('fr-CA');
    expect(TestBed.inject(Language).current()).toBe('fr');
  });

  it('works when storage access is denied', () => {
    const document = TestBed.inject(DOCUMENT);
    spyOn(document.defaultView!.localStorage, 'getItem').and.throwError('denied');
    spyOn(document.defaultView!.localStorage, 'setItem').and.throwError('denied');
    const language = TestBed.inject(Language);
    expect(() => language.set('fr')).not.toThrow();
    expect(language.translate('Home')).toBe('Accueil');
  });

  it('normalizes legacy sources in English and handles empty content', () => {
    const language = TestBed.inject(Language);
    expect(language.translate('Installer l’app')).toBe('Install app');
    expect(language.translate(null)).toBe('');
    expect(language.translate(undefined)).toBe('');
  });

  it('substitutes named values without translating their content', () => {
    const language = TestBed.inject(Language);
    language.set('fr');
    expect(language.translate('Product #{p0}', { p0: 42 })).toBe('Produit n°42');
    expect(language.translate('Template: {p0}', { p0: 'Home' })).toBe('Modèle : Home');
    expect(language.translate('Template: {p0}', { p0: '<script>' })).toBe('Modèle : <script>');
    expect(language.translate('Template: {p0}', { p0: 'Paquet' })).toBe('Modèle : Paquet');
    language.set('en');
    expect(language.translate('Product unit (Paquet)')).toBe('Product unit (Package)');
    language.set('fr');
    expect(language.translate('Product unit (Paquet)')).toBe('Unité du produit (Paquet)');
  });

  it('translates generated messages without modifying captured user values', () => {
    const language = TestBed.inject(Language);
    language.set('fr');
    expect(language.translate('Product #42')).toBe('Produit n°42');
    expect(language.translate('Template: Home  <script>')).toBe('Modèle : Home  <script>');
    expect(language.translate('Product #42\nProduct #43')).toBe('Produit n°42\nProduit n°43');
    expect(language.translate('User-owned  unknown name')).toBe('User-owned  unknown name');
    expect(language.translate('toString')).toBe('toString');
    expect(language.hasTranslation('constructor')).toBe(false);
    language.set('en');
    expect(language.translate('Produit n°42')).toBe('Product #42');
    expect(language.translate('Modèle : Home  <script>')).toBe('Template: Home  <script>');
  });

  it('formats numbers and contextual labels in the selected language', () => {
    const language = TestBed.inject(Language);
    expect(language.formatNumber(1234.5)).toBe('1,234.5');
    expect(language.translate('payment.free')).toBe('Free');
    expect(language.translate('calendar.free')).toBe('Free');
    language.set('fr');
    expect(language.formatNumber(1234.5)).toBe('1\u202f234,5');
    expect(language.translate('payment.free')).toBe('Gratuit');
    expect(language.translate('calendar.free')).toBe('Libre');
  });
});
