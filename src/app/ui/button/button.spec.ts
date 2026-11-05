import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiButton } from './button';

@Component({
  imports: [UiButton],
  template: `<form (submit)="submissions = submissions + 1; $event.preventDefault()" (reset)="resets = resets + 1">
    <button appButton class="screen-action" [variant]="variant()" [disabled]="disabled()" [loading]="loading()" [type]="type()"
      aria-label="Save item" (click)="clicks = clicks + 1" (activated)="activations = activations + 1"><span>Save</span></button>
  </form>`,
})
class TestHost {
  readonly disabled = signal(false);
  readonly loading = signal(false);
  readonly variant = signal<'primary' | 'secondary' | 'danger'>('primary');
  readonly type = signal<'button' | 'submit' | 'reset'>('button');
  clicks = 0;
  activations = 0;
  submissions = 0;
  resets = 0;
}

describe('UiButton', () => {
  async function setup() {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideZonelessChangeDetection()] }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    return { fixture, host: fixture.componentInstance, button: fixture.nativeElement.querySelector('button') as HTMLButtonElement };
  }

  it('projects content onto the single native button and keeps consumer classes and ARIA', async () => {
    const { fixture, host, button } = await setup();
    expect(fixture.nativeElement.querySelectorAll('button').length).toBe(1);
    expect(button.textContent).toBe('Save');
    expect(button.classList.contains('screen-action')).toBeTrue();
    expect(button.classList.contains('app-ui-button--primary')).toBeTrue();
    expect(button.getAttribute('aria-label')).toBe('Save item');
    host.variant.set('secondary');
    await fixture.whenStable();
    expect(button.classList.contains('app-ui-button--secondary')).toBeTrue();
    expect(button.classList.contains('app-ui-button--primary')).toBeFalse();
    host.variant.set('danger');
    await fixture.whenStable();
    expect(button.classList.contains('app-ui-button--danger')).toBeTrue();
    expect(button.classList.contains('screen-action')).toBeTrue();
  });

  it('preserves native clicks and emits the activation output without submitting by default', async () => {
    const { fixture, host, button } = await setup();
    button.click();
    await fixture.whenStable();
    expect(host.clicks).toBe(1);
    expect(host.activations).toBe(1);
    expect(host.submissions).toBe(0);
  });

  it('supports native submit and reset in forms', async () => {
    const { fixture, host, button } = await setup();
    host.type.set('submit');
    await fixture.whenStable();
    button.click();
    await fixture.whenStable();
    expect(host.submissions).toBe(1);
    host.type.set('reset');
    await fixture.whenStable();
    button.click();
    await fixture.whenStable();
    expect(host.resets).toBe(1);
  });

  it('disables native activation during disabled and loading states', async () => {
    const { fixture, host, button } = await setup();
    host.disabled.set(true);
    await fixture.whenStable();
    button.click();
    expect(button.disabled).toBeTrue();
    expect(host.clicks).toBe(0);
    host.disabled.set(false);
    host.loading.set(true);
    await fixture.whenStable();
    expect(button.disabled).toBeTrue();
    expect(button.getAttribute('aria-busy')).toBe('true');
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(host.clicks).toBe(0);
    expect(host.activations).toBe(0);
    host.loading.set(false);
    await fixture.whenStable();
    expect(button.disabled).toBeFalse();
    expect(button.hasAttribute('aria-busy')).toBeFalse();
  });

  it('keeps the native button as the keyboard focus target', async () => {
    const { button } = await setup();
    button.focus();
    expect(document.activeElement).toBe(button);
    expect(button.tabIndex).toBe(0);
  });
});
