import type { ProductPriceUnit } from '../../src/interfaces/statistics.interface';
import type { NutritionReference, CycleNutritionValue } from '../../src/interfaces/cycle.interface';
import type { ProductPriceUnit as ServiceProductPriceUnit } from '../../src/services/product-service';
import type { ProductQuantityInputUnit } from '../../src/interfaces/input-day.interface';

export type MockNutritionValue = {
  id: number;
  nutritionKey: string;
  amount: number;
  unit: string;
  reference: NutritionReference;
};

export type MockCategory = {
  id: number;
  name: string;
  warnBeforeDays: number;
  recentlyExpiredDays: number;
  minQuantity: number;
};

export type MockTag = {
  id: number;
  name: string;
};

export type MockGenericProduct = {
  id: number;
  name: string;
  minQuantityUnit: number;
  minQuantityUnitType: ProductQuantityInputUnit | null;
  minQuantityMetric: number;
  minQuantityMetricType: ProductQuantityInputUnit | null;
};

export type MockPriceVersion = {
  id: number;
  price: number;
  priceUnit: ProductPriceUnit | ServiceProductPriceUnit;
  effectiveFrom: string;
  effectiveTo: string | null;
};

export type MockProduct = {
  id: number;
  name: string;
  barcode: string | null;
  categoryId: number | null;
  tagIds: number[];
  genericProductId: number | null;
  unitType: string;
  quantityPerUnit: number;
  quantityUnit: string | null;
  portionCount: number | null;
  portionUnit: ProductQuantityInputUnit | null;
  portionQuantityNormalized: number | null;
  price: number | null;
  priceUnit: ProductPriceUnit | ServiceProductPriceUnit | null;
  url: string | null;
  memo: string | null;
  nutritionValues: MockNutritionValue[];
  priceHistory: MockPriceVersion[];
};

export type MockSlot = {
  id: number;
  key: string;
  title: string;
  sortOrder: number;
  startTime: string | null;
  endTime: string | null;
  nutritionValues: CycleNutritionValue[];
};

export type MockTemplateItem = {
  id: number;
  productId: number;
  qty: number;
  qtyUnit: ProductQuantityInputUnit | null;
  slotId: number | null;
  slotKey: string | null;
};

export type MockTemplate = {
  id: number;
  title: string;
  items: MockTemplateItem[];
};

export type MockDaySet = {
  id: number;
  title: string;
  nutritionValues: CycleNutritionValue[];
  slotIds: number[];
  templateId: number | null;
};

export type MockCycle = {
  id: number;
  title: string;
  color: string;
  nutritionValues: CycleNutritionValue[];
  durationDays: number;
  durationCount: number;
  durationType: 'jour' | 'semaine' | 'mois';
  defaultTemplateId: number | null;
  daySetOrder: number[];
};

export type MockCycleAssignment = {
  id: number;
  cycleId: number;
  startDateLocal: string;
};

export type MockInventory = {
  id: number;
  name: string;
};

export type MockInventoryProduct = {
  id: number;
  inventoryId: number;
  productId: number;
  qtyOnHandInUnits: number;
  qtyOnHandNormalized: number;
};

export type MockInputDayItem = {
  inventoryAllocations?: { inventoryId: number; qtyNormalized: number }[];
  id: number;
  dateLocal: string;
  productId: number;
  inventoryId: number | null;
  qty: number;
  qtyUnit: ProductQuantityInputUnit | null;
  qtyNormalized: number;
  occurredAt: string | null;
  insertedAt: string;
  slotId: number | null;
  slotKey: string | null;
  templateItemId: number | null;
};


export type MockTemplateConversion = {
  dateLocal: string;
  templateItemId: number;
  itemId: number;
};

export type MockQuantityUnitMeta = {
  key: string;
  value: string;
  label: string;
  dimension?: string;
  factor?: number;
};

export type MockNutritionKeyMeta = {
  key: string;
  value: string;
  label: string;
  allowedUnits: string[];
};

