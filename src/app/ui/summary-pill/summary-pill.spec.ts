import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiSummaryPill } from './summary-pill';

@Component({
  imports: [UiSummaryPill],
  template: `<span appSummaryPill class="owner-summary" aria-label="Available products">{{ count() }} products</span>
    <span appSummaryPill role="status"><strong>{{ count() }}</strong> products available</span>`,
})
class TestHost {
  readonly count = signal(3);
}

describe('UiSummaryPill', () => {
  async function setup() {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideZonelessChangeDetection()] }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    return fixture;
  }

  it('uses the original span and preserves consumer classes and the accessible label', async () => {
    const fixture = await setup();
    const pill: HTMLElement = fixture.nativeElement.querySelector('.owner-summary');
    expect(pill.tagName).toBe('SPAN');
    expect(pill.classList.contains('app-summary-pill')).toBeTrue();
    expect(pill.getAttribute('aria-label')).toBe('Available products');
    expect(pill.textContent).toBe('3 products');
  });

  it('updates projected counts including zero without introducing a focus target or live region', async () => {
    const fixture = await setup();
    const pill: HTMLElement = fixture.nativeElement.querySelector('.owner-summary');
    fixture.componentInstance.count.set(0);
    await fixture.whenStable();
    expect(pill.textContent).toBe('0 products');
    expect(pill.getAttribute('role')).toBeNull();
    expect(pill.getAttribute('aria-live')).toBeNull();
    expect(pill.tabIndex).toBe(-1);
  });

  it('preserves projected emphasis and an explicitly owner-managed announcement role', async () => {
    const fixture = await setup();
    const pill: HTMLElement = fixture.nativeElement.querySelector('[role="status"]');
    expect(pill.querySelector('strong')?.textContent).toBe('3');
    fixture.componentInstance.count.set(12);
    await fixture.whenStable();
    expect(pill.querySelector('strong')?.textContent).toBe('12');
    expect(pill.getAttribute('role')).toBe('status');
  });
});
