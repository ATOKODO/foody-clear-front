import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Routes } from '@angular/router';
import { APP_NAVIGATION } from '../../app/app.navigation';
import { Home } from './home';

@Component({
  standalone: true,
  template: '<p>Page test</p>',
})
class DummyPage {}

const testRoutes: Routes = APP_NAVIGATION.flatMap((group) =>
  group.entries.map((entry) => ({
    path: entry.path.replace(/^\//, ''),
    component: DummyPage,
  })),
);

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter(testRoutes)],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the dashboard entry points', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Tableau de bord');
    expect(compiled.textContent).toContain('Ouvrir le catalogue');
    expect(compiled.textContent).toContain('Planning');
  });
});
