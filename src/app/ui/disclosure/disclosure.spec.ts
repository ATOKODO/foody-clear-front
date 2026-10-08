import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiButton } from '../button/button';
import { UiDisclosureSummary } from '../disclosure-summary/disclosure-summary';
import { UiDisclosure } from './disclosure';

@Component({
  imports: [UiDisclosure, UiDisclosureSummary, UiButton],
  template: `<details appDisclosure class="owner-details" [appearance]="appearance()" [open]="expanded()" (toggle)="lastOpen = $any($event.target).open">
    <summary appDisclosureSummary class="owner-summary" [size]="size()" [emphasis]="emphasis()"><strong>Stock</strong> by inventory</summary>
    <p>Fridge: 400 g.</p><button appButton (click)="used = true">Use stock</button>
  </details>`,
})
class TestHost {
  readonly appearance = signal<'inline' | 'panel'>('inline');
  readonly expanded = signal(false);
  readonly size = signal<'small' | 'medium'>('medium');
  readonly emphasis = signal<'normal' | 'strong'>('normal');
  lastOpen: boolean | null = null;
  used = false;
}

describe('Shared native disclosures', () => {
  async function setup() {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideZonelessChangeDetection()] }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    return fixture;
  }

  it('retains summary as the native first child and preserves rich labels and owner classes', async () => {
    const fixture = await setup();
    const details: HTMLDetailsElement = fixture.nativeElement.querySelector('details');
    expect(details.firstElementChild?.tagName).toBe('SUMMARY');
    expect(details.firstElementChild?.querySelector('strong')?.textContent).toBe('Stock');
    expect(details.classList.contains('owner-details')).toBeTrue();
    expect(details.querySelector('summary')?.hasAttribute('role')).toBeFalse();
    expect(details.querySelector('summary')?.hasAttribute('tabindex')).toBeFalse();
    expect(details.open).toBeFalse();
  });

  it('keeps browser toggling and native toggle events without snapping back on unrelated renders', async () => {
    const fixture = await setup();
    const details: HTMLDetailsElement = fixture.nativeElement.querySelector('details');
    const summary: HTMLElement = details.querySelector('summary')!;
    const toggled = new Promise(resolve => details.addEventListener('toggle', resolve, { once: true }));
    summary.click();
    await toggled;
    await fixture.whenStable();
    expect(details.open).toBeTrue();
    expect(fixture.componentInstance.lastOpen).toBeTrue();
    fixture.componentInstance.appearance.set('panel');
    await fixture.whenStable();
    expect(details.open).toBeTrue();
    expect(details.classList.contains('app-ui-disclosure--panel')).toBeTrue();
    fixture.componentInstance.expanded.set(true);
    await fixture.whenStable();
    fixture.componentInstance.expanded.set(false);
    await fixture.whenStable();
    expect(details.open).toBeFalse();
  });

  it('preserves native focus and actions as summary presentation changes', async () => {
    const fixture = await setup();
    fixture.componentInstance.expanded.set(true);
    fixture.componentInstance.size.set('small');
    fixture.componentInstance.emphasis.set('strong');
    await fixture.whenStable();
    const summary: HTMLElement = fixture.nativeElement.querySelector('summary');
    for (const css of ['owner-summary', 'app-ui-disclosure-summary--compact', 'app-ui-disclosure-summary--strong']) expect(summary.classList.contains(css)).toBeTrue();
    summary.focus();
    expect(document.activeElement).toBe(summary);
    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();
    expect(fixture.componentInstance.used).toBeTrue();
  });
});
