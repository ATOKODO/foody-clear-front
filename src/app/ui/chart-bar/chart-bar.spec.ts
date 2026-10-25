import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiChartBar, type ChartBarVariant } from './chart-bar';

@Component({
  imports: [UiChartBar],
  template: '<app-chart-bar [variant]="variant()" [height]="height()" />',
})
class TestHost {
  readonly variant = signal<ChartBarVariant>('expense');
  readonly height = signal(42);
}

describe('UiChartBar', () => {
  it('renders the selected variant and percentage height on the native span', async () => {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideZonelessChangeDetection()] }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    const bar: HTMLElement = fixture.nativeElement.querySelector('app-chart-bar');
    expect(bar.classList.contains('app-chart-bar--expense')).toBeTrue();
    expect(bar.style.height).toBe('42%');
  });

  it('updates variant and height reactively', async () => {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideZonelessChangeDetection()] }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    fixture.componentInstance.variant.set('actual');
    fixture.componentInstance.height.set(78);
    await fixture.whenStable();
    const bar: HTMLElement = fixture.nativeElement.querySelector('app-chart-bar');
    expect(bar.classList.contains('app-chart-bar--actual')).toBeTrue();
    expect(bar.style.height).toBe('78%');
  });
});
