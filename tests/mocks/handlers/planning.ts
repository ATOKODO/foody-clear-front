import type { MockApiRequestContext } from '../shared';
import type { CycleNutritionValue } from '../../../src/interfaces/cycle.interface';
import {
  buildTemplateResponse,
  getCycle,
  getDaySet,
  getSlot,
  getTemplate,
  hydrateCycle,
  hydrateCycleAssignment,
  hydrateDaySet,
  hydrateSlot,
  removeArrayItem,
} from '../shared';
import type { MockCycle, MockCycleAssignment, MockDaySet, MockSlot, MockTemplate } from '../state';

export async function handlePlanningRequest(context: MockApiRequestContext): Promise<boolean> {
  const handlers = [
    handleSlotCollectionRequest,
    handleSlotRequest,
    handleDaySetCollectionRequest,
    handleDaySetRequest,
    handleCycleCollectionRequest,
    handleCycleRequest,
    handleTemplateCollectionRequest,
    handleTemplateRequest,
    handleTemplateItemsRequest,
    handleTemplateItemRequest,
    handleCycleAssignmentCollectionRequest,
    handleCycleAssignmentRequest,
  ];

  for (const handler of handlers) {
    if (await handler(context)) {
      return true;
    }
  }

  return false;
}

async function handleSlotCollectionRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path } = context;
  const { state } = context;
  const method = context.request.method();
  if (path === '/slot') {
    if (method === 'GET') {
      await context.json(state.slots.map(hydrateSlot));
      return true;
    }

    if (method === 'POST') {
      const body = await context.readJson<Record<string, unknown>>();
      const slot: MockSlot = {
        id: context.nextId('slot'),
        key: readNullableString(body.key) ?? '',
        title: readNullableString(body.title) ?? '',
        sortOrder: Number(body.sortOrder ?? 0),
        startTime: readNullableString(body.startTime),
        endTime: readNullableString(body.endTime),
        nutritionValues: Array.isArray(body.nutritionValues)
          ? body.nutritionValues.map(toCycleNutritionValue).filter(isCycleNutritionValue)
          : [],
      };
      state.slots.push(slot);
      await context.json(hydrateSlot(slot), 201);
      return true;
    }
  }
  return false;
}

async function handleSlotRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path } = context;
  const { state } = context;
  const method = context.request.method();
  if (path.startsWith('/slot/')) {
    const slotId = Number(path.split('/')[2]);
    const slot = getSlot(state, slotId);
    if (!slot) {
      await context.notFound('Slot not found');
      return true;
    }

    if (method === 'GET') {
      await context.json(hydrateSlot(slot));
      return true;
    }

    if (method === 'PATCH') {
      const body = await context.readJson<Record<string, unknown>>();
      slot.key = readNullableString(body.key) ?? slot.key;
      slot.title = readNullableString(body.title) ?? slot.title;
      slot.sortOrder = Number(body.sortOrder ?? slot.sortOrder);
      slot.startTime = readFallbackString(body.startTime, slot.startTime);
      slot.endTime = readFallbackString(body.endTime, slot.endTime);
      if (Array.isArray(body.nutritionValues)) {
        slot.nutritionValues = body.nutritionValues
          .map(toCycleNutritionValue)
          .filter((value): value is NonNullable<ReturnType<typeof toCycleNutritionValue>> => value !== null);
      }
      await context.json(hydrateSlot(slot));
      return true;
    }

    if (method === 'DELETE') {
      state.slots = removeArrayItem(state.slots, slotId);
      state.daySets.forEach((daySet) => {
        daySet.slotIds = daySet.slotIds.filter((candidate) => candidate !== slotId);
      });
      await context.noContent();
      return true;
    }
  }
  return false;
}

async function handleDaySetCollectionRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path } = context;
  const { state } = context;
  const method = context.request.method();
  if (path === '/day-set') {
    if (method === 'GET') {
      await context.json(state.daySets.map((daySet) => hydrateDaySet(state, daySet)));
      return true;
    }

    if (method === 'POST') {
      const body = await context.readJson<Record<string, unknown>>();
      const daySet: MockDaySet = {
        id: context.nextId('daySet'),
        title: readNullableString(body.title) ?? '',
        nutritionValues: Array.isArray(body.nutritionValues)
          ? body.nutritionValues.map(toCycleNutritionValue).filter(isCycleNutritionValue)
          : [],
        slotIds: Array.isArray(body.slotIds)
          ? body.slotIds.map(Number).filter((value) => Number.isInteger(value) && value > 0)
          : [],
        templateId: readNullableNumber(body.templateId),
      };
      state.daySets.push(daySet);
      await context.json(hydrateDaySet(state, daySet), 201);
      return true;
    }
  }
  return false;
}

