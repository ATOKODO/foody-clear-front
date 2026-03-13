import { buildCycleListItem } from './cycle-list-item.mapper';
import { Cycle, CycleNutritionValue } from '../../../interfaces/cycle.interface';
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
  });

  it('should respect daySetOrder when resolving day sets', () => {
    const item = buildCycleListItem(
      createCycle({
        daySetOrder: [2, 1],
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
    return {
      id: 1,
      title: 'Day set',
      nutritionValues: [],
      slotIds: [],
      slots: [],
      ...overrides,
    };
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

  function nutritionValue(
    nutritionKey: string,
    amount: number,
    unit = 'G',
  ): CycleNutritionValue {
    return {
      nutritionKey,
      amount,
      unit,
      reference: 'PER_100G',
    };
  }
});