export type MockApiState = {
  profile?: 'minimal' | 'realistic';
  timezone: string;
  quantityUnits: MockQuantityUnitMeta[];
  nutritionKeys: MockNutritionKeyMeta[];
  categories: MockCategory[];
  tags: MockTag[];
  genericProducts: MockGenericProduct[];
  products: MockProduct[];
  slots: MockSlot[];
  templates: MockTemplate[];
  daySets: MockDaySet[];
  cycles: MockCycle[];
  cycleAssignments: MockCycleAssignment[];
  inventories: MockInventory[];
  inventoryProducts: MockInventoryProduct[];
  inputDayItems: MockInputDayItem[];
  manualTemplateOverrides: Record<string, number | null>;
  templateConversions: MockTemplateConversion[];
  nextIds: Record<string, number>;
};

function nutritionValue(
  id: number,
  nutritionKey: string,
  amount: number,
  unit = 'G',
  reference: NutritionReference = 'PER_100G',
): MockNutritionValue {
  return { id, nutritionKey, amount, unit, reference };
}

function macroValue(
  nutritionKey: string,
  amount: number,
  unit = 'G',
  reference: NutritionReference = 'PER_100G',
): CycleNutritionValue {
  return { nutritionKey, amount, unit, reference };
}

function priceHistory(
  id: number,
  price: number,
  priceUnit: ProductPriceUnit,
  effectiveFrom: string,
  effectiveTo: string | null = null,
): MockPriceVersion {
  return { id, price, priceUnit, effectiveFrom, effectiveTo };
}

