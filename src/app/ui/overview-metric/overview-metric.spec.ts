import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiOverviewMetric } from './overview-metric';

@Component({
  imports: [UiOverviewMetric],
  template: '<div appOverviewMetric class="owner-metric" aria-label="Calendar summary" [value]="value()" [label]="label()"></div>',
})
class TestHost {
  readonly value = signal<number | string>(12);
  readonly label = signal('Months covered');
}

describe('UiOverviewMetric', () => {
  async function setup() {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideZonelessChangeDetection()] }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    return fixture;
  }

  it('keeps the native host, caller classes and accessible name', async () => {
    const fixture = await setup();
    const metric: HTMLElement = fixture.nativeElement.querySelector('.owner-metric');
    expect(metric.tagName).toBe('DIV');
    expect(metric.classList.contains('app-overview-metric')).toBeTrue();
    expect(metric.getAttribute('aria-label')).toBe('Calendar summary');
    expect(metric.children.length).toBe(2);
    expect(metric.querySelector('.calendar-week-overview__value')?.textContent).toBe('12');
    expect(metric.querySelector('.calendar-week-overview__label')?.textContent).toBe('Months covered');
  });

  it('renders zero and owner-formatted values without parsing or changing translated labels', async () => {
    const fixture = await setup();
    const metric: HTMLElement = fixture.nativeElement.querySelector('.owner-metric');
    fixture.componentInstance.value.set(0);
    fixture.componentInstance.label.set('Jours planifiés');
    await fixture.whenStable();
    expect(metric.querySelector('.app-overview-metric__value')?.textContent).toBe('0');
    expect(metric.querySelector('.app-overview-metric__label')?.textContent).toBe('Jours planifiés');
    fixture.componentInstance.value.set('1 234,5 kcal');
    await fixture.whenStable();
    expect(metric.querySelector('.app-overview-metric__value')?.textContent).toBe('1 234,5 kcal');
  });

  it('does not turn a static value into a live region or focus target', async () => {
    const fixture = await setup();
    const metric: HTMLElement = fixture.nativeElement.querySelector('.owner-metric');
    expect(metric.getAttribute('role')).toBeNull();
    expect(metric.getAttribute('aria-live')).toBeNull();
    expect(metric.tabIndex).toBe(-1);
  });
});
