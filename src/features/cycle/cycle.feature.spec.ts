import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
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
  let overlayContainer: OverlayContainer;

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
    overlayContainer = TestBed.inject(OverlayContainer);

    fixture.detectChanges();
    flushCycleRequests();
    fixture.detectChanges();
  });

  afterEach(() => {
    httpController.verify();
    overlayContainer.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the toggle and show cycle by default', () => {
    const toggleElements = fixture.nativeElement.querySelectorAll(
      'mat-button-toggle',
    ) as NodeListOf<Element>;
    const toggleLabels = Array.from(toggleElements).map((toggle) =>
      toggle.textContent?.trim(),
    );

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
        durationDays: 28,
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
    expect(item.missingDayCount).toBe(27);
    expect(item.daySetTotals.proteins).toBeCloseTo(177.14, 2);
  });

  it('should resolve slot breakdown from numeric ids in daySet.slots', () => {
    component.cycles = [
      {
        id: 2,
        title: 'Masse',
        color: 'orange',
        durationDays: 6,
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
        durationDays: 90,
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

  it('should map durationDays and daySetOrder in create dto', () => {
    const dto = (component as unknown as {
      toCreateDto: (value: {
        titre: string;
        couleur: string;
        nutritionValues: Array<{
          nutritionKey: string;
          amount: number;
          unit: string;
          reference: 'PER_100G' | 'PER_100ML';
        }>;
        nombre: number;
        typeDuree: 'jour' | 'semaine' | 'mois';
        durationDays: number;
        daySetIds: number[];
        daySetOrder: number[];
      }) => unknown;
    }).toCreateDto({
      titre: 'Cut',
      couleur: 'green',
      nutritionValues: [nutritionValue('PROTEIN', 180)],
      nombre: 12,
      typeDuree: 'jour',
      durationDays: 12,
      daySetIds: [3, 1],
      daySetOrder: [0, 3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    });

    expect(dto).toEqual({
      title: 'Cut',
      color: 'green',
      nutritionValues: [nutritionValue('PROTEIN', 180)],
      durationDays: 12,
      durationCount: 12,
      durationType: 'jour',
      daySetIds: [3, 1],
      daySetOrder: [0, 3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    });
  });

  it('should hydrate edit form with durationDays and ordered day sets', () => {
    component.cycles = [
      {
        id: 9,
        title: 'Reverse',
        color: 'pink',
        durationDays: 10,
        durationCount: 10,
        durationType: 'jour',
        nutritionValues: [nutritionValue('PROTEIN', 120)],
        daySetOrder: [0, 5, 0, 2, 0, 0, 0, 0, 0, 0],
      },
    ];

    component.onEditRequested({
      id: 9,
      title: 'Reverse',
      color: 'pink',
      proteins: 120,
      carbs: 0,
      lipids: 0,
      durationDays: 10,
      durationCount: 10,
      durationType: 'jour',
      missingDayCount: 0,
      daySetTotals: { proteins: 0, carbs: 0, lipids: 0 },
      daySetMetrics: [],
      daySets: [],
      hasDaySetOverflow: false,
      hasSlotOverflow: false,
      hasMissingSlotBreakdown: false,
    });

    expect(component.formInitialValue).toEqual({
      titre: 'Reverse',
      couleur: 'pink',
      nutritionValues: [nutritionValue('PROTEIN', 120)],
      nombre: 10,
      typeDuree: 'jour',
      durationDays: 10,
      daySetIds: [5, 2],
      daySetOrder: [0, 5, 0, 2, 0, 0, 0, 0, 0, 0],
    });
  });

  it('should derive the edit duration presentation from durationDays', () => {
    component.cycles = [
      {
        id: 10,
        title: 'Canon',
        color: 'blue',
        durationDays: 14,
        durationCount: 14,
        durationType: 'jour',
        nutritionValues: [nutritionValue('PROTEIN', 140)],
        daySetOrder: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
    ];

    component.onEditRequested({
      id: 10,
      title: 'Canon',
      color: 'blue',
      proteins: 140,
      carbs: 0,
      lipids: 0,
      durationDays: 14,
      durationCount: 14,
      durationType: 'jour',
      missingDayCount: 14,
      daySetTotals: { proteins: 0, carbs: 0, lipids: 0 },
      daySetMetrics: [],
      daySets: [],
      hasDaySetOverflow: false,
      hasSlotOverflow: false,
      hasMissingSlotBreakdown: false,
    });

    expect(component.formInitialValue).toEqual({
      titre: 'Canon',
      couleur: 'blue',
      nutritionValues: [nutritionValue('PROTEIN', 140)],
      nombre: 2,
      typeDuree: 'semaine',
      durationDays: 14,
      daySetIds: [],
      daySetOrder: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    });
  });

  it('should open the cycle form in a dialog when editing', () => {
    component.cycles = [
      {
        id: 9,
        title: 'Reverse',
        color: 'pink',
        durationDays: 10,
        durationCount: 10,
        durationType: 'jour',
        nutritionValues: [nutritionValue('PROTEIN', 120)],
        daySetOrder: [0, 5, 0, 2, 0, 0, 0, 0, 0, 0],
      },
    ];

    component.onEditRequested({
      id: 9,
      title: 'Reverse',
      color: 'pink',
      proteins: 120,
      carbs: 0,
      lipids: 0,
      durationDays: 10,
      durationCount: 10,
      durationType: 'jour',
      missingDayCount: 0,
      daySetTotals: { proteins: 0, carbs: 0, lipids: 0 },
      daySetMetrics: [],
      daySets: [],
      hasDaySetOverflow: false,
      hasSlotOverflow: false,
      hasMissingSlotBreakdown: false,
    });
    fixture.detectChanges();

    const dialogText = overlayContainer.getContainerElement().textContent ?? '';

    expect(component.formVisible).toBeTrue();
    expect(dialogText).toContain('Modifier un cycle');
    expect(dialogText).toContain('Les changements sont appliques sans quitter la liste.');
  });

  it('should confirm impact and send reschedule options when durationDays changes on edit', () => {
    component.cycles = [
      {
        id: 9,
        title: 'Reverse',
        color: 'pink',
        durationDays: 7,
        durationCount: 1,
        durationType: 'semaine',
        nutritionValues: [nutritionValue('PROTEIN', 120)],
        daySetOrder: [0, 0, 0, 0, 0, 0, 0],
      },
    ];

    component.onEditRequested({
      id: 9,
      title: 'Reverse',
      color: 'pink',
      proteins: 120,
      carbs: 0,
      lipids: 0,
      durationDays: 7,
      durationCount: 1,
      durationType: 'semaine',
      missingDayCount: 7,
      daySetTotals: { proteins: 0, carbs: 0, lipids: 0 },
      daySetMetrics: [],
      daySets: [],
      hasDaySetOverflow: false,
      hasSlotOverflow: false,
      hasMissingSlotBreakdown: false,
    });
    fixture.detectChanges();

    component.onFormSubmitted({
      mode: 'edit',
      value: {
        titre: 'Reverse',
        couleur: 'pink',
        nutritionValues: [nutritionValue('PROTEIN', 120)],
        nombre: 10,
        typeDuree: 'jour',
        durationDays: 10,
        daySetIds: [],
        daySetOrder: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
    });
    fixture.detectChanges();

    expect(httpController.match('http://localhost:3000/cycle/9').length).toBe(0);
    expect(overlayContainer.getContainerElement().textContent ?? '').toContain(
      'Impact sur les assignations',
    );

    component.confirmImpactUpdate();

    const updateRequest = httpController.expectOne('http://localhost:3000/cycle/9');
    expect(updateRequest.request.method).toBe('PATCH');
    expect(updateRequest.request.body).toEqual({
      title: 'Reverse',
      color: 'pink',
      nutritionValues: [nutritionValue('PROTEIN', 120)],
      durationDays: 10,
      durationCount: 10,
      durationType: 'jour',
      daySetIds: [],
      daySetOrder: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      assignmentRescheduleScope: 'future',
      assignmentGapMode: 'preserve',
      assignmentEffectiveDateLocal: component.impactEffectiveDateLocal,
    });
    updateRequest.flush({
      id: 9,
      title: 'Reverse',
      color: 'pink',
      durationDays: 10,
      durationCount: 10,
      durationType: 'jour',
      nutritionValues: [nutritionValue('PROTEIN', 120)],
      daySetOrder: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    });

    httpController.expectOne('http://localhost:3000/cycle').flush([]);
  });

  it('should reload cycles, day sets and slots when linked data changes', () => {
    component.onLinkedDataChanged();

    httpController.expectOne('http://localhost:3000/day-set').flush([
      {
        id: 10,
        title: 'Training',
        nutritionValues: [nutritionValue('PROTEIN', 100)],
        slotIds: [21],
      },
    ]);
    httpController.expectOne('http://localhost:3000/slot').flush([
      {
        id: 21,
        key: 'breakfast',
        title: 'Petit dejeuner',
        sortOrder: 1,
        nutritionValues: [nutritionValue('PROTEIN', 50)],
      },
    ]);
    httpController.expectOne('http://localhost:3000/cycle').flush([
      {
        id: 1,
        title: 'Seche',
        color: 'green',
        durationDays: 7,
        durationCount: 1,
        durationType: 'semaine',
        nutritionValues: [nutritionValue('PROTEIN', 180)],
        daySetOrder: [10],
      },
    ]);

    expect(component.daySets.length).toBe(1);
    expect(component.slots.length).toBe(1);
    expect(component.cycles.length).toBe(1);
    expect(component.daySets[0].title).toBe('Training');
    expect(component.slots[0].title).toBe('Petit dejeuner');
    expect(component.cycles[0].title).toBe('Seche');
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
