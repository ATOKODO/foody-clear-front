import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiStatusBadge, StatusTone, BadgeSize, BadgeEmphasis, BadgeAppearance } from './status-badge';
import { UiAlert, AlertTone } from '../alert/alert';
import { UiCodePanel } from '../code-panel/code-panel';

@Component({
  imports: [UiStatusBadge, UiAlert, UiCodePanel],
  template: `<span appStatusBadge class="owner-badge" [tone]="status()" [size]="size()" [emphasis]="emphasis()" [appearance]="appearance()" [attr.role]="announcement()">Saved</span>
    <em appStatusBadge class="owner-marker" tone="info" size="marker" emphasis="heavy" appearance="soft">External</em>
    <p appAlert class="owner-alert" [tone]="alert()" role="status"><strong>Notice</strong> Offline</p>
    <pre appCodePanel [wrap]="wrap()" aria-label="Diagnostic">{{ code }}</pre>`,
})
class TestHost {
  readonly status = signal<StatusTone>('neutral');
  readonly size = signal<BadgeSize>('medium');
  readonly emphasis = signal<BadgeEmphasis>('strong');
  readonly appearance = signal<BadgeAppearance>('outlined');
  readonly announcement = signal<'status' | null>(null);
  readonly alert = signal<AlertTone>('warning');
  readonly wrap = signal(false);
  readonly code = '{\n  "name": "Demo"\n}';
}

