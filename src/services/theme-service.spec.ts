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

describe('ThemeService', () => {
  beforeEach(() => {
    window.localStorage.removeItem('theme');
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    window.localStorage.removeItem('theme');
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  });

  it('should restore the saved theme on init', () => {
    window.localStorage.setItem('theme', 'dark');
    spyOn(window, 'matchMedia').and.callFake(createMatchMedia(false));

    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    const documentRef = TestBed.inject(DOCUMENT);

    expect(service.mode).toBe('dark');
    expect(documentRef.documentElement.classList.contains('dark')).toBeTrue();
    expect(documentRef.documentElement.style.colorScheme).toBe('dark');
  });

  it('should toggle the theme and persist the new mode', () => {
    spyOn(window, 'matchMedia').and.callFake(createMatchMedia(false));

    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    const documentRef = TestBed.inject(DOCUMENT);

    service.toggle();
    expect(service.mode).toBe('dark');
    expect(window.localStorage.getItem('theme')).toBe('dark');
    expect(documentRef.documentElement.classList.contains('dark')).toBeTrue();

    service.toggle();
    expect(service.mode).toBe('light');
    expect(window.localStorage.getItem('theme')).toBe('light');
    expect(documentRef.documentElement.classList.contains('dark')).toBeFalse();
  });

  it('should fall back to the system preference when clearing the saved mode', () => {
    window.localStorage.setItem('theme', 'light');
    spyOn(window, 'matchMedia').and.callFake(createMatchMedia(true));

    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);

    service.clearSavedMode();

    expect(window.localStorage.getItem('theme')).toBeNull();
    expect(service.mode).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBeTrue();
  });
});
