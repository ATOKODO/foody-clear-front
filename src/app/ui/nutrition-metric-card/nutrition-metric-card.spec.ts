import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiNutritionMetricCard } from './nutrition-metric-card';

@Component({
  imports: [UiNutritionMetricCard],
  template: '<div appNutritionMetricCard [prominent]="prominent" class="lc-macro-card"><p>Proteins</p><strong>42 g</strong></div>',
})
class TestHost {
  prominent = false;
}

describe('UiNutritionMetricCard', () => {
  it('preserves the native host and owner-provided metric content', async () => {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideZonelessChangeDetection()] }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    const card: HTMLElement = fixture.nativeElement.querySelector('.lc-macro-card');
    expect(card.tagName).toBe('DIV');
    expect(card.classList.contains('app-nutrition-metric-card')).toBeTrue();
    expect(card.textContent).toContain('Proteins');
    expect(card.textContent).toContain('42 g');
  });

  it('exposes the prominent presentation without taking over metric content', async () => {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideZonelessChangeDetection()] }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.prominent = true;
    await fixture.whenStable();
    const card: HTMLElement = fixture.nativeElement.querySelector('.lc-macro-card');
    expect(card.classList.contains('app-nutrition-metric-card--prominent')).toBeTrue();
    expect(card.querySelector('strong')?.textContent).toBe('42 g');
  });
});
