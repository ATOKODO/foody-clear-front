import { UiIcon } from './ui/icon/icon';
import { UiAlert } from './ui/alert/alert';
import { UiButton } from './ui/button/button';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, inject } from '@angular/core';
import {
  NavigationEnd,
  Params,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { DateTime } from 'luxon';
import { filter } from 'rxjs';
import {
  APP_NAVIGATION,
  APP_SIDEBAR_NAVIGATION,
  AppNavigationEntry,
  findNavigationContextByUrl,
} from './app.navigation';
import { ThemeMode, ThemeService } from '../services/theme-service';
import { PwaControls } from './ui/pwa-controls/pwa-controls';
import { PwaService } from '../services/pwa-service';
import { Language } from './i18n/language';
import { TranslatePipe } from './i18n/translate-pipe';

@Component({
  selector: 'app-root',
  imports: [UiIcon, UiAlert, UiButton, RouterLink, RouterLinkActive, RouterOutlet, PwaControls, TranslatePipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: {
    '(document:keydown.escape)': 'onEscapeKey()',
  },
})
export class App {
  readonly language = inject(Language);
  readonly pwa = inject(PwaService);
  readonly navigationGroups = APP_SIDEBAR_NAVIGATION;

  currentEntry: AppNavigationEntry = APP_NAVIGATION[0].entries[0];
  currentGroupLabel = APP_NAVIGATION[0].label;
  mobileNavigationOpen = false;

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly themeService = inject(ThemeService);

  constructor() {
    this.syncNavigationContext(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.syncNavigationContext(event.urlAfterRedirects);
        this.closeMobileNavigation();
      });
  }

  get themeMode(): ThemeMode {
    return this.themeService.modeSignal();
  }

  get isDarkMode(): boolean {
    return this.themeMode === 'dark';
  }

  get themeToggleLabel(): string {
    return this.isDarkMode ? 'Switch to light' : 'Switch to dark';
  }

  getEntryQueryParams(entry: AppNavigationEntry): Params | null {
    if (entry.id !== 'planning') {
      return null;
    }

    return {
      view: 'day',
      date: DateTime.local().toFormat('yyyy-LL-dd'),
    };
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  openMobileNavigation(): void {
    this.mobileNavigationOpen = true;
  }

  closeMobileNavigation(): void {
    this.mobileNavigationOpen = false;
  }

  onEscapeKey(): void {
    this.closeMobileNavigation();
  }

  private syncNavigationContext(url: string): void {
    const context = findNavigationContextByUrl(url);
    if (!context) {
      this.currentEntry = APP_NAVIGATION[0].entries[0];
      this.currentGroupLabel = APP_NAVIGATION[0].label;
      return;
    }

    this.currentEntry = context.entry;
    this.currentGroupLabel = context.group.label;
  }
}
