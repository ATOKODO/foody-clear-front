import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiDateBadge } from './date-badge';

@Component({
  imports: [UiDateBadge],
  template: '<div appDateBadge class="owner-date" aria-label="Selected date" [label]="label()" [value]="value()" [detail]="detail()"></div>',
})
class TestHost {
  readonly label = signal('Date');
  readonly value = signal('2026-03-25');
  readonly detail = signal<string | null>(null);
}

describe('UiDateBadge', () => {
  async function setup() {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideZonelessChangeDetection()] }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    return fixture;
  }

  it('keeps the original div and owner semantics without adding a live role or focus target', async () => {
    const fixture = await setup();
    const badge: HTMLElement = fixture.nativeElement.querySelector('.owner-date');
    expect(badge.tagName).toBe('DIV');
    expect(badge.classList.contains('app-date-badge')).toBeTrue();
    expect(badge.getAttribute('aria-label')).toBe('Selected date');
    expect(badge.getAttribute('role')).toBeNull();
    expect(badge.getAttribute('aria-live')).toBeNull();
    expect(badge.tabIndex).toBe(-1);
    expect(badge.children.length).toBe(2);
  });

  it('updates supplied dates and translations without reformatting them', async () => {
    const fixture = await setup();
    fixture.componentInstance.label.set('Date sélectionnée');
    fixture.componentInstance.value.set('25 mars 2026');
    await fixture.whenStable();
    const badge: HTMLElement = fixture.nativeElement.querySelector('.owner-date');
    expect(badge.querySelector('.planning-actions-modal__date-label')?.textContent).toBe('Date sélectionnée');
    expect(badge.querySelector('.planning-actions-modal__date-value')?.textContent).toBe('25 mars 2026');
  });

  it('adds and removes optional detail without leaving an empty row', async () => {
    const fixture = await setup();
    const badge: HTMLElement = fixture.nativeElement.querySelector('.owner-date');
    fixture.componentInstance.detail.set('08:30');
    await fixture.whenStable();
    expect(badge.querySelector('.planning-actions-modal__date-time')?.textContent).toBe('08:30');
    expect(badge.children.length).toBe(3);
    for (const detail of ['', null]) {
      fixture.componentInstance.detail.set(detail);
      await fixture.whenStable();
      expect(badge.querySelector('.app-date-badge__detail')).toBeNull();
      expect(badge.children.length).toBe(2);
    }
  });
});
