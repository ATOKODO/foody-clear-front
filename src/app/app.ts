import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, HostListener, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import {
  APP_NAVIGATION,
  APP_SIDEBAR_NAVIGATION,
  AppNavigationEntry,
  findNavigationContextByUrl,
} from './app.navigation';
import { ThemeMode, ThemeService } from '../services/theme-service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  readonly navigationGroups = APP_SIDEBAR_NAVIGATION;

  currentEntry: AppNavigationEntry = APP_NAVIGATION[0].entries[0];
  currentGroupLabel = APP_NAVIGATION[0].label;
  mobileNavigationOpen = false;
  themeMode: ThemeMode = 'light';

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly themeService = inject(ThemeService);

  constructor() {
    this.themeMode = this.themeService.mode;
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

    this.themeService.mode$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((mode) => {
        this.themeMode = mode;
      });
  }

  get isDarkMode(): boolean {
    return this.themeMode === 'dark';
  }

  get themeToggleLabel(): string {
    return this.isDarkMode ? 'Passer en clair' : 'Passer en sombre';
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

  @HostListener('document:keydown.escape')
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
