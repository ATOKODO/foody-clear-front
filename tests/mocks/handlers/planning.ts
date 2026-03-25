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
  const { path, request, state, url } = context;
  const method = request.method();

  if (path === '/slot') {
    if (method === 'GET') {
      await context.json(state.slots.map(hydrateSlot));
      return true;
    }

    if (method === 'POST') {
      const body = await context.readJson<Record<string, unknown>>();
      const slot: MockSlot = {
        id: context.nextId('slot'),
        key: String(body.key ?? '').trim(),
        title: String(body.title ?? '').trim(),
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
      slot.key = String(body.key ?? slot.key).trim();
      slot.title = String(body.title ?? slot.title).trim();
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

  if (path === '/day-set') {
    if (method === 'GET') {
      await context.json(state.daySets.map((daySet) => hydrateDaySet(state, daySet)));
      return true;
    }

    if (method === 'POST') {
      const body = await context.readJson<Record<string, unknown>>();
      const daySet: MockDaySet = {
        id: context.nextId('daySet'),
        title: String(body.title ?? '').trim(),
        nutritionValues: Array.isArray(body.nutritionValues)
          ? body.nutritionValues.map(toCycleNutritionValue).filter(isCycleNutritionValue)
          : [],
        slotIds: Array.isArray(body.slotIds)
          ? body.slotIds.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0)
          : [],
        templateId: readNullableNumber(body.templateId),
      };
      state.daySets.push(daySet);
      await context.json(hydrateDaySet(state, daySet), 201);
      return true;
    }
  }

  if (path.startsWith('/day-set/')) {
    const daySetId = Number(path.split('/')[2]);
    const daySet = getDaySet(state, daySetId);
    if (!daySet) {
      await context.notFound('Day set not found');
      return true;
    }

    if (method === 'GET') {
      await context.json(hydrateDaySet(state, daySet));
      return true;
    }

    if (method === 'PATCH') {
      const body = await context.readJson<Record<string, unknown>>();
      daySet.title = String(body.title ?? daySet.title).trim();
      if (Array.isArray(body.nutritionValues)) {
        daySet.nutritionValues = body.nutritionValues
          .map(toCycleNutritionValue)
          .filter((value): value is NonNullable<ReturnType<typeof toCycleNutritionValue>> => value !== null);
      }
      if (Array.isArray(body.slotIds)) {
        daySet.slotIds = body.slotIds
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0);
      }
      if ('templateId' in body) {
        daySet.templateId = readNullableNumber(body.templateId);
      }
      await context.json(hydrateDaySet(state, daySet));
      return true;
    }

    if (method === 'DELETE') {
      state.daySets = removeArrayItem(state.daySets, daySetId);
      state.cycles.forEach((cycle) => {
        cycle.daySetOrder = cycle.daySetOrder.map((candidate) => (candidate === daySetId ? 0 : candidate));
      });
      await context.noContent();
      return true;
    }
  }

  if (path === '/cycle') {
    if (method === 'GET') {
      await context.json(state.cycles.map((cycle) => hydrateCycle(state, cycle)));
      return true;
    }

    if (method === 'POST') {
      const body = await context.readJson<Record<string, unknown>>();
      const cycle: MockCycle = {
        id: context.nextId('cycle'),
        title: String(body.title ?? '').trim(),
        color: String(body.color ?? 'bg-sky-500').trim(),
        nutritionValues: Array.isArray(body.nutritionValues)
          ? body.nutritionValues.map(toCycleNutritionValue).filter(isCycleNutritionValue)
          : [],
        durationDays: Number(body.durationDays ?? 1),
        durationCount: Number(body.durationCount ?? body.durationDays ?? 1),
        durationType: String(body.durationType ?? 'jour') as MockCycle['durationType'],
        daySetOrder: normalizeTimeline(body.daySetOrder, Number(body.durationDays ?? 1)),
      };
      state.cycles.push(cycle);
      await context.json(hydrateCycle(state, cycle), 201);
      return true;
    }
  }

  if (path.startsWith('/cycle/')) {
    const cycleId = Number(path.split('/')[2]);
    const cycle = getCycle(state, cycleId);
    if (!cycle) {
      await context.notFound('Cycle not found');
      return true;
    }

    if (method === 'GET') {
      await context.json(hydrateCycle(state, cycle));
      return true;
    }

    if (method === 'PATCH') {
      const body = await context.readJson<Record<string, unknown>>();
      cycle.title = String(body.title ?? cycle.title).trim();
      cycle.color = String(body.color ?? cycle.color).trim();
      cycle.durationDays = Number(body.durationDays ?? cycle.durationDays);
      cycle.durationCount = Number(body.durationCount ?? cycle.durationCount);
      cycle.durationType = String(body.durationType ?? cycle.durationType) as MockCycle['durationType'];
      if (Array.isArray(body.nutritionValues)) {
        cycle.nutritionValues = body.nutritionValues
          .map(toCycleNutritionValue)
          .filter((value): value is NonNullable<ReturnType<typeof toCycleNutritionValue>> => value !== null);
      }
      if (Array.isArray(body.daySetOrder)) {
        cycle.daySetOrder = normalizeTimeline(body.daySetOrder, cycle.durationDays);
      }
      await context.json(hydrateCycle(state, cycle));
      return true;
    }

    if (method === 'DELETE') {
      state.cycles = removeArrayItem(state.cycles, cycleId);
      state.cycleAssignments = state.cycleAssignments.filter((assignment) => assignment.cycleId !== cycleId);
      await context.noContent();
      return true;
    }
  }

  if (path === '/template') {
    if (method === 'GET') {
      await context.json(state.templates.map((template) => buildTemplateResponse(state, template)));
      return true;
    }

    if (method === 'POST') {
      const body = await context.readJson<Record<string, unknown>>();
      const template: MockTemplate = {
        id: context.nextId('template'),
        title: String(body.title ?? '').trim(),
        items: [],
      };
      state.templates.push(template);
      await context.json(buildTemplateResponse(state, template), 201);
      return true;
    }
  }

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
      template.title = String(body.title ?? template.title).trim();
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
      await context.noContent();
      return true;
    }
  }

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
        startDateLocal: String(body.startDateLocal ?? '').trim(),
      };
      state.cycleAssignments.push(assignment);
      await context.json(hydrateCycleAssignment(state, assignment), 201);
      return true;
    }
  }

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
      assignment.startDateLocal = String(body.startDateLocal ?? assignment.startDateLocal).trim();
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
  const nutritionKey = String(raw.nutritionKey ?? '').trim().toUpperCase();
  if (!nutritionKey) {
    return null;
  }

  return {
    nutritionKey,
    amount: Number(raw.amount ?? 0),
    unit: String(raw.unit ?? 'G').trim().toUpperCase(),
    reference: String(raw.reference ?? 'PER_100G') === 'PER_100ML' ? 'PER_100ML' : 'PER_100G',
  };
}

function isCycleNutritionValue(value: CycleNutritionValue | null): value is CycleNutritionValue {
  return value !== null;
}

function normalizeTimeline(value: unknown, durationDays: number): number[] {
  const timeline = Array.isArray(value)
    ? value.map((entry) => Number(entry)).map((entry) => (Number.isInteger(entry) && entry > 0 ? entry : 0))
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
  if (value == null) {
    return null;
  }

  const candidate = String(value).trim();
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
