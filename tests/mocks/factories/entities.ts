import type {
  MockCategory,
  MockCycle,
  MockDaySet,
  MockGenericProduct,
  MockInventory,
  MockProduct,
  MockSlot,
  MockTag,
  MockTemplate,
} from '../state';

export function categoryFactory(overrides: Partial<MockCategory> = {}): MockCategory {
  return {
    id: 999,
    name: 'New category',
    warnBeforeDays: 2,
    recentlyExpiredDays: 3,
    minQuantity: 1,
    ...overrides,
  };
}

export function tagFactory(overrides: Partial<MockTag> = {}): MockTag {
  return {
    id: 999,
    name: 'New tag',
    ...overrides,
  };
}

export function genericProductFactory(
  overrides: Partial<MockGenericProduct> = {},
): MockGenericProduct {
  return {
    id: 999,
    name: 'Generic product',
    minQuantityUnit: 1,
    minQuantityUnitType: 'unit',
    minQuantityMetric: 100,
    minQuantityMetricType: 'g',
    ...overrides,
  };
}

export function productFactory(overrides: Partial<MockProduct> = {}): MockProduct {
  return {
    id: 999,
    name: 'New product',
    barcode: null,
    categoryId: null,
    tagIds: [],
    genericProductId: null,
    unitType: 'Unite',
    quantityPerUnit: 100,
    quantityUnit: 'g',
    portionCount: null,
    portionUnit: null,
    portionQuantityNormalized: null,
    price: null,
    priceUnit: null,
    url: null,
    memo: null,
    nutritionValues: [],
    priceHistory: [],
    ...overrides,
  };
}

export function slotFactory(overrides: Partial<MockSlot> = {}): MockSlot {
  return {
    id: 999,
    key: 'slot-test',
    title: 'Slot test',
    sortOrder: 99,
    startTime: '08:00',
    endTime: '09:00',
    nutritionValues: [],
    ...overrides,
  };
}

export function daySetFactory(overrides: Partial<MockDaySet> = {}): MockDaySet {
  return {
    id: 999,
    title: 'Day set test',
    nutritionValues: [],
    slotIds: [],
    templateId: null,
    ...overrides,
  };
}

export function cycleFactory(overrides: Partial<MockCycle> = {}): MockCycle {
  return {
    id: 999,
    title: 'Cycle test',
    color: 'bg-sky-500',
    nutritionValues: [],
    durationDays: 7,
    durationCount: 7,
    durationType: 'jour',
    defaultTemplateId: null,
    daySetOrder: [0, 0, 0, 0, 0, 0, 0],
    ...overrides,
  };
}

export function templateFactory(overrides: Partial<MockTemplate> = {}): MockTemplate {
  return {
    id: 999,
    title: 'Template test',
    items: [],
    ...overrides,
  };
}

export function inventoryFactory(overrides: Partial<MockInventory> = {}): MockInventory {
  return {
    id: 999,
    name: 'Inventory test',
    ...overrides,
  };
}
