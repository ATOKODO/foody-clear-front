import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, Routes } from '@angular/router';
import { APP_NAVIGATION } from './app.navigation';
import { App } from './app';

@Component({
  standalone: true,
  template: '<p>Page test</p>',
})
class DummyPage {}

const testRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  ...APP_NAVIGATION.flatMap((group) =>
    group.entries.map((entry) => ({
      path: entry.path.replace(/^\//, ''),
      component: DummyPage,
    })),
  ),
];

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(testRoutes)],
    }).compileComponents();
  });

  it('should create the app shell', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    expect(app).toBeTruthy();
  });

  it('should render the navigation shell', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Foody Clear');
    expect(compiled.textContent).toContain('Catalogue');
    expect(compiled.querySelector('.app-theme-toggle')).not.toBeNull();
  });

  it('should redirect the root route to /home', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/');
    fixture.detectChanges();

    expect(router.url).toBe('/home');
    expect(fixture.nativeElement.textContent).toContain('Accueil');
  });
});
