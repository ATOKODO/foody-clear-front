import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CalendarTagContext, CalendarTagTone, CalendarTagVariant, UiCalendarTag } from './calendar-tag';

@Component({
  imports: [UiCalendarTag],
  template: `<span appCalendarTag class="owner-tag" aria-label="Calendar status"
    [variant]="variant()" [tone]="tone()" [context]="context()" [compact]="compact()">{{ copy() }}</span>
    <span appCalendarTag variant="year-chip" [value]="value()" [label]="label()"></span>`,
})
class TestHost {
  readonly variant = signal<CalendarTagVariant>('meta');
  readonly tone = signal<CalendarTagTone>('neutral');
  readonly context = signal<CalendarTagContext>('surface');
  readonly compact = signal(false);
  readonly copy = signal('3 items');
  readonly value = signal<number | string | null>(0);
  readonly label = signal('days');
}

describe('UiCalendarTag', () => {
  async function setup() {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideZonelessChangeDetection()] }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    return fixture;
  }

  for (const variant of ['year-status', 'year-chip', 'month-today', 'week-today', 'mobile-today', 'chip', 'meta', 'alert', 'assignment', 'source'] as const) {
    it(`renders ${variant} on the original span without replacing owner semantics`, async () => {
      const fixture = await setup();
      fixture.componentInstance.variant.set(variant);
      await fixture.whenStable();
      const tag: HTMLElement = fixture.nativeElement.querySelector('.owner-tag');
      expect(tag.tagName).toBe('SPAN');
      expect(tag.classList.contains(`app-calendar-tag--${variant}`)).toBeTrue();
      expect(tag.textContent).toBe('3 items');
      expect(tag.getAttribute('aria-label')).toBe('Calendar status');
      expect(tag.getAttribute('role')).toBeNull();
      expect(tag.getAttribute('aria-live')).toBeNull();
      expect(tag.tabIndex).toBe(-1);
    });
  }

  it('updates tone, context, density and alert test hooks without stale classes', async () => {
    const fixture = await setup();
    const host = fixture.componentInstance;
    host.variant.set('alert');
    host.tone.set('projected');
    host.context.set('on-color');
    host.compact.set(true);
    await fixture.whenStable();
    const tag: HTMLElement = fixture.nativeElement.querySelector('.owner-tag');
    expect(tag.getAttribute('data-tone')).toBe('projected');
    expect(tag.classList.contains('app-calendar-tag--tone-neutral')).toBeFalse();
    expect(tag.classList.contains('app-calendar-tag--context-on-color')).toBeTrue();
    expect(tag.classList.contains('app-calendar-tag--compact')).toBeTrue();
    host.variant.set('meta');
    host.context.set('surface');
    host.compact.set(false);
    host.copy.set('0 items');
    await fixture.whenStable();
    expect(tag.getAttribute('data-tone')).toBeNull();
    expect(tag.classList.contains('app-calendar-tag--alert')).toBeFalse();
    expect(tag.classList.contains('app-calendar-tag--context-on-color')).toBeFalse();
    expect(tag.classList.contains('app-calendar-tag--compact')).toBeFalse();
    expect(tag.textContent).toBe('0 items');
  });

  it('renders zero and translated year-count labels, and removes rich parts for null', async () => {
    const fixture = await setup();
    const tag: HTMLElement = fixture.nativeElement.querySelector('[appCalendarTag]:last-child');
    expect(tag.querySelector('.calendar-year-chip__value')?.textContent).toBe('0');
    expect(tag.querySelector('.calendar-year-chip__label')?.textContent).toBe('days');
    fixture.componentInstance.value.set(3);
    fixture.componentInstance.label.set('jours');
    await fixture.whenStable();
    expect(tag.querySelector('.calendar-year-chip__value')?.textContent).toBe('3');
    expect(tag.querySelector('.calendar-year-chip__label')?.textContent).toBe('jours');
    fixture.componentInstance.value.set(null);
    await fixture.whenStable();
    expect(tag.querySelectorAll('span').length).toBe(0);
  });
});