async function handleDaySetRequest(context: MockApiRequestContext): Promise<boolean> {
  if (!context.path.startsWith('/day-set/')) {
    return false;
  }

  const daySet = getDaySet(context.state, Number(context.path.split('/')[2]));
  if (!daySet) {
    await context.notFound('Day set not found');
    return true;
  }

  const handler = daySetRequestHandlers(context, daySet)[context.request.method()];
  if (!handler) {
    return false;
  }

  await handler();
  return true;
}

function daySetRequestHandlers(
  context: MockApiRequestContext,
  daySet: MockDaySet,
): Record<string, () => Promise<void>> {
  return {
    GET: () => context.json(hydrateDaySet(context.state, daySet)),
    PATCH: () => patchDaySet(context, daySet),
    DELETE: () => deleteDaySet(context, daySet),
  };
}

async function patchDaySet(context: MockApiRequestContext, daySet: MockDaySet): Promise<void> {
  const body = await context.readJson<Record<string, unknown>>();
  daySet.title = readNullableString(body.title) ?? daySet.title;
  if (Array.isArray(body.nutritionValues)) {
    daySet.nutritionValues = body.nutritionValues
      .map(toCycleNutritionValue)
      .filter((value): value is NonNullable<ReturnType<typeof toCycleNutritionValue>> => value !== null);
  }
  if (Array.isArray(body.slotIds)) {
    daySet.slotIds = body.slotIds.map(Number).filter((value) => Number.isInteger(value) && value > 0);
  }
  if ('templateId' in body) {
    daySet.templateId = readNullableNumber(body.templateId);
  }
  await context.json(hydrateDaySet(context.state, daySet));
}

async function deleteDaySet(context: MockApiRequestContext, daySet: MockDaySet): Promise<void> {
  context.state.daySets = removeArrayItem(context.state.daySets, daySet.id);
  context.state.cycles.forEach((cycle) => {
    cycle.daySetOrder = cycle.daySetOrder.map((candidate) => (candidate === daySet.id ? 0 : candidate));
  });
  await context.noContent();
}

async function handleCycleCollectionRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path } = context;
  const { state } = context;
  const method = context.request.method();
  if (path === '/cycle') {
    if (method === 'GET') {
      await context.json(state.cycles.map((cycle) => hydrateCycle(state, cycle)));
      return true;
    }

    if (method === 'POST') {
      const body = await context.readJson<Record<string, unknown>>();
      const cycle: MockCycle = {
        id: context.nextId('cycle'),
        title: readNullableString(body.title) ?? '',
        color: readNullableString(body.color) ?? 'bg-sky-500',
        nutritionValues: Array.isArray(body.nutritionValues)
          ? body.nutritionValues.map(toCycleNutritionValue).filter(isCycleNutritionValue)
          : [],
        durationDays: Number(body.durationDays ?? 1),
        durationCount: Number(body.durationCount ?? body.durationDays ?? 1),
        durationType: (readNullableString(body.durationType) ?? 'jour') as MockCycle['durationType'],
        defaultTemplateId: readNullableNumber(body.defaultTemplateId),
        daySetOrder: normalizeTimeline(body.daySetOrder, Number(body.durationDays ?? 1)),
      };
      state.cycles.push(cycle);
      await context.json(hydrateCycle(state, cycle), 201);
      return true;
    }
  }
  return false;
}

async function handleCycleRequest(context: MockApiRequestContext): Promise<boolean> {
  if (!context.path.startsWith('/cycle/')) {
    return false;
  }

  const cycle = getCycle(context.state, Number(context.path.split('/')[2]));
  if (!cycle) {
    await context.notFound('Cycle not found');
    return true;
  }

  const handler = cycleRequestHandlers(context, cycle)[context.request.method()];
  if (!handler) {
    return false;
  }

  await handler();
  return true;
}

function cycleRequestHandlers(
  context: MockApiRequestContext,
  cycle: MockCycle,
): Record<string, () => Promise<void>> {
  return {
    GET: () => context.json(hydrateCycle(context.state, cycle)),
    PATCH: () => patchCycle(context, cycle),
    DELETE: () => deleteCycle(context, cycle),
  };
}

