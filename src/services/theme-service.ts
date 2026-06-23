import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private document = inject<Document>(DOCUMENT);

  private readonly storageKey = 'theme';
  private readonly modeSubject = new BehaviorSubject<ThemeMode>('light');

  readonly mode$: Observable<ThemeMode> = this.modeSubject.asObservable();

  constructor() {
    const initialMode = this.getInitialMode();
    this.modeSubject.next(initialMode);
    this.applyMode(initialMode, false);
  }

  get mode(): ThemeMode {
    return this.modeSubject.value;
  }

  setMode(mode: ThemeMode, persist = true): void {
    if (mode === this.modeSubject.value) {
      return;
    }

    this.modeSubject.next(mode);
    this.applyMode(mode, persist);
  }

  private getInitialMode(): ThemeMode {
    const stored = this.safeStorageGet(this.storageKey);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }

    return this.prefersDark() ? 'dark' : 'light';
  }

  private applyMode(mode: ThemeMode, persist: boolean): void {
    const root = this.document.documentElement;
    root.classList.toggle('dark', mode === 'dark');
    root.style.colorScheme = mode;

    if (persist) {
      this.safeStorageSet(this.storageKey, mode);
    }
  }

  clearSavedMode(): void {
    this.safeStorageRemove(this.storageKey);
    const fallbackMode = this.prefersDark() ? 'dark' : 'light';
    this.setMode(fallbackMode, false);
  }

  private prefersDark(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  }

  toggle(): void {
    this.setMode(this.isDark() ? 'light' : 'dark');
  }

  isDark(): boolean {
    return this.modeSubject.value === 'dark';
  }

  // LocalStorage Manipulation
  private safeStorageGet(key: string): string | null {
    try {
      if (typeof window === 'undefined') {
        return null;
      }
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private safeStorageSet(key: string, value: string): void {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      window.localStorage.setItem(key, value);
    } catch {
      // Ignore storage errors (private mode, disabled, etc.).
    }
  }

  private safeStorageRemove(key: string): void {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage errors.
    }
  }
}
