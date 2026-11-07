import { DateTime } from 'luxon';
import { createMockApiState, type MockApiState, type MockProduct, type MockTemplateItem } from './state';

type ProductSeed = {
  name: string;
  category: number;
  generic: string;
  size: number;
  price: number | null;
  macros: readonly [number, number, number, number];
  tags: number[];
  volume?: boolean;
  portion?: number;
  memo?: string;
};

// Fictional household data. Keep the small CRUD fixture in state.ts independent
// from this fuller scenario used by screen previews and visual comparisons.
const productSeeds: ProductSeed[] = [
  { name: 'Rolled oats', category: 4, generic: 'Oats', size: 1000, price: 2.3, macros: [370, 13, 60, 7], tags: [3, 5, 9], portion: 60 },
  { name: 'Greek yogurt — plain, 2% fat', category: 3, generic: 'Yogurt', size: 500, price: 2.65, macros: [73, 9.5, 4, 2], tags: [3, 4], portion: 200 },
  { name: 'Semi-skimmed milk', category: 3, generic: 'Milk', size: 1000, price: 1.2, macros: [47, 3.4, 4.8, 1.6], tags: [3], volume: true, portion: 250 },
  { name: 'Free-range eggs — box of 6', category: 2, generic: 'Eggs', size: 300, price: 2.6, macros: [143, 12.6, 0.7, 9.5], tags: [4, 7], portion: 50 },
  { name: 'Frozen blueberries', category: 1, generic: 'Berries', size: 450, price: 3.75, macros: [57, 0.7, 12, 0.3], tags: [3, 5, 6], portion: 80 },
  { name: 'Crunchy peanut butter — 100% peanuts', category: 6, generic: 'Nut butter', size: 350, price: 3.2, macros: [588, 25, 12, 50], tags: [3, 5, 9], portion: 20 },
  { name: 'Whole almonds', category: 6, generic: 'Nuts', size: 200, price: 3.4, macros: [579, 21, 10, 50], tags: [5, 8], portion: 30 },
  { name: 'Extra virgin olive oil', category: 6, generic: 'Cooking oil', size: 750, price: 8.9, macros: [824, 0, 0, 91.6], tags: [5, 9], volume: true, portion: 10 },
  { name: 'Broccoli florets', category: 5, generic: 'Broccoli', size: 500, price: 1.8, macros: [34, 2.8, 4, 0.4], tags: [5, 8], portion: 200 },
  { name: 'Sweet potatoes', category: 5, generic: 'Potatoes', size: 1000, price: 2.9, macros: [86, 1.6, 20, 0.1], tags: [5, 8], portion: 250 },
  { name: 'Atlantic salmon fillets — skin on', category: 2, generic: 'Fish', size: 300, price: 6.9, macros: [208, 20, 0, 13], tags: [4, 6], portion: 150 },
  { name: 'Tuna in spring water — drained', category: 2, generic: 'Fish', size: 140, price: 1.7, macros: [116, 26, 0, 1], tags: [4, 7, 9], portion: 140 },
  { name: 'Green lentils — dry', category: 7, generic: 'Lentils', size: 500, price: 1.85, macros: [352, 25, 60, 1.1], tags: [4, 5, 9], portion: 80 },
  { name: 'Chickpeas — cooked and drained', category: 7, generic: 'Chickpeas', size: 240, price: 0.95, macros: [139, 7, 19, 2.5], tags: [5, 7, 9], portion: 120 },
  { name: 'Whole-wheat pasta', category: 4, generic: 'Pasta', size: 500, price: 1.45, macros: [350, 13, 65, 2.5], tags: [2, 5, 9], portion: 100 },
  { name: 'Seeded wholegrain bread', category: 4, generic: 'Bread', size: 500, price: 2.4, macros: [250, 10, 40, 5], tags: [3, 5], portion: 40 },
  { name: 'Firm tofu — natural', category: 7, generic: 'Tofu', size: 400, price: 2.95, macros: [144, 15, 2, 8], tags: [4, 5, 8], portion: 150 },
  { name: 'Baby spinach', category: 5, generic: 'Leafy greens', size: 200, price: 1.6, macros: [23, 2.9, 1.4, 0.4], tags: [5, 8], portion: 100 },
  { name: 'Cherry tomatoes', category: 5, generic: 'Tomatoes', size: 250, price: 1.7, macros: [18, 0.9, 2.7, 0.2], tags: [5, 7], portion: 125 },
  { name: 'Avocado — ripe', category: 1, generic: 'Avocado', size: 150, price: 1.1, macros: [160, 2, 1.8, 15], tags: [5, 8], portion: 75 },
  { name: 'Gala apples', category: 1, generic: 'Apples', size: 180, price: 0.55, macros: [52, 0.3, 12, 0.2], tags: [1, 5, 7], portion: 180 },
  { name: 'Whey protein — vanilla', category: 9, generic: 'Protein powder', size: 1000, price: 24.9, macros: [390, 76, 8, 6], tags: [4, 7], portion: 30 },
  { name: 'Dark chocolate — 85% cocoa', category: 10, generic: 'Chocolate', size: 100, price: 1.8, macros: [600, 10, 19, 52], tags: [5], portion: 20 },
  { name: 'Orange juice — no added sugar', category: 8, generic: 'Juice', size: 1000, price: 2.2, macros: [45, 0.7, 10, 0.2], tags: [3], volume: true, portion: 200 },
  { name: 'Cottage cheese', category: 3, generic: 'Fresh cheese', size: 300, price: 1.95, macros: [98, 12, 3, 4], tags: [4, 7], portion: 150 },
  { name: 'Frozen Mediterranean vegetables', category: 5, generic: 'Mixed vegetables', size: 1000, price: 2.6, macros: [42, 2, 5, 1.2], tags: [2, 5, 6], portion: 250 },
  { name: 'Roasted red pepper hummus with extra virgin olive oil', category: 7, generic: 'Hummus', size: 200, price: 2.1, macros: [220, 6, 14, 15], tags: [5, 7], portion: 50, memo: 'Long product name for compact pickers. Finish within three days of opening.' },
  { name: 'Sparkling mineral water — 1.5 litre bottle', category: 8, generic: 'Water', size: 1500, price: null, macros: [0, 0, 0, 0], tags: [7], volume: true, memo: 'Nutrition and price have not been entered yet.' },
];