async function patchCycle(context: MockApiRequestContext, cycle: MockCycle): Promise<void> {
  const body = await context.readJson<Record<string, unknown>>();
  cycle.title = readNullableString(body.title) ?? cycle.title;
  cycle.color = readNullableString(body.color) ?? cycle.color;
  cycle.durationDays = Number(body.durationDays ?? cycle.durationDays);
  cycle.durationCount = Number(body.durationCount ?? cycle.durationCount);
  cycle.durationType = (readNullableString(body.durationType) ?? cycle.durationType) as MockCycle['durationType'];
  if ('defaultTemplateId' in body) {
    cycle.defaultTemplateId = readNullableNumber(body.defaultTemplateId);
  }
  if (Array.isArray(body.nutritionValues)) {
    cycle.nutritionValues = body.nutritionValues
      .map(toCycleNutritionValue)
      .filter((value): value is NonNullable<ReturnType<typeof toCycleNutritionValue>> => value !== null);
  }
  if (Array.isArray(body.daySetOrder)) {
    cycle.daySetOrder = normalizeTimeline(body.daySetOrder, cycle.durationDays);
  }
  await context.json(hydrateCycle(context.state, cycle));
}

async function deleteCycle(context: MockApiRequestContext, cycle: MockCycle): Promise<void> {
  context.state.cycles = removeArrayItem(context.state.cycles, cycle.id);
  context.state.cycleAssignments = context.state.cycleAssignments.filter(
    (assignment) => assignment.cycleId !== cycle.id,
  );
  await context.noContent();
}
  }
  return false;
}

async function handleTemplateCollectionRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path } = context;
  const { state } = context;
  const method = context.request.method();
  if (path === '/template') {
    if (method === 'GET') {
      await context.json(state.templates.map((template) => buildTemplateResponse(state, template)));
      return true;
    }

    if (method === 'POST') {
      const body = await context.readJson<Record<string, unknown>>();
      const template: MockTemplate = {
        id: context.nextId('template'),
        title: readNullableString(body.title) ?? '',
        items: [],
      };
      state.templates.push(template);
      await context.json(buildTemplateResponse(state, template), 201);
      return true;
    }
  }
  return false;
}

async function handleTemplateRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path } = context;
  const { state } = context;
  const method = context.request.method();
  if (path.startsWith('/template/') && path.split('/').length === 3) {
    const templateId = Number(path.split('/')[2]);
    const template = getTemplate(state, templateId);
    if (!template) {
      await context.notFound('Template not found');
      return true;
    }

    if (method === 'GET') {
      await context.json(buildTemplateResponse(state, template, readNullableNumber(url.searchParams.get('compareDaySetId'))));
      return true;
    }

    if (method === 'PATCH') {
      const body = await context.readJson<Record<string, unknown>>();
      template.title = readNullableString(body.title) ?? template.title;
      await context.json(buildTemplateResponse(state, template));
      return true;
    }

    if (method === 'DELETE') {
      state.templates = removeArrayItem(state.templates, templateId);
      state.daySets.forEach((daySet) => {
        if (daySet.templateId === templateId) {
          daySet.templateId = null;
        }
      });
      state.cycles.forEach((cycle) => {
        if (cycle.defaultTemplateId === templateId) {
          cycle.defaultTemplateId = null;
        }
      });
      await context.noContent();
      return true;
    }
  }
  return false;
}

async function handleTemplateItemsRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path } = context;
  const { state } = context;
  const method = context.request.method();
  if (path.startsWith('/template/') && path.endsWith('/items')) {
    const templateId = Number(path.split('/')[2]);
    const template = getTemplate(state, templateId);
    if (!template) {
      await context.notFound('Template not found');
      return true;
    }

    if (method === 'POST') {
      const body = await context.readJson<Record<string, unknown>>();
      template.items.push({
        id: context.nextId('templateItem'),
        productId: Number(body.productId ?? 0),
        qty: Number(body.qty ?? 0),
        qtyUnit: readNullableString(body.qtyUnit) as MockTemplate['items'][number]['qtyUnit'],
        slotId: readNullableNumber(body.slotId),
        slotKey: readNullableString(body.slotKey),
      });
      await context.json(buildTemplateResponse(state, template), 201);
      return true;
    }
  }
  return false;
}

