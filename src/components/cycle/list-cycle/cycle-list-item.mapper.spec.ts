import { buildCycleListItem } from './cycle-list-item.mapper';
import {
  Cycle,
  CycleNutritionValue,
} from '../../../interfaces/cycle.interface';
import { DaySet } from '../../../interfaces/day-set.interface';
import { Slot } from '../../../interfaces/slot.interface';

describe('buildCycleListItem', () => {
  it('should compute cycle macros from nutrition values', () => {
    const item = buildCycleListItem(
      createCycle({
        nutritionValues: [
          nutritionValue('PROTEIN', 180),
          nutritionValue('CARBOHYDRATE', 120),
          nutritionValue('FAT', 60),
        ],
      }),
    );

    expect(item.proteins).toBe(180);
    expect(item.carbs).toBe(120);
    expect(item.lipids).toBe(60);
    expect(item.energyKcal).toBe(1740);
  });

  it('should respect daySetOrder when resolving day sets', () => {
    const item = buildCycleListItem(
      createCycle({
        daySetOrder: [0, 2, 0, 1, 0, 0, 0],
        daySets: [
          createDaySet({
            id: 1,
            title: 'Repos',
            nutritionValues: [nutritionValue('PROTEIN', 90)],
          }),
          createDaySet({
            id: 2,
            title: 'Training',
            nutritionValues: [nutritionValue('PROTEIN', 110)],
          }),
        ],
      }),
    );

    expect(item.daySets.map((daySet) => daySet.id)).toEqual([2, 1]);
    expect(item.missingDayCount).toBe(5);
  });

  it('should reconstruct nested slots and their ratios', () => {
    const item = buildCycleListItem(
      createCycle({
        nutritionValues: [
          nutritionValue('PROTEIN', 180),
          nutritionValue('CARBOHYDRATE', 120),
          nutritionValue('FAT', 60),
        ],
        daySets: [
          createDaySet({
            id: 10,
            title: 'Training',
            nutritionValues: [
              nutritionValue('PROTEIN', 100),
              nutritionValue('CARBOHYDRATE', 90),
              nutritionValue('FAT', 30),
            ],
            slots: [
              createSlot({
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
              }),
            ],
          }),
        ],
      }),
    );

    expect(item.daySets[0].slots[0].title).toBe('Petit dejeuner');
    expect(item.daySets[0].slots[0].timeRange).toBe('08:00 - 09:00');
    expect(item.daySets[0].slotMetrics[0].percentage).toBe(50);
  });

  it('should convert milligrams to grams in slot totals', () => {
    const item = buildCycleListItem(
      createCycle({
        daySets: [
          createDaySet({
            id: 12,
            title: 'Shake day',
            nutritionValues: [nutritionValue('PROTEIN', 50)],
            slots: [
              createSlot({
                id: 41,
                key: 'shake',
                title: 'Shake',
                nutritionValues: [nutritionValue('PROTEIN', 25000, 'MG')],
              }),
            ],
          }),
        ],
      }),
    );

    expect(item.daySets[0].slots[0].totals.proteins).toBe(25);
    expect(item.daySets[0].slotTotals.proteins).toBe(25);
  });

  it('should use fallback day sets and slots when embedded relations are incomplete', () => {
    const item = buildCycleListItem(
      createCycle({
        daySetOrder: [30],
      }),
      {
        fallbackDaySets: [
          createDaySet({
            id: 30,
            title: 'Fallback day',
            nutritionValues: [
              nutritionValue('PROTEIN', 100),
              nutritionValue('CARBOHYDRATE', 80),
            ],
            slotIds: [51],
          }),
        ],
        fallbackSlots: [
          createSlot({
            id: 51,
            key: 'lunch',
            title: 'Dejeuner',
            sortOrder: 2,
            nutritionValues: [nutritionValue('PROTEIN', 40)],
          }),
        ],
      },
    );

    expect(item.daySets[0].title).toBe('Fallback day');
    expect(item.daySets[0].totals.proteins).toBe(100);
    expect(item.daySets[0].slots[0].title).toBe('Dejeuner');
    expect(item.daySets[0].slots[0].totals.proteins).toBe(40);
  });

  it('should compare the effective daily average to the cycle target when day sets are under target', () => {
    const item = buildCycleListItem(
      createCycle({
        durationDays: 7,
        nutritionValues: [
          nutritionValue('PROTEIN', 100),
          nutritionValue('CARBOHYDRATE', 80),
          nutritionValue('FAT', 40),
        ],
        daySets: [
          createDaySet({
            id: 1,
            nutritionValues: [
              nutritionValue('PROTEIN', 60),
              nutritionValue('CARBOHYDRATE', 60),
              nutritionValue('FAT', 20),
            ],
          }),
          createDaySet({
            id: 2,
            nutritionValues: [
              nutritionValue('PROTEIN', 80),
              nutritionValue('CARBOHYDRATE', 70),
              nutritionValue('FAT', 30),
            ],
          }),
          createDaySet({
            id: 3,
            nutritionValues: [
              nutritionValue('PROTEIN', 90),
              nutritionValue('CARBOHYDRATE', 75),
              nutritionValue('FAT', 35),
            ],
          }),
        ],
      }),
    );

    expect(item.missingDayCount).toBe(4);
    expect(item.daySetTotals).toEqual({
      energyKcal: 975,
      proteins: 90,
      carbs: 75,
      lipids: 35,
    });
    expect(
      item.daySetMetrics.every((metric) => metric.status !== 'over'),
    ).toBeTrue();
  });

  it('should detect overflow from the effective daily average when associated day sets exceed the target', () => {
    const item = buildCycleListItem(
      createCycle({
        durationDays: 7,
        nutritionValues: [
          nutritionValue('PROTEIN', 100),
          nutritionValue('CARBOHYDRATE', 80),
          nutritionValue('FAT', 40),
        ],
        daySets: [
          createDaySet({
            id: 1,
            nutritionValues: [
              nutritionValue('PROTEIN', 180),
              nutritionValue('CARBOHYDRATE', 120),
              nutritionValue('FAT', 60),
            ],
          }),
          createDaySet({
            id: 2,
            nutritionValues: [
              nutritionValue('PROTEIN', 190),
              nutritionValue('CARBOHYDRATE', 130),
              nutritionValue('FAT', 65),
            ],
          }),
          createDaySet({
            id: 3,
            nutritionValues: [
              nutritionValue('PROTEIN', 200),
              nutritionValue('CARBOHYDRATE', 140),
              nutritionValue('FAT', 70),
            ],
          }),
        ],
      }),
    );

    expect(item.missingDayCount).toBe(4);
    expect(item.daySetTotals.proteins).toBe(138.57);
    expect(
      item.daySetMetrics.find((metric) => metric.key === 'proteins')?.status,
    ).toBe('over');
    expect(item.hasDaySetOverflow).toBeTrue();
  });

  it('should fall back entirely to the cycle target when no day set is attached', () => {
    const item = buildCycleListItem(
      createCycle({
        durationDays: 5,
        nutritionValues: [
          nutritionValue('PROTEIN', 150),
          nutritionValue('CARBOHYDRATE', 130),
          nutritionValue('FAT', 55),
        ],
        daySets: [],
      }),
    );

    expect(item.missingDayCount).toBe(5);
    expect(item.daySetTotals).toEqual({
      energyKcal: 1615,
      proteins: 150,
      carbs: 130,
      lipids: 55,
    });
    expect(
      item.daySetMetrics.every((metric) => metric.status === 'exact'),
    ).toBeTrue();
  });

  it('should use explicit ENERGY_KCAL values from the backend', () => {
    const item = buildCycleListItem(
      createCycle({
        durationDays: 2,
        nutritionValues: [
          nutritionValue('ENERGY_KCAL', 2072, 'KCAL'),
          nutritionValue('PROTEIN', 126),
          nutritionValue('CARBOHYDRATE', 276),
          nutritionValue('FAT', 59),
        ],
        daySetOrder: [1, 0],
        daySets: [
          createDaySet({
            id: 1,
            nutritionValues: [
              nutritionValue('ENERGY_KCAL', 1800, 'KCAL'),
              nutritionValue('PROTEIN', 100),
              nutritionValue('CARBOHYDRATE', 200),
              nutritionValue('FAT', 50),
            ],
          }),
        ],
      }),
    );

    expect(item.energyKcal).toBe(2072);
    expect(item.daySets[0].totals.energyKcal).toBe(1800);
    expect(item.daySetTotals.energyKcal).toBe(1936);
  });

  it('should fill zero timeline days with cycle nutrition targets', () => {
    const item = buildCycleListItem(
      createCycle({
        durationDays: 30,
        nutritionValues: [
          nutritionValue('ENERGY_KCAL', 2072, 'KCAL'),
          nutritionValue('PROTEIN', 126),
          nutritionValue('CARBOHYDRATE', 276),
          nutritionValue('FAT', 59),
        ],
        daySetOrder: [0, 0, 0, 1],
        daySets: [
          createDaySet({
            id: 1,
            nutritionValues: [
              nutritionValue('ENERGY_KCAL', 2072, 'KCAL'),
              nutritionValue('PROTEIN', 126),
              nutritionValue('CARBOHYDRATE', 276),
              nutritionValue('FAT', 59),
            ],
          }),
        ],
      }),
    );

    expect(item.missingDayCount).toBe(29);
    expect(item.daySetTotals).toEqual({
      energyKcal: 2072,
      proteins: 126,
      carbs: 276,
      lipids: 59,
    });
  });

  it('should derive the secondary duration label from durationDays', () => {
    const weekItem = buildCycleListItem(
      createCycle({
        durationDays: 14,
        durationCount: 14,
        durationType: 'jour',
      }),
    );
    const monthItem = buildCycleListItem(
      createCycle({
        durationDays: 30,
        durationCount: 30,
        durationType: 'jour',
      }),
    );

    expect(weekItem.durationCount).toBe(2);
    expect(weekItem.durationType).toBe('semaine');
    expect(monthItem.durationCount).toBe(1);
    expect(monthItem.durationType).toBe('mois');
  });

});

function createCycle(overrides: Partial<Cycle> = {}): Cycle {
  return {
    id: 1,
    title: 'Cycle test',
    color: 'green',
    durationDays: 7,
    durationCount: 7,
    durationType: 'jour',
    nutritionValues: [],
    daySetOrder: [],
    daySets: [],
    ...overrides,
  };
}

function createDaySet(overrides: Partial<DaySet> = {}): DaySet {
  return { id: 1, title: 'Day set', nutritionValues: [], slotIds: [], slots: [], ...overrides };
}

function createSlot(overrides: Partial<Slot> = {}): Slot {
  return {
    id: 1,
    key: 'slot',
    title: 'Slot',
    sortOrder: 0,
    startTime: null,
    endTime: null,
    nutritionValues: [],
    ...overrides,
  };
}

function nutritionValue(nutritionKey: string, amount: number, unit = 'G'): CycleNutritionValue {
  return { nutritionKey, amount, unit, reference: 'PER_100G' };
}
