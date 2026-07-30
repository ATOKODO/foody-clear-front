import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject<Document>(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  private readonly storageKey = 'theme';
  private readonly preferredColorScheme = this.getPreferredColorScheme();
  private readonly modeState = signal<ThemeMode>('light');
  private followsSystemPreference = false;

  readonly modeSignal = this.modeState.asReadonly();
  readonly mode$: Observable<ThemeMode> = toObservable(this.modeSignal);

  constructor() {
    const initialMode = this.getInitialMode();
    this.modeState.set(initialMode);
    this.applyMode(initialMode, false);
    this.watchSystemPreference();
  }

  get mode(): ThemeMode {
    return this.modeState();
  }

  setMode(mode: ThemeMode, persist = true): void {
    if (persist) {
      this.followsSystemPreference = false;
    }

    this.modeState.set(mode);
    this.applyMode(mode, persist);
  }

  private getInitialMode(): ThemeMode {
    const stored = this.safeStorageGet(this.storageKey);
    if (stored === 'dark' || stored === 'light') {
      this.followsSystemPreference = false;
      return stored;
    }

    this.followsSystemPreference = true;
    return this.prefersDark() ? 'dark' : 'light';
  }

  private applyMode(mode: ThemeMode, persist: boolean): void {
    const root = this.document.documentElement;
    root.classList.toggle('dark', mode === 'dark');

    if (persist) {
      this.safeStorageSet(this.storageKey, mode);
    }
  }

  clearSavedMode(): void {
    this.safeStorageRemove(this.storageKey);
    this.followsSystemPreference = true;
    const fallbackMode = this.prefersDark() ? 'dark' : 'light';
    this.setMode(fallbackMode, false);
  }

  private prefersDark(): boolean {
    return this.preferredColorScheme?.matches ?? false;
  }

  toggle(): void {
    this.setMode(this.isDark() ? 'light' : 'dark');
  }

  isDark(): boolean {
    return this.modeState() === 'dark';
  }

  private getPreferredColorScheme(): MediaQueryList | null {
    if (
      globalThis.window === undefined ||
      typeof globalThis.window.matchMedia !== 'function'
    ) {
      return null;
    }

    return globalThis.window.matchMedia('(prefers-color-scheme: dark)');
  }

  private watchSystemPreference(): void {
    const preferredColorScheme = this.preferredColorScheme;
    if (!preferredColorScheme) {
      return;
    }

    const onChange = (event: MediaQueryListEvent): void => {
      if (!this.followsSystemPreference) {
        return;
      }

      this.setMode(event.matches ? 'dark' : 'light', false);
    };

    preferredColorScheme.addEventListener('change', onChange);
    this.destroyRef.onDestroy(() => {
      preferredColorScheme.removeEventListener('change', onChange);
    });
  }

  // LocalStorage Manipulation
  private safeStorageGet(key: string): string | null {
    try {
      if (globalThis.window === undefined) {
        return null;
      }
      return globalThis.window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private safeStorageSet(key: string, value: string): void {
    try {
      if (globalThis.window === undefined) {
        return;
      }
      globalThis.window.localStorage.setItem(key, value);
    } catch {
      // Ignore storage errors (private mode, disabled, etc.).
    }
  }

  private safeStorageRemove(key: string): void {
    try {
      if (globalThis.window === undefined) {
        return;
      }
      globalThis.window.localStorage.removeItem(key);
    } catch {
      // Ignore storage errors.
    }
  }
}
