import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DateTime } from 'luxon';

import { Calendar, CalendarDayClickEvent } from './calendar';

describe('Calendar', () => {
  let component: Calendar;
  let fixture: ComponentFixture<Calendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Calendar],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Calendar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function renderView(
    view: 'year' | 'month' | 'week' | 'day',
    anchorDateLocal: string,
  ): void {
    component.currentDate = DateTime.fromISO(anchorDateLocal) as typeof component.currentDate;
    fixture.componentRef.changeDetectorRef.markForCheck();
    component.switchView(view);
    fixture.componentRef.changeDetectorRef.markForCheck();
    fixture.detectChanges();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit manageItems from day view', () => {
    const emitted: Array<unknown> = [];
    component.manageItems.subscribe((event) => emitted.push(event));

    renderView('day', '2026-03-25');
    component.onManageItems(component.currentDate.toISODate() ?? '');

    expect((emitted[0] as { dateLocal: string }).dateLocal).toBe(component.currentDate.toISODate());
  });

  it('should emit manageItems from week view', () => {
    const emitted: Array<unknown> = [];
    component.manageItems.subscribe((event) => emitted.push(event));

    renderView('week', '2026-02-18');
    component.onManageItems(component.weekDays[0].date);

    expect((emitted[0] as { dateLocal: string }).dateLocal).toBe(component.weekDays[0].date);
  });

  it('should merge week summary details into the detailed day cards', () => {
    renderView('week', '2026-02-18');
    fixture.componentRef.setInput('inputWeekResponse', {
      startDateLocal: '2026-02-16',
      endDateLocal: '2026-02-22',
      timezone: 'UTC',
      days: [
        {
          dateLocal: '2026-02-16',
          timezone: 'UTC',
          assignment: {
            id: 5,
            cycleId: 2,
            cycleTitle: 'Prise de Masse',
            startDateLocal: '2026-02-16',
            endDateLocal: '2026-02-22',
            dayIndex: 1,
          },
          daySet: {
            id: 3,
            title: 'Base',
            nutritionValue: null,
            slots: [
              {
                slotId: 11,
                slotKey: 'morning',
                title: 'Matin',
                sortOrder: 1,
                startTime: '08:00:00',
                endTime: '12:00:00',
                nutritionValue: null,
              },
            ],
          },
          items: [
            {
              id: 44,
              productId: 8,
              productName: 'Skyr',
              inventoryId: 4,
              qty: 120,
              qtyUnit: 'g',
              qtyNormalized: 120,
              insertedAt: '2026-02-16T08:25:00Z',
              occurredAt: '2026-02-16T08:15:00Z',
              slotId: 11,
              slotKey: 'morning',
              nutritionValue: {},
            },
          ],
          totalsMacros: {
            bySlot: [],
            dayTotal: {
              energyKcal: 1047,
              proteins: 28.8,
              carbs: 146,
              lipids: 36.6,
            },
            targets: {
              energyKcal: 1900,
            },
            deltaToTargets: {
              energyKcal: -853,
            },
            incompleteNutritionKeys: [],
            targetSource: 'daySet',
          },
          itemsBySlot: [],
          slots: [],
        },
      ],
    });
    fixture.detectChanges();

    const textContent = fixture.nativeElement.textContent;
    const mobileMacros = fixture.nativeElement.querySelectorAll(
      '.calendar-week-mobile .calendar-week-macro',
    );
    const desktopMacros = fixture.nativeElement.querySelectorAll(
      '.calendar-week-grid .calendar-week-macro',
    );

    expect(fixture.nativeElement.querySelectorAll('.calendar-week-card').length).toBe(0);
    expect(mobileMacros.length).toBe(1);
    expect(desktopMacros.length).toBe(1);
    expect(textContent).toContain('Base');
    expect(textContent).toContain('Cibles day set');
    expect(textContent).toMatch(/1.?047/);
    expect(textContent).toMatch(/1.?900/);
    expect(textContent).toMatch(/55[,.]11%/);
    expect(textContent).toContain('1 plages');
    expect(textContent).toContain('1 items');
  });

  it('should render a modernized year view with summary cards and active months', () => {
    const currentDateLocal = '2026-03-15';

    fixture.componentRef.setInput('cycleAssignments', [
      {
        id: 11,
        cycle: {
          id: 3,
          title: 'Prise de Masse',
          color: 'blue',
          durationDays: 30,
          durationCount: 1,
          durationType: 'mois',
        },
        startDateLocal: '2026-03-14',
        endDateLocal: '2026-03-16',
      },
    ]);
    renderView('year', currentDateLocal);

    const root = fixture.nativeElement;
    const textContent = root.textContent;

    expect(root.querySelector('.calendar-year-panel')).toBeTruthy();
    expect(root.querySelector('.calendar-year-card--active')).toBeTruthy();
    expect(root.querySelector('.calendar-year-mini-day--assigned')).toBeTruthy();
    expect(textContent).toContain('Vue annee');
    expect(textContent).toContain('mois couverts');
    expect(textContent).toContain('jours planifies');
  });

  it('should switch to the clicked month from the year footer action', () => {
    renderView('year', '2026-03-15');

    const targetMonth = component.yearMonths.find((month) => month.month === 1);
    expect(targetMonth).toBeDefined();
    component.openMonthView(targetMonth!);
    fixture.detectChanges();

    expect(component.currentView).toBe('month');
    expect(component.currentDate.month).toBe(1);
    expect(component.currentDate.year).toBe(targetMonth!.year);
  });

  it('should emit the clicked day date from the year mini calendar', () => {
    const emitted: Array<CalendarDayClickEvent> = [];
    component.dayClick.subscribe((event) => emitted.push(event));

    renderView('year', '2026-03-15');

    const january = component.yearMonths.find((month) => month.month === 1);
    expect(january).toBeDefined();

    const targetDay = january!.days.find(
      (day) => day.isCurrentMonth && day.dayNumber === 14,
    );
    expect(targetDay).toBeDefined();
    component.onDayClick(targetDay!);

    expect(emitted.length).toBe(1);
    expect(emitted[0].view).toBe('year');
    expect(emitted[0].day.date).toBe(targetDay!.date);
    expect(emitted[0].day.dayNumber).toBe(14);
  });

  it('should render a modernized month view with summary and assignment cards', () => {
    const currentDateLocal = component.currentDate.toISODate() ?? '2026-03-13';

    fixture.componentRef.setInput('cycleAssignments', [
      {
        id: 11,
        cycle: {
          id: 3,
          title: 'Prise de Masse',
          color: 'blue',
          durationDays: 30,
          durationCount: 1,
          durationType: 'mois',
        },
        startDateLocal: currentDateLocal ?? '2026-03-13',
        endDateLocal: currentDateLocal ?? '2026-03-13',
      },
    ]);
    fixture.detectChanges();

    const root = fixture.nativeElement;
    const textContent = root.textContent;

    expect(root.querySelector('.calendar-month-panel')).toBeTruthy();
    expect(root.querySelector('.calendar-month-day__assignment')).toBeTruthy();
    expect(root.querySelector(`[data-testid="calendar-month-open-day-${currentDateLocal}"]`)).toBeTruthy();
    expect(root.querySelector(`[data-testid="calendar-month-manage-cycle-${currentDateLocal}"]`)).toBeTruthy();
    expect(root.querySelector(`[data-testid="calendar-month-manage-items-${currentDateLocal}"]`)).toBeTruthy();
    expect(root.querySelector(`[data-testid="calendar-month-add-${currentDateLocal}"]`)).toBeNull();
    expect(textContent).toContain('Vue mois');
    expect(textContent).toContain('Prise de Masse');
    expect(textContent).toContain('jours planifies');
  });

  it('should emit openDayView requests from the month card and Jour button', () => {
    const currentDateLocal = component.currentDate.toISODate() ?? '2026-03-13';
    const emitted: Array<{ dateLocal: string }> = [];
    component.openDayViewRequested.subscribe((event) => emitted.push(event));
    fixture.detectChanges();

    const root = fixture.nativeElement;
    const monthDay = root.querySelector(`[data-testid="calendar-month-day-${currentDateLocal}"]`) as HTMLButtonElement | null;
    const dayButton = root.querySelector(`[data-testid="calendar-month-open-day-${currentDateLocal}"]`) as HTMLButtonElement | null;

    expect(monthDay).toBeTruthy();
    expect(dayButton).toBeTruthy();

    monthDay!.click();
    dayButton!.click();

    expect(emitted).toEqual([
      { dateLocal: currentDateLocal },
      { dateLocal: currentDateLocal },
    ]);
  });

  it('should emit manageAssignment with the source assignment from the month cycle button', () => {
    const currentDateLocal = component.currentDate.toISODate() ?? '2026-03-13';
    const emitted: Array<unknown> = [];
    component.manageAssignmentRequested.subscribe((event) => emitted.push(event));
    fixture.componentRef.setInput('cycleAssignments', [
      {
        id: 11,
        cycle: {
          id: 3,
          title: 'Prise de Masse',
          color: 'blue',
          durationDays: 30,
          durationCount: 1,
          durationType: 'mois',
        },
        startDateLocal: currentDateLocal,
        endDateLocal: currentDateLocal,
      },
    ]);
    fixture.detectChanges();

    const cycleButton = fixture.nativeElement.querySelector(
      `[data-testid="calendar-month-manage-cycle-${currentDateLocal}"]`,
    ) as HTMLButtonElement | null;

    expect(cycleButton).toBeTruthy();

    cycleButton!.click();

    expect(emitted).toEqual([
      jasmine.objectContaining({
        view: 'month',
        dateLocal: currentDateLocal,
        sourceAssignment: jasmine.objectContaining({
          id: 11,
        }),
      }),
    ]);
  });

  it('should switch to day view when openDayView is called directly', () => {
    const emitted: Array<unknown> = [];
    component.viewChanged.subscribe((event) => emitted.push(event));

    component.openDayView('2026-02-14');

    expect(component.currentView).toBe('day');
    expect(component.currentDate.toISODate()).toBe('2026-02-14');
    expect(emitted).toEqual([
      {
        view: 'day',
        anchorDateLocal: '2026-02-14',
        fromDateLocal: '2026-02-14',
        toDateLocal: '2026-02-14',
      },
    ]);
  });

  it('should render compact month alert badges instead of macro cards', () => {
    component.currentDate = component.currentDate.set({ year: 2026, month: 2, day: 14 });
    component.loadView();
    fixture.componentRef.setInput('inputMonthResponse', {
      startDateLocal: '2026-02-01',
      endDateLocal: '2026-02-28',
      timezone: 'UTC',
      days: [
        {
          dateLocal: '2026-02-14',
          timezone: 'UTC',
          assignment: {
            id: 5,
            cycleId: 2,
            cycleTitle: 'Seche',
            startDateLocal: '2026-02-10',
            endDateLocal: '2026-02-16',
            dayIndex: 5,
          },
          daySet: {
            id: 1,
            title: 'Training',
            nutritionValue: {
              energyKcal: 2200,
              proteins: 180,
              carbs: 140,
              lipids: 70,
            },
            slots: [],
          },
          templateAssociation: {
            source: 'manual',
            template: {
              id: 12,
              title: 'Plan proteine',
            },
          },
          templateItems: [
            {
              id: 91,
              productId: 8,
              productName: 'Skyr',
              qty: 1,
              qtyUnit: 'portion',
              qtyNormalized: 150,
              slotId: null,
              slotKey: null,
              status: 'pending',
              convertedItemId: null,
              stockAvailability: {
                enoughStock: true,
                totalAvailableNormalized: 300,
                requestedQtyNormalized: 150,
              },
              stockByInventory: [],
              nutritionValue: {},
            },
            {
              id: 92,
              productId: 9,
              productName: 'Amandes',
              qty: 1,
              qtyUnit: 'portion',
              qtyNormalized: 25,
              slotId: null,
              slotKey: null,
              status: 'pending',
              convertedItemId: null,
              stockAvailability: {
                enoughStock: true,
                totalAvailableNormalized: 50,
                requestedQtyNormalized: 25,
              },
              stockByInventory: [],
              nutritionValue: {},
            },
          ],
          items: [],
          totalsMacros: {
            bySlot: [],
            dayTotal: {
              energyKcal: 2300,
              proteins: 162,
              carbs: 154,
              lipids: 70,
            },
            targets: {
              energyKcal: 2200,
              proteins: 180,
              carbs: 140,
              lipids: 70,
            },
            deltaToTargets: {
              energyKcal: 100,
              proteins: -18,
              carbs: 14,
              lipids: 0,
            },
            incompleteNutritionKeys: [],
            targetSource: 'daySet',
          },
          projectedTotalsMacros: {
            bySlot: [],
            dayTotal: {
              energyKcal: 2420,
              proteins: 190,
              carbs: 154,
              lipids: 82,
            },
            targets: {
              energyKcal: 2200,
              proteins: 180,
              carbs: 140,
              lipids: 70,
            },
            deltaToTargets: {
              energyKcal: 220,
              proteins: 10,
              carbs: 14,
              lipids: 12,
            },
            incompleteNutritionKeys: [],
            targetSource: 'daySet',
          },
          itemsBySlot: [],
          slots: [],
        },
      ],
    });
    fixture.detectChanges();

    const root = fixture.nativeElement;
    const textContent = root.textContent;

    expect(root.querySelectorAll('.calendar-month-day__assignment-macro-card').length).toBe(0);
    expect(root.querySelectorAll('.calendar-month-day__alert-badge').length).toBe(5);
    expect(textContent).toContain('Training');
    expect(textContent).toContain('Kcal depasse');
    expect(textContent).toContain('G depasse');
    expect(textContent).toContain('P projete depasse');
    expect(textContent).toContain('L projete depasse');
    expect(textContent).toContain('2 templates en attente');
    expect(textContent).not.toContain('Effectif');
    expect(textContent).not.toContain('Effectif + template');
    expect(textContent).not.toContain('Kcal projete depasse');
  });

  it('should render a modernized day view with merged pilot summary and compact entries', () => {
    fixture.componentRef.setInput('inputDayResponse', {
      dateLocal: '2026-02-17',
      timezone: 'UTC',
      assignment: {
        id: 8,
        cycleId: 2,
        cycleTitle: 'Seche',
        startDateLocal: '2026-02-16',
        endDateLocal: '2026-02-22',
        dayIndex: 2,
      },
      daySet: {
        id: 1,
        title: 'Jour standard',
        nutritionValue: null,
        slots: [
          {
            slotId: 11,
            slotKey: 'breakfast',
            title: 'Petit dejeuner',
            sortOrder: 1,
            startTime: '08:00:00',
            endTime: '09:00:00',
            nutritionValue: null,
          },
        ],
      },
      templateAssociation: {
        source: 'manual',
        template: {
          id: 13,
          title: 'Plan proteine',
        },
      },
      items: [
        {
          id: 44,
          productId: 8,
          productName: 'Skyr',
          inventoryId: 4,
          qty: 120,
          qtyUnit: 'g',
          qtyNormalized: 120,
          insertedAt: '2026-02-17T08:25:00Z',
          occurredAt: '2026-02-17T08:15:00Z',
          slotId: 11,
          slotKey: 'breakfast',
          nutritionValue: {},
        },
      ],
      totalsMacros: {
        bySlot: [],
        dayTotal: {
          energyKcal: 420,
          proteins: 30,
          carbs: 18,
          lipids: 9,
        },
        targets: {
          proteins: 150,
        },
        deltaToTargets: {
          proteins: -120,
        },
        incompleteNutritionKeys: [],
        targetSource: 'daySet',
      },
      projectedTotalsMacros: {
        bySlot: [],
        dayTotal: {
          energyKcal: 620,
          proteins: 42,
          carbs: 28,
          lipids: 16,
        },
        targets: {
          proteins: 150,
        },
        deltaToTargets: {
          proteins: -108,
        },
        incompleteNutritionKeys: [],
        targetSource: 'daySet',
      },
      itemsBySlot: [],
      slots: [],
    });
    component.switchView('day');
    fixture.detectChanges();

    const root = fixture.nativeElement;
    const textContent = root.textContent;

    expect(root.querySelector('.calendar-day-panel')).toBeTruthy();
    expect(root.querySelector('.calendar-day-summary__assignment')).toBeTruthy();
    expect(root.querySelector('.calendar-day-summary__panel--pilot')).toBeTruthy();
    expect(root.querySelector('.calendar-day-grid__timeline')).toBeTruthy();
    expect(root.querySelectorAll('.calendar-day-entry').length).toBe(1);
    expect(root.querySelectorAll('.calendar-day-grid__block').length).toBe(1);
    expect(root.querySelectorAll('.calendar-day-grid__half-hour-cell').length).toBe(48);
    expect(textContent).toContain('Vue jour');
    expect(textContent).toContain('Pilotage du jour');
    expect(textContent).toContain('Cible du jour issue du day set');
    expect(textContent).toContain('Heures du jour');
    expect(textContent).toContain('Entrees du jour');
    expect(textContent).toContain('Clic a la demi-heure');
    expect(textContent).toContain('Jour standard');
    expect(textContent).toContain('Saisi');
    expect(textContent).toContain('Cible');
    expect(textContent).toContain('Ecart');
    expect(textContent).not.toContain('Effectif + template / day-set');
    expect(textContent).not.toContain('Template manuel');
    expect(textContent).not.toContain('Plan proteine');
  });

  it('should include occurredAt when a half-hour slot is clicked', () => {
    const emitted: Array<{ occurredAt: string | null }> = [];
    component.hourClick.subscribe((event) => emitted.push(event));

    component.switchView('day');
    fixture.detectChanges();

    component.onDayHalfHourClick(8, 30);

    expect(emitted[0].occurredAt).toContain('T08:30:00');
  });

  it('should emit itemClick without bubbling to hourClick', () => {
    const itemEvents: Array<unknown> = [];
    const hourEvents: Array<unknown> = [];
    component.itemClick.subscribe((event) => itemEvents.push(event));
    component.hourClick.subscribe((event) => hourEvents.push(event));

    fixture.componentRef.setInput('inputDayResponse', {
      dateLocal: '2026-02-16',
      timezone: 'UTC',
      assignment: null,
      daySet: {
        id: 1,
        title: 'Jour standard',
        nutritionValue: null,
        slots: [
          {
            slotId: 11,
            slotKey: 'breakfast',
            title: 'Petit dejeuner',
            sortOrder: 1,
            startTime: '08:00:00',
            endTime: '09:00:00',
            nutritionValue: null,
          },
        ],
      },
      items: [
        {
          id: 44,
          productId: 8,
          productName: 'Skyr',
          inventoryId: 4,
          qty: 120,
          qtyUnit: 'g',
          qtyNormalized: 120,
          insertedAt: '2026-02-16T08:25:00Z',
          occurredAt: '2026-02-16T08:15:00Z',
          slotId: 11,
          slotKey: 'breakfast',
          nutritionValue: {},
        },
      ],
      totalsMacros: null,
      itemsBySlot: [],
      slots: [],
    });
    component.switchView('day');
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.calendar-day-entry');
    trigger.click();

    expect(itemEvents.length).toBe(1);
    expect((itemEvents[0] as { item: { id: number } }).item.id).toBe(44);
    expect(hourEvents.length).toBe(0);
  });

  it('should show cycle target fallback when no day set is active', () => {
    component.switchView('day');
    fixture.componentRef.setInput('inputDayResponse', {
      dateLocal: '2026-02-17',
      timezone: 'UTC',
      assignment: {
        id: 5,
        cycleId: 2,
        cycleTitle: 'Seche',
        startDateLocal: '2026-02-16',
        endDateLocal: '2026-02-22',
        dayIndex: 1,
      },
      daySet: null,
      items: [],
      totalsMacros: {
        bySlot: [],
        dayTotal: {
          proteins: 0,
        },
        targets: {
          proteins: 150,
        },
        deltaToTargets: {
          proteins: -150,
        },
        incompleteNutritionKeys: [],
        targetSource: 'cycle',
      },
      itemsBySlot: [],
      slots: [],
    });
    fixture.detectChanges();

    const textContent = fixture.nativeElement.textContent;

    expect(textContent).toContain('Cible du jour issue du cycle assigne');
    expect(textContent).toContain('Les entrees saisies sont comparees a la cible du cycle Seche.');
    expect(textContent).toContain('Cible cycle assigne');
    expect(textContent).toContain('150');
  });
});
