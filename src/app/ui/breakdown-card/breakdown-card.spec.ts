import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiBreakdownCard } from './breakdown-card';

@Component({
  imports: [UiBreakdownCard],
  template: '<article appBreakdownCard [density]="density" [prominent]="prominent" [status]="status"><strong>84 / 90 g</strong><span>Below target</span></article>',
})
class TestHost {
  density: 'compact' | 'summary' = 'compact';
  prominent = false;
  status: 'under' | 'exact' | 'over' | 'missing' = 'under';
}

describe('UiBreakdownCard', () => {
  it('preserves the native host and projected breakdown content', async () => {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideZonelessChangeDetection()] }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    const card: HTMLElement = fixture.nativeElement.querySelector('article');
    expect(card.classList.contains('app-breakdown-card')).toBeTrue();
    expect(card.classList.contains('app-breakdown-card--compact')).toBeTrue();
    expect(card.classList.contains('app-breakdown-card--under')).toBeTrue();
    expect(card.textContent).toContain('84 / 90 g');
  });

  it('supports summary, prominent and each status surface state', async () => {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideZonelessChangeDetection()] }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.density = 'summary';
    fixture.componentInstance.prominent = true;
    fixture.componentInstance.status = 'missing';
    await fixture.whenStable();
    const card: HTMLElement = fixture.nativeElement.querySelector('article');
    expect(card.classList.contains('app-breakdown-card--summary')).toBeTrue();
    expect(card.classList.contains('app-breakdown-card--prominent')).toBeTrue();
    expect(card.classList.contains('app-breakdown-card--missing')).toBeTrue();
    expect(card.querySelector('strong')?.textContent).toBe('84 / 90 g');
  });
});
