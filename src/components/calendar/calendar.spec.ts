import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Calendar } from './calendar';

describe('Calendar', () => {
  let component: Calendar;
  let fixture: ComponentFixture<Calendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Calendar],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Calendar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit manageItems from day view', () => {
    const emitted: Array<unknown> = [];
    component.manageItems.subscribe((event) => emitted.push(event));

    component.switchView('day');
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.calendar-items-trigger-day');
    trigger.click();

    expect((emitted[0] as { dateLocal: string }).dateLocal).toBe(component.currentDate.toISODate());
  });

  it('should emit manageItems from week view', () => {
    const emitted: Array<unknown> = [];
    component.manageItems.subscribe((event) => emitted.push(event));

    component.switchView('week');
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.calendar-items-trigger-week');
    trigger.click();

    expect((emitted[0] as { dateLocal: string }).dateLocal).toBe(component.weekDays[0].date);
  });
});
