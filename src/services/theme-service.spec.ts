import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme-service';

function createMatchMedia(matches: boolean): (query: string) => MediaQueryList {
  return (query: string) =>
    ({
      matches,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

function createControlledMatchMedia(initialMatches: boolean): {
  matchMedia: (query: string) => MediaQueryList;
  emit: (matches: boolean) => void;
} {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mediaQuery = {
    get matches() {
      return matches;
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: (
      _type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => listeners.add(listener),
    removeEventListener: (
      _type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => listeners.delete(listener),
    dispatchEvent: () => false,
  } as unknown as MediaQueryList;

  return {
    matchMedia: () => mediaQuery,
    emit: (nextMatches: boolean) => {
      matches = nextMatches;
      const event = {
        matches: nextMatches,
        media: mediaQuery.media,
      } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}

describe('ThemeService', () => {
  beforeEach(() => {
    globalThis.localStorage.removeItem('theme');
    document.documentElement.classList.remove('dark');
    document.documentElement.style.removeProperty('color-scheme');
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    globalThis.localStorage.removeItem('theme');
    document.documentElement.classList.remove('dark');
    document.documentElement.style.removeProperty('color-scheme');
  });

  it('should restore the saved theme on init', () => {
    globalThis.localStorage.setItem('theme', 'dark');
    spyOn(globalThis, 'matchMedia').and.callFake(createMatchMedia(false));

    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    const documentRef = TestBed.inject(DOCUMENT);

    expect(service.mode).toBe('dark');
    expect(service.modeSignal()).toBe('dark');
    expect(documentRef.documentElement.classList.contains('dark')).toBeTrue();
  });

  it('should toggle the theme and persist the new mode', () => {
    spyOn(globalThis, 'matchMedia').and.callFake(createMatchMedia(false));

    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    const documentRef = TestBed.inject(DOCUMENT);

    service.toggle();
    expect(service.mode).toBe('dark');
    expect(globalThis.localStorage.getItem('theme')).toBe('dark');
    expect(documentRef.documentElement.classList.contains('dark')).toBeTrue();

    service.toggle();
    expect(service.mode).toBe('light');
    expect(globalThis.localStorage.getItem('theme')).toBe('light');
    expect(documentRef.documentElement.classList.contains('dark')).toBeFalse();
  });

  it('should fall back to the system preference when clearing the saved mode', () => {
    globalThis.localStorage.setItem('theme', 'light');
    spyOn(globalThis, 'matchMedia').and.callFake(createMatchMedia(true));

    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);

    service.clearSavedMode();

    expect(globalThis.localStorage.getItem('theme')).toBeNull();
    expect(service.mode).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBeTrue();
  });

  it('should follow system changes when no explicit mode is saved', () => {
    const controlledMatchMedia = createControlledMatchMedia(false);
    spyOn(globalThis, 'matchMedia').and.callFake(controlledMatchMedia.matchMedia);

    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);

    expect(service.modeSignal()).toBe('light');

    controlledMatchMedia.emit(true);

    expect(service.modeSignal()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBeTrue();
  });
});
