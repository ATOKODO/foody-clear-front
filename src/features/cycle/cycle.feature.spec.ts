import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { CycleFeature } from './cycle.feature';

describe('CycleFeature', () => {
  let component: CycleFeature;
  let fixture: ComponentFixture<CycleFeature>;
  let httpController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CycleFeature],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CycleFeature);
    component = fixture.componentInstance;
    httpController = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
    flushCycleRequests();
    fixture.detectChanges();
  });

  afterEach(() => {
    httpController.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the toggle and show cycle by default', () => {
    const toggleLabels = Array.from(
      fixture.nativeElement.querySelectorAll('mat-button-toggle'),
    ).map((toggle) => toggle.textContent?.trim());

    expect(toggleLabels).toEqual(['Cycle', 'Day Set', 'Slots']);
    expect(component.activeView).toBe('cycle');
    expect(fixture.nativeElement.querySelector('app-list-cycle')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-day-set-feature')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-slot-feature')).toBeNull();
  });

  it('should show the day set feature when selecting its toggle', () => {
    clickToggle(1);
    flushDaySetRequests();
    fixture.detectChanges();

    expect(component.activeView).toBe('daySet');
    expect(fixture.nativeElement.querySelector('app-day-set-feature')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-list-cycle')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-slot-feature')).toBeNull();
  });

  it('should show the slot feature when selecting its toggle', () => {
    clickToggle(2);
    flushSlotRequests();
    fixture.detectChanges();

    expect(component.activeView).toBe('slot');
    expect(fixture.nativeElement.querySelector('app-slot-feature')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-list-cycle')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-day-set-feature')).toBeNull();
  });

  function clickToggle(index: number): void {
    const toggleButtons = fixture.nativeElement.querySelectorAll('mat-button-toggle button');
    (toggleButtons[index] as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  function flushCycleRequests(): void {
    httpController.expectOne('http://localhost:3000/meta/nutrition-keys').flush([]);
    httpController.expectOne('http://localhost:3000/day-set').flush([]);
    httpController.expectOne('http://localhost:3000/cycle').flush([]);
  }

  function flushDaySetRequests(): void {
    httpController.expectOne('http://localhost:3000/meta/nutrition-keys').flush([]);
    httpController.expectOne('http://localhost:3000/slot').flush([]);
    httpController.expectOne('http://localhost:3000/day-set').flush([]);
  }

  function flushSlotRequests(): void {
    httpController.expectOne('http://localhost:3000/meta/nutrition-keys').flush([]);
    httpController.expectOne('http://localhost:3000/slot').flush([]);
  }
});
