import {
  getSlotIdFromListItem,
  normalizeNutritionValues,
  toCreateSlotDto,
  toEditableSlotFormValue,
  toSlotListItems,
} from './slot.viewmodel';

describe('slot viewmodel', () => {
  it('should map slots and editable form values', () => {
    const slot = {
      id: 1,
      key: 'breakfast',
      title: 'Breakfast',
      sortOrder: 1,
      startTime: null,
      endTime: '09:00',
      nutritionValues: [],
    };
    expect(toSlotListItems([slot])).toEqual([
      jasmine.objectContaining({ id: '1', key: 'breakfast', startTime: null }),
    ]);
    expect(getSlotIdFromListItem({ id: '1' } as never)).toBe(1);
    expect(getSlotIdFromListItem({ id: 'bad' } as never)).toBeNull();
    expect(toEditableSlotFormValue(slot).nutritionValues?.length).toBe(3);
  });

  it('should normalize slot payloads and nutrition values', () => {
    expect(normalizeNutritionValues([
      { nutritionKey: ' protein ', amount: -2, unit: 'g', reference: 'PER_100G' },
      { nutritionKey: ' ', amount: Number.NaN, unit: 'g', reference: 'PER_100G' },
    ])).toEqual([
      { nutritionKey: 'PROTEIN', amount: 0, unit: 'g', reference: 'PER_100G' },
    ]);
    expect(toCreateSlotDto({
      key: ' breakfast ',
      title: 'Breakfast',
      sortOrder: Number.NaN,
      startTime: ' 08:00 ',
      endTime: ' ',
      nutritionValues: [],
    })).toEqual({
      key: 'breakfast',
      title: 'Breakfast',
      sortOrder: 0,
      startTime: '08:00',
      endTime: null,
      nutritionValues: [],
    });
  });
});
