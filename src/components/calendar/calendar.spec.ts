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
    }).compileComponents();

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

  it('should merge week summary details into the detailed day cards', () => {
    component.switchView('week');
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

    expect(fixture.nativeElement.querySelectorAll('.calendar-week-card').length).toBe(0);
    expect(textContent).toContain('Base');
    expect(textContent).toContain('Cibles day set');
    expect(textContent).toMatch(/1.?047/);
    expect(textContent).toContain('1 plages');
    expect(textContent).toContain('1 items');
  });

  it('should include occurredAt when an hour is clicked', () => {
    const emitted: Array<{ occurredAt: string | null }> = [];
    component.hourClick.subscribe((event) => emitted.push(event));

    component.switchView('day');
    fixture.detectChanges();

    component.onHourClick({ hour: 8, label: '08:00' });

    expect(emitted[0].occurredAt).toContain('T08:00:00');
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

    const trigger = fixture.nativeElement.querySelector('.calendar-inserted-item-day');
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

    expect(textContent).toContain(
      'Aucun day set actif. Les cibles du jour proviennent du cycle.',
    );
    expect(textContent).toContain('Cible du cycle');
    expect(textContent).toContain('150');
  });
});