const targets = (protein: number, carbs: number, fat: number) => [
  { nutritionKey: 'ENERGY_KCAL', amount: protein * 4 + carbs * 4 + fat * 9, unit: 'KCAL', reference: 'PER_100G' as const },
  { nutritionKey: 'PROTEIN', amount: protein, unit: 'G', reference: 'PER_100G' as const },
  { nutritionKey: 'CARBOHYDRATE', amount: carbs, unit: 'G', reference: 'PER_100G' as const },
  { nutritionKey: 'FAT', amount: fat, unit: 'G', reference: 'PER_100G' as const },
];

export function createRealisticMockApiState(): MockApiState {
  const state = createMockApiState();
  state.profile = 'realistic';
  state.categories.push(...['Dairy & eggs', 'Grains & bread', 'Vegetables', 'Oils & nuts', 'Legumes & plant proteins', 'Drinks', 'Sports supplements', 'Snacks & treats'].map((name, i) => ({ id: i + 3, name, warnBeforeDays: 3, recentlyExpiredDays: 2, minQuantity: 1 })));
  state.tags.push(...['High protein', 'Plant based', 'Frozen', 'Quick meal', 'Gluten free', 'Pantry staple'].map((name, i) => ({ id: i + 4, name })));
  state.genericProducts.push({ id: 3, name: 'Rice', minQuantityUnit: 1, minQuantityUnitType: 'pack', minQuantityMetric: 500, minQuantityMetricType: 'g' });
  state.products[2].categoryId = 4;
  state.products[2].genericProductId = 3;
  state.nutritionKeys.push(...[
    ['SATURATED_FAT', 'Saturated fat'], ['SUGARS', 'Sugars'], ['FIBER', 'Fibre'], ['SALT', 'Salt'],
  ].map(([key, label]) => ({ key, value: key, label, allowedUnits: ['G', 'MG'] })));

  for (const [index, seed] of productSeeds.entries()) {
    const id = index + 4;
    let generic = state.genericProducts.find(item => item.name === seed.generic);
    if (!generic) {
      generic = { id: state.genericProducts.length + 1, name: seed.generic, minQuantityUnit: 1, minQuantityUnitType: 'pack', minQuantityMetric: seed.portion ?? 100, minQuantityMetricType: seed.volume ? 'ml' : 'g' };
      state.genericProducts.push(generic);
    }
    const reference = seed.volume ? 'PER_100ML' : 'PER_100G';
    const product: MockProduct = {
      id, name: seed.name, barcode: `200000${String(id).padStart(6, '0')}`,
      categoryId: seed.category, genericProductId: generic.id, tagIds: [...seed.tags],
      unitType: seed.volume ? 'Bouteille' : id === 7 ? 'Boite' : 'Paquet',
      quantityPerUnit: seed.size, quantityUnit: seed.volume ? 'ml' : 'g',
      portionCount: seed.portion && seed.size % seed.portion === 0 ? seed.size / seed.portion : null,
      portionUnit: seed.portion ? 'portion' : null, portionQuantityNormalized: seed.portion ?? null,
      price: seed.price, priceUnit: seed.price == null ? null : seed.volume ? 'bouteille' : 'paquet',
      url: null, memo: seed.memo ?? 'Fictional sample product; quantities describe the package before preparation.',
      nutritionValues: seed.price == null ? [] : ['ENERGY_KCAL', 'PROTEIN', 'CARBOHYDRATE', 'FAT'].map((nutritionKey, i) => ({ id: state.nextIds.nutritionValue++, nutritionKey, amount: seed.macros[i], unit: i === 0 ? 'KCAL' : 'G', reference })),
      priceHistory: [],
    };
    if (seed.price != null) {
      for (const [i, date] of ['2026-02-01', '2026-03-05', '2026-03-20'].entries()) {
        product.priceHistory.push({ id: state.nextIds.priceHistory++, price: Math.round(seed.price * [0.92, 1.04, 1][i] * 100) / 100, priceUnit: product.priceUnit!, effectiveFrom: `${date}T09:00:00+01:00`, effectiveTo: i < 2 ? `${['2026-03-05', '2026-03-20'][i]}T09:00:00+01:00` : null });
      }
    }
    state.products.push(product);
  }

  state.slots.push(
    { id: 4, key: 'afternoon-snack', title: 'Afternoon snack', sortOrder: 4, startTime: '15:30', endTime: '16:30', nutritionValues: targets(20, 30, 10) },
    { id: 5, key: 'post-workout', title: 'Post-workout', sortOrder: 5, startTime: '18:00', endTime: '18:30', nutritionValues: targets(30, 45, 5) },
    { id: 6, key: 'evening-snack', title: 'Evening snack', sortOrder: 6, startTime: '21:00', endTime: '21:30', nutritionValues: targets(20, 15, 10) },
  );
  state.slots[2].sortOrder = 6;
  state.slots[3].sortOrder = 3;
  state.slots[4].sortOrder = 4;
  state.slots[5].sortOrder = 7;

  let lineId = 1;
  const template = (id: number, title: string, lines: readonly (readonly [number, number, number])[]) => ({
    id, title, items: lines.map(([productId, qty, slotId]): MockTemplateItem => ({ id: lineId++, productId, qty, qtyUnit: state.products.find(p => p.id === productId)?.quantityUnit as 'g' | 'ml', slotId, slotKey: null })),
  });
  state.templates = [
    template(1, 'Recovery — balanced training day', [[4, 60, 1], [5, 200, 1], [8, 80, 1], [2, 150, 2], [3, 75, 2], [12, 200, 2], [11, 10, 2], [24, 180, 4], [10, 25, 4], [14, 150, 3], [13, 250, 3], [21, 100, 3]]),
    template(2, 'Lean bulk — high-volume training day', [[4, 100, 1], [6, 300, 1], [1, 120, 1], [9, 20, 1], [2, 200, 2], [3, 120, 2], [29, 250, 2], [11, 15, 2], [19, 120, 4], [7, 100, 4], [25, 30, 5], [27, 200, 5], [18, 120, 3], [15, 140, 3], [22, 200, 3], [5, 250, 6], [10, 30, 6]]),
    template(3, 'Cutting — protein-focused weekday', [[5, 250, 1], [8, 80, 1], [4, 40, 1], [2, 180, 2], [12, 250, 2], [3, 60, 2], [11, 10, 2], [28, 150, 4], [24, 180, 4], [20, 200, 3], [21, 150, 3], [13, 200, 3]]),
    template(4, 'Maintenance — quick office meals', [[19, 80, 1], [7, 100, 1], [23, 75, 1], [17, 160, 2], [22, 125, 2], [30, 50, 2], [24, 180, 4], [10, 30, 4], [18, 90, 3], [15, 140, 3], [29, 200, 3]]),
    template(5, 'Recovery — relaxed rest day', [[4, 50, 1], [6, 200, 1], [1, 120, 1], [16, 80, 2], [13, 200, 2], [21, 100, 2], [5, 200, 4], [26, 20, 4], [2, 150, 3], [29, 250, 3], [11, 10, 3]]),
    template(6, 'Plant based — batch-cooking day', [[4, 70, 1], [9, 20, 1], [1, 120, 1], [20, 180, 2], [3, 90, 2], [12, 200, 2], [30, 60, 4], [19, 80, 4], [16, 90, 3], [22, 200, 3], [21, 100, 3], [11, 15, 3]]),
  ];
  const daySet = (id: number, title: string, templateId: number, macros: readonly [number, number, number], slotIds = [1, 2, 4, 3]) => ({ id, title, nutritionValues: targets(...macros), slotIds, templateId });
  state.daySets = [
    daySet(1, 'Recovery — light training', 1, [140, 250, 70]),
    daySet(2, 'Recovery — full rest', 5, [130, 210, 75]),
    daySet(3, 'Bulking — heavy lifting', 2, [180, 380, 90], [1, 2, 4, 5, 3, 6]),
    daySet(4, 'Bulking — rest and refuel', 1, [170, 310, 85], [1, 2, 4, 3, 6]),
    daySet(5, 'Cutting — strength session', 3, [170, 200, 60]),
    daySet(6, 'Cutting — rest day', 3, [160, 160, 65]),
    daySet(7, 'Maintenance — office day', 4, [150, 260, 75]),
    daySet(8, 'Plant-based recovery', 6, [130, 280, 80]),
  ];
  const cycle = (id: number, title: string, color: string, order: number[], templateId: number, macros: readonly [number, number, number]) => ({ id, title, color, nutritionValues: targets(...macros), durationDays: order.length, durationCount: order.length, durationType: 'jour' as const, defaultTemplateId: templateId, daySetOrder: order });
  state.cycles = [
    cycle(1, 'Recovery & deload — 7 days', 'green', [1, 2, 1, 2, 1, 2, 2], 1, [140, 250, 70]),
    cycle(2, 'Lean bulk — hypertrophy block', 'blue', [3, 3, 4, 3, 3, 4, 4, 3, 3, 4, 3, 3, 4, 4], 2, [180, 380, 90]),
    cycle(3, 'Cutting — strength retention', 'orange', [5, 5, 6, 5, 5, 6, 6, 5, 5, 6, 5, 5, 6, 6], 3, [170, 200, 60]),
    cycle(4, 'Maintenance — busy workweek', 'purple', [7, 7, 7, 7, 7, 2, 2], 4, [150, 260, 75]),
    cycle(5, 'Plant-based recovery week', 'pink', [8, 8, 8, 2, 8, 8, 2], 6, [130, 280, 80]),
  ];
  state.cycleAssignments = [
    { id: 1, cycleId: 1, startDateLocal: '2026-03-23' },
    { id: 2, cycleId: 3, startDateLocal: '2026-01-26' },
    { id: 3, cycleId: 2, startDateLocal: '2026-02-09' },
    { id: 4, cycleId: 3, startDateLocal: '2026-02-23' },
    { id: 5, cycleId: 2, startDateLocal: '2026-03-09' },
    { id: 6, cycleId: 4, startDateLocal: '2026-03-30' },
    { id: 7, cycleId: 2, startDateLocal: '2026-04-06' },
    { id: 8, cycleId: 3, startDateLocal: '2026-04-20' },
    { id: 9, cycleId: 5, startDateLocal: '2026-05-04' },
  ];

  state.inventories = [{ id: 1, name: 'Home fridge' }, { id: 2, name: 'Pantry' }, { id: 3, name: 'Freezer — batch-cooked supplies' }, { id: 4, name: 'Office snack cupboard' }, { id: 5, name: 'Weekend travel bag' }];
  const stock: readonly (readonly [number, number, number])[] = [
    [1, 1, 720], [1, 2, 1200], [1, 5, 850], [1, 6, 650], [1, 7, 200], [1, 12, 350], [1, 14, 90], [1, 20, 300], [1, 21, 70], [1, 22, 200], [1, 23, 150], [1, 27, 400], [1, 28, 150], [1, 30, 60],
    [2, 3, 1850], [2, 4, 650], [2, 9, 180], [2, 10, 90], [2, 11, 420], [2, 13, 1400], [2, 15, 420], [2, 16, 420], [2, 17, 480], [2, 18, 700], [2, 19, 280], [2, 24, 720], [2, 25, 650], [2, 26, 60], [2, 31, 3000],
    [3, 2, 2000], [3, 8, 35], [3, 12, 600], [3, 14, 150], [3, 19, 400], [3, 29, 1700],
    [4, 4, 250], [4, 9, 100], [4, 10, 60], [4, 15, 140], [4, 24, 180], [4, 25, 150], [4, 26, 20], [4, 31, 1500],
  ];
  state.inventoryProducts = stock.map(([inventoryId, productId, qtyOnHandNormalized], i) => ({ id: i + 1, inventoryId, productId, qtyOnHandNormalized, qtyOnHandInUnits: Math.round(qtyOnHandNormalized / state.products.find(p => p.id === productId)!.quantityPerUnit * 10000) / 10000 }));

  // A varied six-week history fills charts and calendars without random data.
  state.inputDayItems = [];
  for (let offset = 0; offset < 45; offset++) {
    const date = DateTime.fromISO('2026-02-09', { zone: state.timezone }).plus({ days: offset });
    const lines: readonly (readonly [number, number, number, number, string])[] = [
      [4, 50 + offset % 4 * 10, 1, 2, '08:05'], [5, 200, 1, 1, '08:05'], [1, 120, 1, 1, '08:05'],
      [offset % 3 ? 2 : 20, 140 + offset % 3 * 20, 2, 1, '12:35'], [3, 65 + offset % 4 * 15, 2, 2, '12:35'], [12, 180, 2, 3, '12:35'],
      [24, 180, 4, 2, '16:00'], [10, 20 + offset % 3 * 5, 4, 4, '16:00'],
      [offset % 2 ? 18 : 16, 80 + offset % 3 * 10, 3, 2, '19:40'], [22, 125, 3, 1, '19:40'],
    ];
    for (const [productId, qty, slotId, inventoryId, time] of lines) {
      const occurredAt = DateTime.fromISO(`${date.toISODate()}T${time}`, { zone: state.timezone }).toISO()!;
      const id = state.inputDayItems.length + 1;
      state.inputDayItems.push({ id, dateLocal: date.toISODate()!, productId, inventoryId, qty, qtyUnit: 'g', qtyNormalized: qty, occurredAt, insertedAt: occurredAt, slotId, slotKey: state.slots.find(s => s.id === slotId)!.key, templateItemId: null, inventoryAllocations: [{ inventoryId, qtyNormalized: qty }] });
    }
  }
  state.manualTemplateOverrides = { '2026-03-18': 4 };
  state.templateConversions = [];
  const collections = {
    category: state.categories, tag: state.tags, genericProduct: state.genericProducts, product: state.products,
    slot: state.slots, daySet: state.daySets, cycle: state.cycles, cycleAssignment: state.cycleAssignments,
    template: state.templates, templateItem: state.templates.flatMap(t => t.items), inventory: state.inventories,
    inventoryProduct: state.inventoryProducts, inputDayItem: state.inputDayItems,
  };
  for (const [key, records] of Object.entries(collections)) state.nextIds[key] = Math.max(0, ...records.map(record => record.id)) + 1;
  return state;
}