describe('Shared feedback primitives', () => {
  async function setup() {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideZonelessChangeDetection()] }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    return fixture;
  }

  it('renders badges on the original span, preserving projected text and owner classes', async () => {
    const fixture = await setup();
    const badge: HTMLElement = fixture.nativeElement.querySelector('span');
    expect(badge.textContent).toBe('Saved');
    expect(badge.classList.contains('owner-badge')).toBeTrue();
    fixture.componentInstance.status.set('success');
    await fixture.whenStable();
    expect(badge.classList.contains('app-status-pill--success')).toBeTrue();
    expect(badge.classList.contains('app-status-pill--neutral')).toBeFalse();
    expect(badge.classList.contains('owner-badge')).toBeTrue();
  });

  it('keeps the notice role and content while its visual tone changes', async () => {
    const fixture = await setup();
    const alert: HTMLElement = fixture.nativeElement.querySelector('p');
    expect(alert.getAttribute('role')).toBe('status');
    expect(alert.querySelector('strong')?.textContent).toBe('Notice');
    expect(alert.classList.contains('owner-alert')).toBeTrue();
    fixture.componentInstance.alert.set('error');
    await fixture.whenStable();
    expect(alert.classList.contains('app-alert--error')).toBeTrue();
    expect(alert.getAttribute('role')).toBe('status');
  });

  it('updates every badge tone without retaining a stale visual state or introducing live announcements', async () => {
    const fixture = await setup();
    const badge: HTMLElement = fixture.nativeElement.querySelector('span');
    const tones: StatusTone[] = ['neutral', 'saving', 'warning', 'info', 'success', 'danger'];
    for (const tone of tones) {
      fixture.componentInstance.status.set(tone);
      await fixture.whenStable();
      for (const candidate of tones) expect(badge.classList.contains(`app-status-pill--${candidate}`)).toBe(candidate === tone);
      expect(badge.getAttribute('role')).toBeNull();
      expect(badge.getAttribute('aria-live')).toBeNull();
      expect(badge.tabIndex).toBe(-1);
      expect(badge.textContent).toBe('Saved');
      expect(badge.classList.contains('owner-badge')).toBeTrue();
    }
  });

  it('updates compact sizing and emphasis independently of tone and consumer classes', async () => {
    const fixture = await setup();
    const badge: HTMLElement = fixture.nativeElement.querySelector('span');
    for (const size of ['small', 'compact', 'card', 'counter', 'chip', 'marker', 'medium'] as const) {
      fixture.componentInstance.size.set(size);
      fixture.componentInstance.emphasis.set('medium');
      await fixture.whenStable();
      for (const candidate of ['small', 'compact', 'card', 'counter', 'chip', 'marker', 'medium']) expect(badge.classList.contains(`app-status-pill--${candidate}`)).toBe(candidate === size);
      expect(badge.classList.contains('app-status-pill--weight-medium')).toBeTrue();
      expect(badge.classList.contains('app-status-pill--weight-strong')).toBeFalse();
      expect(badge.classList.contains('app-status-pill--neutral')).toBeTrue();
    }
    fixture.componentInstance.emphasis.set('normal');
    await fixture.whenStable();
    expect(badge.classList.contains('app-status-pill--weight-normal')).toBeTrue();
    expect(badge.classList.contains('app-status-pill--weight-medium')).toBeFalse();
    expect(badge.classList.contains('owner-badge')).toBeTrue();
  });

  it('keeps owner semantics while switching between bordered, borderless and bare appearances', async () => {
    const fixture = await setup();
    const badge: HTMLElement = fixture.nativeElement.querySelector('span');
    fixture.componentInstance.announcement.set('status');
    fixture.componentInstance.status.set('warning');
    for (const appearance of ['soft', 'bare', 'outlined'] as const) {
      fixture.componentInstance.appearance.set(appearance);
      await fixture.whenStable();
      for (const candidate of ['soft', 'bare', 'outlined']) expect(badge.classList.contains(`app-status-pill--appearance-${candidate}`)).toBe(candidate === appearance);
      expect(badge.getAttribute('role')).toBe('status');
      expect(badge.textContent).toBe('Saved');
      expect(badge.classList.contains('app-status-pill--warning')).toBeTrue();
      expect(badge.classList.contains('owner-badge')).toBeTrue();
    }
  });

  it('supports the original semibold counter weight without retaining another emphasis', async () => {
    const fixture = await setup();
    const badge: HTMLElement = fixture.nativeElement.querySelector('span');
    fixture.componentInstance.size.set('counter');
    fixture.componentInstance.emphasis.set('semibold');
    await fixture.whenStable();
    expect(badge.classList.contains('app-status-pill--weight-semibold')).toBeTrue();
    expect(badge.classList.contains('app-status-pill--weight-strong')).toBeFalse();
  });

  it('preserves exact code content and supports keyboard focus and wrapping', async () => {
    const fixture = await setup();
    const code: HTMLPreElement = fixture.nativeElement.querySelector('pre');
    expect(code.textContent).toBe(fixture.componentInstance.code);
    expect(code.getAttribute('aria-label')).toBe('Diagnostic');
    code.focus();
    expect(document.activeElement).toBe(code);
    fixture.componentInstance.wrap.set(true);
    await fixture.whenStable();
    expect(code.classList.contains('app-code-panel--wrap')).toBeTrue();
    expect(code.textContent).toBe(fixture.componentInstance.code);
  });

  it('keeps emphasis markup for tiny origin markers without adding an announcement', async () => {
    const fixture = await setup();
    const badge: HTMLElement = fixture.nativeElement.querySelector('.owner-marker');
    expect(badge.tagName).toBe('EM');
    expect(badge.textContent).toBe('External');
    expect(badge.classList.contains('app-status-pill--marker')).toBeTrue();
    expect(badge.classList.contains('app-status-pill--weight-heavy')).toBeTrue();
    expect(badge.getAttribute('role')).toBeNull();
    expect(badge.getAttribute('aria-live')).toBeNull();
    expect(badge.tabIndex).toBe(-1);
  });

  it('switches heavy emphasis back to the unchanged default weight', async () => {
    const fixture = await setup();
    const badge: HTMLElement = fixture.nativeElement.querySelector('.owner-badge');
    fixture.componentInstance.emphasis.set('heavy');
    await fixture.whenStable();
    expect(badge.classList.contains('app-status-pill--weight-heavy')).toBeTrue();
    fixture.componentInstance.emphasis.set('strong');
    await fixture.whenStable();
    expect(badge.classList.contains('app-status-pill--weight-heavy')).toBeFalse();
    expect(badge.classList.contains('app-status-pill--weight-strong')).toBeTrue();
  });
});
