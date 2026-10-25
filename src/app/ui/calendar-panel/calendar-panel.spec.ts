import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiCalendarPanel } from './calendar-panel';

@Component({
  imports: [UiCalendarPanel],
  template: '<div appCalendarPanel class="calendar-year-panel"><h2>Year view</h2><button type="button">Open day</button></div>',
})
class TestHost {}

describe('UiCalendarPanel', () => {
  it('preserves the native panel, view hook and projected calendar controls', async () => {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideZonelessChangeDetection()] }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    const panel: HTMLElement = fixture.nativeElement.querySelector('.calendar-year-panel');
    expect(panel.tagName).toBe('DIV');
    expect(panel.classList.contains('app-calendar-panel')).toBeTrue();
    expect(panel.querySelector('h2')?.textContent).toBe('Year view');
    expect(panel.querySelector('button')?.textContent).toBe('Open day');
  });
});