async function handleTemplateItemRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path } = context;
  const { state } = context;
  const method = context.request.method();
  if (path.startsWith('/template/') && path.includes('/items/')) {
    const [, , templateIdValue, , itemIdValue] = path.split('/');
    const templateId = Number(templateIdValue);
    const itemId = Number(itemIdValue);
    const template = getTemplate(state, templateId);
    if (!template) {
      await context.notFound('Template not found');
      return true;
    }

    const item = template.items.find((candidate) => candidate.id === itemId) ?? null;
    if (!item) {
      await context.notFound('Template item not found');
      return true;
    }

    if (method === 'PATCH') {
      const body = await context.readJson<Record<string, unknown>>();
      item.productId = Number(body.productId ?? item.productId);
      item.qty = Number(body.qty ?? item.qty);
      item.qtyUnit = (readFallbackString(body.qtyUnit, item.qtyUnit) as typeof item.qtyUnit) ?? null;
      item.slotId = readFallbackNumber(body.slotId, item.slotId);
      item.slotKey = readFallbackString(body.slotKey, item.slotKey);
      await context.json(buildTemplateResponse(state, template));
      return true;
    }

    if (method === 'DELETE') {
      template.items = removeArrayItem(template.items, itemId);
      await context.json(buildTemplateResponse(state, template));
      return true;
    }
  }
  return false;
}

async function handleCycleAssignmentCollectionRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path } = context;
  const { state } = context;
  const method = context.request.method();
  if (path === '/cycle-assignment') {
    if (method === 'GET') {
      const from = url.searchParams.get('from');
      const to = url.searchParams.get('to');
      const filteredAssignments = state.cycleAssignments.filter((assignment) => {
        if (!from || !to) {
          return true;
        }

        return assignment.startDateLocal <= to && assignment.startDateLocal >= dateFloor(from);
      });

      await context.json(
        filteredAssignments
          .map((assignment) => hydrateCycleAssignment(state, assignment))
          .filter((assignment): assignment is NonNullable<ReturnType<typeof hydrateCycleAssignment>> => assignment !== null),
      );
      return true;
    }

    if (method === 'POST') {
      const body = await context.readJson<Record<string, unknown>>();
      const assignment: MockCycleAssignment = {
        id: context.nextId('cycleAssignment'),
        cycleId: Number(body.cycleId ?? 0),
        startDateLocal: readNullableString(body.startDateLocal) ?? '',
      };
      state.cycleAssignments.push(assignment);
      await context.json(hydrateCycleAssignment(state, assignment), 201);
      return true;
    }
  }
  return false;
}

async function handleCycleAssignmentRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path } = context;
  const { state } = context;
  const method = context.request.method();
  if (path.startsWith('/cycle-assignment/')) {
    const assignmentId = Number(path.split('/')[2]);
    const assignment = state.cycleAssignments.find((candidate) => candidate.id === assignmentId) ?? null;
    if (!assignment) {
      await context.notFound('Assignment not found');
      return true;
    }

    if (method === 'GET') {
      await context.json(hydrateCycleAssignment(state, assignment));
      return true;
    }

    if (method === 'PATCH') {
      const body = await context.readJson<Record<string, unknown>>();
      assignment.cycleId = Number(body.cycleId ?? assignment.cycleId);
    assignment.startDateLocal = readNullableString(body.startDateLocal) ?? assignment.startDateLocal;
      await context.json(hydrateCycleAssignment(state, assignment));
      return true;
    }

    if (method === 'DELETE') {
      state.cycleAssignments = removeArrayItem(state.cycleAssignments, assignmentId);
      await context.noContent();
      return true;
    }
  }

  return false;
}

function toCycleNutritionValue(value: unknown): CycleNutritionValue | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const nutritionKey = (readNullableString(raw.nutritionKey) ?? '').toUpperCase();
  if (!nutritionKey) {
    return null;
  }

  return {
    nutritionKey,
    amount: Number(raw.amount ?? 0),
    unit: (readNullableString(raw.unit) ?? 'G').toUpperCase(),
    reference: readNullableString(raw.reference) === 'PER_100ML' ? 'PER_100ML' : 'PER_100G',
  };
}

function isCycleNutritionValue(value: CycleNutritionValue | null): value is CycleNutritionValue {
  return value !== null;
}

function normalizeTimeline(value: unknown, durationDays: number): number[] {
  const timeline = Array.isArray(value)
    ? value.map(Number).map((entry) => (Number.isInteger(entry) && entry > 0 ? entry : 0))
    : [];

  while (timeline.length < Math.max(1, durationDays)) {
    timeline.push(0);
  }

  return timeline.slice(0, Math.max(1, durationDays));
}

function readNullableNumber(value: unknown): number | null {
  if (value == null || value === '') {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function readFallbackNumber(value: unknown, fallback: number | null): number | null {
  if (value === undefined) {
    return fallback;
  }

  return readNullableNumber(value);
}

function readNullableString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const candidate = value.trim();
  return candidate === '' ? null : candidate;
}

function readFallbackString(value: unknown, fallback: string | null): string | null {
  if (value === undefined) {
    return fallback;
  }

  return readNullableString(value);
}

function dateFloor(value: string): string {
  return value.slice(0, 10);
}
