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

  it('should build breakdowns from daySetOrder and slotIds fallbacks', () => {
    component.cycles = [
      {
        id: 1,
        title: 'Seche',
        color: 'green',
        durationCount: 4,
        durationType: 'semaine',
        nutritionValues: [
          nutritionValue('PROTEIN', 180),
          nutritionValue('CARBOHYDRATE', 120),
          nutritionValue('FAT', 60),
        ],
        daySetOrder: [10],
      },
    ];
    component.daySets = [
      {
        id: 10,
        title: 'Training',
        nutritionValues: [
          nutritionValue('PROTEIN', 100),
          nutritionValue('CARBOHYDRATE', 90),
          nutritionValue('FAT', 30),
        ],
        slotIds: [21],
      },
    ];
    component.slots = [
      {
        id: 21,
        key: 'breakfast',
        title: 'Petit dejeuner',
        sortOrder: 1,
        startTime: '08:00:00',
        endTime: '09:00:00',
        nutritionValues: [
          nutritionValue('PROTEIN', 50),
          nutritionValue('CARBOHYDRATE', 45),
          nutritionValue('FAT', 15),
        ],
      },
    ];

    const [item] = component.cycleListItems;

    expect(item.daySets.length).toBe(1);
    expect(item.daySets[0].title).toBe('Training');
    expect(item.daySets[0].slots.length).toBe(1);
    expect(item.daySets[0].slots[0].title).toBe('Petit dejeuner');
    expect(item.daySets[0].slotMetrics[0].percentage).toBe(50);
  });

  it('should resolve slot breakdown from numeric ids in daySet.slots', () => {
    component.cycles = [
      {
        id: 2,
        title: 'Masse',
        color: 'orange',
        durationCount: 6,
        durationType: 'jour',
        nutritionValues: [
          nutritionValue('PROTEIN', 220),
          nutritionValue('CARBOHYDRATE', 300),
          nutritionValue('FAT', 70),
        ],
        daySets: [
          {
            id: 11,
            title: 'Jour haut',
            nutritionValues: [
              nutritionValue('PROTEIN', 110),
              nutritionValue('CARBOHYDRATE', 150),
              nutritionValue('FAT', 35),
            ],
            slots: [31, 32],
          },
        ],
      },
    ];
    component.slots = [
      {
        id: 31,
        key: 'breakfast',
        title: 'Petit dejeuner',
        sortOrder: 1,
        startTime: '08:00:00',
        endTime: '09:00:00',
        nutritionValues: [nutritionValue('PROTEIN', 40)],
      },
      {
        id: 32,
        key: 'lunch',
        title: 'Dejeuner',
        sortOrder: 2,
        startTime: '12:00:00',
        endTime: '13:00:00',
        nutritionValues: [nutritionValue('PROTEIN', 70)],
      },
    ];

    const [item] = component.cycleListItems;

    expect(item.daySets[0].slots.length).toBe(2);
    expect(item.daySets[0].slotTotals.proteins).toBe(110);
    expect(item.daySets[0].hasMissingSlotBreakdown).toBeFalse();
  });

  it('should convert mg values to grams in nested breakdown totals', () => {
    component.cycles = [
      {
        id: 3,
        title: 'Recomp',
        color: 'blue',
        durationCount: 3,
        durationType: 'mois',
        nutritionValues: [
          nutritionValue('PROTEIN', 120),
          nutritionValue('CARBOHYDRATE', 150),
          nutritionValue('FAT', 45),
        ],
        daySets: [
          {
            id: 12,
            title: 'Jour mg',
            nutritionValues: [
              nutritionValue('PROTEIN', 50),
              nutritionValue('CARBOHYDRATE', 60),
              nutritionValue('FAT', 20),
            ],
            slots: [
              {
                id: 41,
                title: 'Shake',
                key: 'shake',
                nutritionValues: [nutritionValue('PROTEIN', 25000, 'MG')],
              },
            ],
          },
        ],
      },
    ];

    const [item] = component.cycleListItems;

    expect(item.daySets[0].slots[0].totals.proteins).toBe(25);
    expect(item.daySets[0].slotTotals.proteins).toBe(25);
  });

  function clickToggle(index: number): void {
    const toggleButtons = fixture.nativeElement.querySelectorAll('mat-button-toggle button');
    (toggleButtons[index] as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  function nutritionValue(
    nutritionKey: string,
    amount: number,
    unit = 'G',
  ) {
    return {
      nutritionKey,
      amount,
      unit,
      reference: 'PER_100G' as const,
    };
  }

  function flushCycleRequests(): void {
    httpController.expectOne('http://localhost:3000/meta/nutrition-keys').flush([]);
    httpController.expectOne('http://localhost:3000/day-set').flush([]);
    httpController.expectOne('http://localhost:3000/slot').flush([]);
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