export function createMockApiState(): MockApiState {
  return {
    profile: 'minimal',
    timezone: 'Europe/Paris',
    quantityUnits: [
      { key: 'MG', value: 'mg', label: 'Milligram (mg)', dimension: 'mass', factor: 0.001 },
      { key: 'G', value: 'g', label: 'Gram (g)', dimension: 'mass', factor: 1 },
      { key: 'KG', value: 'kg', label: 'Kilogram (kg)', dimension: 'mass', factor: 1000 },
      { key: 'ML', value: 'ml', label: 'Millilitre (ml)', dimension: 'volume', factor: 1 },
      { key: 'L', value: 'l', label: 'Litre (l)', dimension: 'volume', factor: 1000 },
      { key: 'UNIT', value: 'unit', label: 'Unit (unit)', dimension: 'count', factor: 1 },
      { key: 'PACK', value: 'pack', label: 'Pack (pack)', dimension: 'count', factor: 1 },
    ],
    nutritionKeys: [
      { key: 'ENERGY_KCAL', value: 'ENERGY_KCAL', label: 'Energy', allowedUnits: ['KCAL'] },
      { key: 'PROTEIN', value: 'PROTEIN', label: 'Protein', allowedUnits: ['G'] },
      { key: 'CARBOHYDRATE', value: 'CARBOHYDRATE', label: 'Carbohydrates', allowedUnits: ['G'] },
      { key: 'FAT', value: 'FAT', label: 'Fat', allowedUnits: ['G'] },
    ],
    categories: [
      { id: 1, name: 'Fruit', warnBeforeDays: 2, recentlyExpiredDays: 3, minQuantity: 2 },
      { id: 2, name: 'Protein', warnBeforeDays: 3, recentlyExpiredDays: 5, minQuantity: 1 },
    ],
    tags: [
      { id: 1, name: 'Organic' },
      { id: 2, name: 'Batch' },
      { id: 3, name: 'Breakfast' },
    ],
    genericProducts: [
      {
        id: 1,
        name: 'Banana',
        minQuantityUnit: 6,
        minQuantityUnitType: 'piece',
        minQuantityMetric: 900,
        minQuantityMetricType: 'g',
      },
      {
        id: 2,
        name: 'Chicken',
        minQuantityUnit: 1,
        minQuantityUnitType: 'pack',
        minQuantityMetric: 1000,
        minQuantityMetricType: 'g',
      },
    ],
    products: [
      {
        id: 1,
        name: 'Banana',
        barcode: '200000000001',
        categoryId: 1,
        tagIds: [1, 3],
        genericProductId: 1,
        unitType: 'Unite',
        quantityPerUnit: 120,
        quantityUnit: 'g',
        portionCount: 1,
        portionUnit: 'piece',
        portionQuantityNormalized: 120,
        price: 0.49,
        priceUnit: 'unite',
        url: null,
        memo: 'Reference fruit',
        nutritionValues: [
          nutritionValue(1, 'ENERGY_KCAL', 89, 'KCAL'),
          nutritionValue(2, 'PROTEIN', 1.1),
          nutritionValue(3, 'CARBOHYDRATE', 22.8),
          nutritionValue(4, 'FAT', 0.3),
        ],
        priceHistory: [
          priceHistory(1, 0.45, 'unite', '2026-02-01T09:00:00+01:00', '2026-03-10T08:00:00+01:00'),
          priceHistory(2, 0.49, 'unite', '2026-03-10T08:00:00+01:00'),
        ],
      },
      {
        id: 2,
        name: 'Chicken breast',
        barcode: '200000000002',
        categoryId: 2,
        tagIds: [2],
        genericProductId: 2,
        unitType: 'Paquet',
        quantityPerUnit: 500,
        quantityUnit: 'g',
        portionCount: 4,
        portionUnit: 'portion',
        portionQuantityNormalized: 125,
        price: 8.4,
        priceUnit: 'kg',
        url: null,
        memo: 'Batch protein',
        nutritionValues: [
          nutritionValue(5, 'ENERGY_KCAL', 165, 'KCAL'),
          nutritionValue(6, 'PROTEIN', 31),
          nutritionValue(7, 'CARBOHYDRATE', 0),
          nutritionValue(8, 'FAT', 3.6),
        ],
        priceHistory: [
          priceHistory(3, 7.9, 'kg', '2026-01-15T09:00:00+01:00', '2026-03-05T10:00:00+01:00'),
          priceHistory(4, 8.4, 'kg', '2026-03-05T10:00:00+01:00'),
        ],
      },
      {
        id: 3,
        name: 'Basmati rice',
        barcode: '200000000003',
        categoryId: null,
        tagIds: [2],
        genericProductId: null,
        unitType: 'Paquet',
        quantityPerUnit: 1000,
        quantityUnit: 'g',
        portionCount: 10,
        portionUnit: 'portion',
        portionQuantityNormalized: 100,
        price: 2.9,
        priceUnit: 'kg',
        url: null,
        memo: 'Dry',
        nutritionValues: [
          nutritionValue(9, 'ENERGY_KCAL', 360, 'KCAL'),
          nutritionValue(10, 'PROTEIN', 7),
          nutritionValue(11, 'CARBOHYDRATE', 78),
          nutritionValue(12, 'FAT', 0.6),
        ],
        priceHistory: [
          priceHistory(5, 2.5, 'kg', '2026-01-01T08:00:00+01:00', '2026-02-20T08:00:00+01:00'),
          priceHistory(6, 2.9, 'kg', '2026-02-20T08:00:00+01:00'),
        ],
      },
    ],
    slots: [
      {
        id: 1,
        key: 'breakfast',
        title: 'Breakfast',
        sortOrder: 1,
        startTime: '08:00',
        endTime: '09:00',
        nutritionValues: [
          macroValue('PROTEIN', 25),
          macroValue('CARBOHYDRATE', 60),
          macroValue('FAT', 15),
        ],
      },
      {
        id: 2,
        key: 'lunch',
        title: 'Lunch',
        sortOrder: 2,
        startTime: '12:00',
        endTime: '13:30',
        nutritionValues: [
          macroValue('PROTEIN', 40),
          macroValue('CARBOHYDRATE', 80),
          macroValue('FAT', 20),
        ],
      },
      {
        id: 3,
        key: 'dinner',
        title: 'Dinner',
        sortOrder: 3,
        startTime: '19:00',
        endTime: '20:30',
        nutritionValues: [
          macroValue('PROTEIN', 35),
          macroValue('CARBOHYDRATE', 70),
          macroValue('FAT', 18),
        ],
      },
    ],
    templates: [
      {
        id: 1,
        title: 'Training day',
        items: [
          { id: 1, productId: 1, qty: 1, qtyUnit: 'piece', slotId: 1, slotKey: null },
          { id: 2, productId: 2, qty: 1, qtyUnit: 'portion', slotId: 2, slotKey: null },
          { id: 3, productId: 3, qty: 100, qtyUnit: 'g', slotId: 2, slotKey: null },
        ],
      },
    ],
    daySets: [
      {
        id: 1,
        title: 'Training Day',
        nutritionValues: [
          macroValue('PROTEIN', 120),
          macroValue('CARBOHYDRATE', 260),
          macroValue('FAT', 53),
        ],
        slotIds: [1, 2, 3],
        templateId: 1,
      },
      {
        id: 2,
        title: 'Rest Day',
        nutritionValues: [
          macroValue('PROTEIN', 110),
          macroValue('CARBOHYDRATE', 180),
          macroValue('FAT', 60),
        ],
        slotIds: [1, 2, 3],
        templateId: null,
      },
    ],
    cycles: [
      {
        id: 1,
        title: 'Training cycle',
        color: 'bg-sky-500',
        nutritionValues: [
          macroValue('PROTEIN', 120),
          macroValue('CARBOHYDRATE', 260),
          macroValue('FAT', 53),
        ],
        durationDays: 7,
        durationCount: 7,
        durationType: 'jour',
        defaultTemplateId: null,
        daySetOrder: [1, 1, 2, 1, 1, 2, 0],
      },
    ],
    cycleAssignments: [
      { id: 1, cycleId: 1, startDateLocal: '2026-03-23' },
    ],
    inventories: [
      { id: 1, name: 'Home fridge' },
      { id: 2, name: 'Pantry' },
    ],
    inventoryProducts: [
      { id: 1, inventoryId: 1, productId: 1, qtyOnHandInUnits: 8, qtyOnHandNormalized: 960 },
      { id: 2, inventoryId: 1, productId: 2, qtyOnHandInUnits: 4, qtyOnHandNormalized: 2000 },
      { id: 3, inventoryId: 2, productId: 3, qtyOnHandInUnits: 2, qtyOnHandNormalized: 2000 },
    ],
    inputDayItems: [
      {
        id: 1,
        dateLocal: '2026-03-25',
        productId: 1,
        inventoryId: 1,
        qty: 1,
        qtyUnit: 'piece',
        qtyNormalized: 120,
        occurredAt: '2026-03-25T08:10:00+01:00',
        insertedAt: '2026-03-25T08:12:00+01:00',
        slotId: 1,
        slotKey: 'breakfast',
        templateItemId: null,
      },
      {
        id: 2,
        dateLocal: '2026-03-25',
        productId: 2,
        inventoryId: 1,
        qty: 1,
        qtyUnit: 'portion',
        qtyNormalized: 125,
        occurredAt: '2026-03-25T12:20:00+01:00',
        insertedAt: '2026-03-25T12:22:00+01:00',
        slotId: 2,
        slotKey: 'lunch',
        templateItemId: null,
      },
    ],
    manualTemplateOverrides: {},
    templateConversions: [],
    nextIds: {
      category: 3,
      tag: 4,
      genericProduct: 3,
      product: 4,
      nutritionValue: 13,
      slot: 4,
      daySet: 3,
      cycle: 2,
      cycleAssignment: 2,
      template: 2,
      templateItem: 4,
      inventory: 3,
      inventoryProduct: 4,
      inputDayItem: 3,
      priceHistory: 7,
    },
  };
}

export function cloneMockApiState(state: MockApiState): MockApiState {
  return structuredClone(state);
}
