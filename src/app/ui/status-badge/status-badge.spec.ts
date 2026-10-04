import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiStatusBadge, StatusTone } from './status-badge';
import { UiAlert, AlertTone } from '../alert/alert';
import { UiCodePanel } from '../code-panel/code-panel';

@Component({
  imports: [UiStatusBadge, UiAlert, UiCodePanel],
  template: `<span appStatusBadge class="owner-badge" [tone]="status()">Saved</span>
    <p appAlert class="owner-alert" [tone]="alert()" role="status"><strong>Notice</strong> Offline</p>
    <pre appCodePanel [wrap]="wrap()" aria-label="Diagnostic">{{ code }}</pre>`,
})
class TestHost {
  readonly status = signal<StatusTone>('neutral');
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
});
