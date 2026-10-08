import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BreakdownBadgeKind, BreakdownStatus, UiBreakdownBadge } from './breakdown-badge';

@Component({
  imports: [UiBreakdownBadge],
  template: `<span appBreakdownBadge class="owner-badge" aria-label="Cycle breakdown"
    [kind]="kind()" [status]="status()" [expanded]="expanded()"><strong>{{ count() }}</strong> linked day sets</span>`,
})
class TestHost {
  readonly kind = signal<BreakdownBadgeKind>('status');
  readonly status = signal<BreakdownStatus>('under');
  readonly expanded = signal(false);
  readonly count = signal(3);
}

describe('UiBreakdownBadge', () => {
  async function setup() {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideZonelessChangeDetection()] }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    return fixture;
  }

  for (const status of ['under', 'exact', 'over', 'missing'] as const) {
    it(`renders ${status} without changing the native host or projected content`, async () => {
      const fixture = await setup();
      fixture.componentInstance.status.set(status);
      await fixture.whenStable();
      const badge: HTMLElement = fixture.nativeElement.querySelector('.owner-badge');
      expect(badge.tagName).toBe('SPAN');
      expect(badge.classList.contains(`app-breakdown-badge--${status}`)).toBeTrue();
      expect(badge.classList.contains(`lc-status-${status}`)).toBeTrue();
      if (status !== 'under') expect(badge.classList.contains('lc-status-under')).toBeFalse();
      expect(badge.querySelector('strong')?.textContent).toBe('3');
      expect(badge.getAttribute('aria-label')).toBe('Cycle breakdown');
      expect(badge.getAttribute('role')).toBeNull();
      expect(badge.getAttribute('aria-live')).toBeNull();
      expect(badge.tabIndex).toBe(-1);
    });
  }

  it('switches metadata and overview density without leaking a status class', async () => {
    const fixture = await setup();
    const host = fixture.componentInstance;
    host.kind.set('meta');
    host.expanded.set(true);
    host.count.set(0);
    await fixture.whenStable();
    const badge: HTMLElement = fixture.nativeElement.querySelector('.owner-badge');
    expect(badge.classList.contains('app-breakdown-badge--meta')).toBeTrue();
    expect(badge.classList.contains('app-breakdown-badge--expanded')).toBeTrue();
    expect(badge.classList.contains('lc-status-under')).toBeFalse();
    expect(badge.querySelector('strong')?.textContent).toBe('0');
    host.kind.set('overview');
    host.status.set('missing');
    host.expanded.set(false);
    await fixture.whenStable();
    expect(badge.classList.contains('app-breakdown-badge--overview')).toBeTrue();
    expect(badge.classList.contains('app-breakdown-badge--missing')).toBeTrue();
    expect(badge.classList.contains('app-breakdown-badge--meta')).toBeFalse();
    expect(badge.classList.contains('app-breakdown-badge--expanded')).toBeFalse();
  });
});
