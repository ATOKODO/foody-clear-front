import { provideHttpClient, withXhr } from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CategoryService } from './category-service';
import { CycleAssignementService } from './cycle-assignement-service';
import { CycleService } from './cycle-service';
import { DaySetService } from './day-set-service';
import { GenericProductService } from './generic-product-service';
import { InputDayService } from './input-day-service';
import { InventoryService } from './inventory-service';
import { MealPrepService } from './meal-prep-service';
import { NutritionValueService } from './nutrition-value-service';
import { ProductService } from './product-service';
import { ShoppingListService } from './shopping-list-service';
import { SlotService } from './slot-service';
import { StatisticService } from './statistic-service';
import { TagService } from './tag-service';
import { TemplateService } from './template-service';

const baseUrl = 'http://api.test.local';

function expectRequest(
  httpMock: HttpTestingController,
  url: string,
  method: string,
  body?: unknown,
): TestRequest {
  const request = httpMock.expectOne(url);
  expect(request.request.method).toBe(method);
  if (body !== undefined) {
    expect(request.request.body).toEqual(body);
  }
  request.flush({});
  return request;
}

describe('HTTP services', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('covers category, generic product, nutrition, product and tag CRUD endpoints', () => {
    const category = TestBed.inject(CategoryService);
    const genericProduct = TestBed.inject(GenericProductService);
    const nutritionValue = TestBed.inject(NutritionValueService);
    const product = TestBed.inject(ProductService);
    const tag = TestBed.inject(TagService);
    const categoryDto = { name: 'Fresh', warnBeforeDays: 2, recentlyExpiredDays: 1, minQuantity: 1 };
    const genericProductDto = { name: 'Rice', minQuantityUnit: 1, minQuantityMetric: 500 };
    const nutritionDto = { label: 'Energy', amount: 100, unit: 'kcal', per: 100, productId: 4 };
    const productDto = {
      name: 'Rice bag',
      unitType: 'Paquet',
      quantityPerUnit: 500,
      quantityUnit: 'g',
    } as Parameters<ProductService['create']>[0];
    const tagDto = { name: 'Staple' };

    [category, genericProduct, nutritionValue, product, tag].forEach((service) =>
      service.setBaseUrl(`${baseUrl}/`),
    );

    category.create(categoryDto).subscribe();
    expectRequest(httpMock, `${baseUrl}/category`, 'POST', categoryDto);
    category.findAll().subscribe();
    expectRequest(httpMock, `${baseUrl}/category`, 'GET');
    category.findOne(3).subscribe();
    expectRequest(httpMock, `${baseUrl}/category/3`, 'GET');
    category.update(3, { minQuantity: 4 }).subscribe();
    expectRequest(httpMock, `${baseUrl}/category/3`, 'PATCH', { minQuantity: 4 });
    category.remove(3).subscribe();
    expectRequest(httpMock, `${baseUrl}/category/3`, 'DELETE');

    genericProduct.create(genericProductDto).subscribe();
    expectRequest(httpMock, `${baseUrl}/generic-product`, 'POST', genericProductDto);
    genericProduct.findAll().subscribe();
    expectRequest(httpMock, `${baseUrl}/generic-product`, 'GET');
    genericProduct.findOne(4).subscribe();
    expectRequest(httpMock, `${baseUrl}/generic-product/4`, 'GET');
    genericProduct.update(4, { name: 'Brown rice' }).subscribe();
    expectRequest(httpMock, `${baseUrl}/generic-product/4`, 'PATCH', { name: 'Brown rice' });
    genericProduct.remove(4).subscribe();
    expectRequest(httpMock, `${baseUrl}/generic-product/4`, 'DELETE');

    nutritionValue.create(nutritionDto).subscribe();
    expectRequest(httpMock, `${baseUrl}/nutrition-value`, 'POST', nutritionDto);
    nutritionValue.findAll().subscribe();
    expectRequest(httpMock, `${baseUrl}/nutrition-value`, 'GET');
    nutritionValue.findOne(5).subscribe();
    expectRequest(httpMock, `${baseUrl}/nutrition-value/5`, 'GET');
    nutritionValue.update(5, { amount: 120 }).subscribe();
    expectRequest(httpMock, `${baseUrl}/nutrition-value/5`, 'PATCH', { amount: 120 });
    nutritionValue.remove(5).subscribe();
    expectRequest(httpMock, `${baseUrl}/nutrition-value/5`, 'DELETE');

    product.create(productDto).subscribe();
    expectRequest(httpMock, `${baseUrl}/product`, 'POST', productDto);
    product.findAll().subscribe();
    expectRequest(httpMock, `${baseUrl}/product`, 'GET');
    product.findOne(6).subscribe();
    expectRequest(httpMock, `${baseUrl}/product/6`, 'GET');
    product.update(6, { memo: 'Pantry' }).subscribe();
    expectRequest(httpMock, `${baseUrl}/product/6`, 'PATCH', { memo: 'Pantry' });
    product.remove(6).subscribe();
    expectRequest(httpMock, `${baseUrl}/product/6`, 'DELETE');

    tag.create(tagDto).subscribe();
    expectRequest(httpMock, `${baseUrl}/tag`, 'POST', tagDto);
    tag.findAll().subscribe();
    expectRequest(httpMock, `${baseUrl}/tag`, 'GET');
    tag.findOne(7).subscribe();
    expectRequest(httpMock, `${baseUrl}/tag/7`, 'GET');
    tag.update(7, { name: 'Pantry' }).subscribe();
    expectRequest(httpMock, `${baseUrl}/tag/7`, 'PATCH', { name: 'Pantry' });
    tag.remove(7).subscribe();
    expectRequest(httpMock, `${baseUrl}/tag/7`, 'DELETE');
  });

  it('covers inventory, cycle, day set, slot and assignment endpoints', () => {
    const inventory = TestBed.inject(InventoryService);
    const cycle = TestBed.inject(CycleService);
    const daySet = TestBed.inject(DaySetService);
    const slot = TestBed.inject(SlotService);
    const assignment = TestBed.inject(CycleAssignementService);

    [inventory, cycle, daySet, slot, assignment].forEach((service) =>
      service.setBaseUrl(`${baseUrl}/`),
    );

    const inventoryDto = { name: 'Pantry' };
    inventory.create(inventoryDto).subscribe();
    expectRequest(httpMock, `${baseUrl}/inventory`, 'POST', inventoryDto);
    inventory.findAll().subscribe();
    expectRequest(httpMock, `${baseUrl}/inventory`, 'GET');
    inventory.findOne(1).subscribe();
    expectRequest(httpMock, `${baseUrl}/inventory/1`, 'GET');
    inventory.findProducts(1).subscribe();
    expectRequest(httpMock, `${baseUrl}/inventory/1/products`, 'GET');
    inventory.update(1, { name: 'Main pantry' }).subscribe();
    expectRequest(httpMock, `${baseUrl}/inventory/1`, 'PATCH', { name: 'Main pantry' });
    inventory.addProducts(1, { productIds: [2] }).subscribe();
    expectRequest(httpMock, `${baseUrl}/inventory/1/products/add`, 'PATCH', { productIds: [2] });
    inventory.removeProducts(1, { productIds: [2] }).subscribe();
    expectRequest(httpMock, `${baseUrl}/inventory/1/products/remove`, 'PATCH', { productIds: [2] });
    inventory.reconcileProducts(1, { products: [] }).subscribe();
    expectRequest(httpMock, `${baseUrl}/inventory/1/products/reconcile`, 'PATCH', { products: [] });
    inventory.remove(1).subscribe();
    expectRequest(httpMock, `${baseUrl}/inventory/1`, 'DELETE');

    const cycleDto = {
      title: 'Week',
      color: '#fff',
      durationDays: 7,
      durationCount: 1,
      durationType: 'semaine',
    } as Parameters<CycleService['create']>[0];
    cycle.create(cycleDto).subscribe();
    expectRequest(httpMock, `${baseUrl}/cycle`, 'POST', cycleDto);
    cycle.findAll().subscribe();
    expectRequest(httpMock, `${baseUrl}/cycle`, 'GET');
    cycle.findOne(2).subscribe();
    expectRequest(httpMock, `${baseUrl}/cycle/2`, 'GET');
    cycle.update(2, { title: 'Updated week' }).subscribe();
    expectRequest(httpMock, `${baseUrl}/cycle/2`, 'PATCH', { title: 'Updated week' });
    cycle.remove(2).subscribe();
    expectRequest(httpMock, `${baseUrl}/cycle/2`, 'DELETE');

    const daySetDto = { title: 'Work days', slotIds: [1, 2] };
    daySet.create(daySetDto).subscribe();
    expectRequest(httpMock, `${baseUrl}/day-set`, 'POST', daySetDto);
    daySet.findAll().subscribe();
    expectRequest(httpMock, `${baseUrl}/day-set`, 'GET');
    daySet.findOne(3).subscribe();
    expectRequest(httpMock, `${baseUrl}/day-set/3`, 'GET');
    daySet.update(3, { title: 'Rest days' }).subscribe();
    expectRequest(httpMock, `${baseUrl}/day-set/3`, 'PATCH', { title: 'Rest days' });
    daySet.remove(3).subscribe();
    expectRequest(httpMock, `${baseUrl}/day-set/3`, 'DELETE');

    const slotDto = { key: 'breakfast', title: 'Breakfast', sortOrder: 1 };
    slot.create(slotDto).subscribe();
    expectRequest(httpMock, `${baseUrl}/slot`, 'POST', slotDto);
    slot.findAll().subscribe();
    expectRequest(httpMock, `${baseUrl}/slot`, 'GET');
    slot.findOne(4).subscribe();
    expectRequest(httpMock, `${baseUrl}/slot/4`, 'GET');
    slot.update(4, { title: 'Morning meal' }).subscribe();
    expectRequest(httpMock, `${baseUrl}/slot/4`, 'PATCH', { title: 'Morning meal' });
    slot.remove(4).subscribe();
    expectRequest(httpMock, `${baseUrl}/slot/4`, 'DELETE');

    const assignmentDto = {
      cycleId: 2,
      startDateLocal: '2026-07-11',
    } as Parameters<CycleAssignementService['create']>[0];
    assignment.create(assignmentDto).subscribe();
    expectRequest(httpMock, `${baseUrl}/cycle-assignment`, 'POST', assignmentDto);
    assignment.findAll().subscribe();
    expectRequest(httpMock, `${baseUrl}/cycle-assignment`, 'GET');
    assignment.findInRange('2026-07-01', '2026-07-31').subscribe();
    const rangeRequest = httpMock.expectOne(
      (request) => request.url === `${baseUrl}/cycle-assignment`,
    );
    expect(rangeRequest.request.params.get('from')).toBe('2026-07-01');
    expect(rangeRequest.request.params.get('to')).toBe('2026-07-31');
    rangeRequest.flush([]);
    assignment.findOne(5).subscribe();
    expectRequest(httpMock, `${baseUrl}/cycle-assignment/5`, 'GET');
    const assignmentUpdate = { startDateLocal: '2026-07-12' } as Parameters<CycleAssignementService['update']>[1];
    assignment.update(5, assignmentUpdate).subscribe();
    expectRequest(httpMock, `${baseUrl}/cycle-assignment/5`, 'PATCH', assignmentUpdate);
    assignment.remove(5).subscribe();
    expectRequest(httpMock, `${baseUrl}/cycle-assignment/5`, 'DELETE');
  });

  it('covers input day endpoints and optional timezone parameters', () => {
    const service = TestBed.inject(InputDayService);
    service.setBaseUrl(`${baseUrl}/`);

    service.getInputDay('2026-07-11', ' Europe/Paris ').subscribe();
    let request = httpMock.expectOne(
      (candidate) => candidate.url === `${baseUrl}/input-days/2026-07-11`,
    );
    expect(request.request.params.get('timezone')).toBe('Europe/Paris');
    request.flush({});

    service.getInputWeek('2026-07-07').subscribe();
    request = httpMock.expectOne(`${baseUrl}/input-days/week/2026-07-07`);
    expect(request.request.params.has('timezone')).toBeFalse();
    request.flush({});
    service.getInputMonth('2026-07-01', 'UTC').subscribe();
    request = httpMock.expectOne(
      (candidate) => candidate.url === `${baseUrl}/input-days/month/2026-07-01`,
    );
    expect(request.request.params.get('timezone')).toBe('UTC');
    request.flush({});

    const item = {
      inventoryId: 1,
      qty: 2,
    } as Parameters<InputDayService['createItem']>[1];
    service.createItem('2026-07-11', item).subscribe();
    expectRequest(httpMock, `${baseUrl}/input-days/2026-07-11/items`, 'POST', item);
    const bulkItems = { items: [item] } as Parameters<InputDayService['createItems']>[1];
    service.createItems('2026-07-11', bulkItems).subscribe();
    expectRequest(httpMock, `${baseUrl}/input-days/2026-07-11/items/bulk`, 'POST', bulkItems);
    const itemUpdate = { qty: 3 } as Parameters<InputDayService['updateItem']>[2];
    service.updateItem('2026-07-11', 2, itemUpdate).subscribe();
    expectRequest(httpMock, `${baseUrl}/input-days/2026-07-11/items/2`, 'PATCH', itemUpdate);
    service.setTemplate('2026-07-11', 4).subscribe();
    expectRequest(httpMock, `${baseUrl}/input-days/2026-07-11/template`, 'PUT', { templateId: 4 });
    service.convertTemplateItem('2026-07-11', 5, [6, 7]).subscribe();
    expectRequest(httpMock, `${baseUrl}/input-days/2026-07-11/template-items/5/convert`, 'POST', { inventoryId: 6 });
    service.convertTemplateItem('2026-07-11', 5, []).subscribe();
    expectRequest(httpMock, `${baseUrl}/input-days/2026-07-11/template-items/5/convert`, 'POST', { inventoryId: null });
    const externalEntry = {} as Parameters<InputDayService['createExternalEntry']>[1];
    service.createExternalEntry('2026-07-11', externalEntry).subscribe();
    expectRequest(httpMock, `${baseUrl}/input-days/2026-07-11/external-entries`, 'POST', externalEntry);
    const externalEntryUpdate = {} as Parameters<InputDayService['updateExternalEntry']>[2];
    service.updateExternalEntry('2026-07-11', 8, externalEntryUpdate).subscribe();
    expectRequest(httpMock, `${baseUrl}/input-days/2026-07-11/external-entries/8`, 'PATCH', externalEntryUpdate);
    service.removeExternalEntry('2026-07-11', 8).subscribe();
    expectRequest(httpMock, `${baseUrl}/input-days/2026-07-11/external-entries/8`, 'DELETE');
    service.removeItem('2026-07-11', 2).subscribe();
    expectRequest(httpMock, `${baseUrl}/input-days/2026-07-11/items/2`, 'DELETE');
  });

  it('covers shopping list and template endpoints', () => {
    const service = TestBed.inject(ShoppingListService);
    service.setBaseUrl(`${baseUrl}/`);

    const listDto = { name: 'Weekly groceries' };
    service.findAll().subscribe();
    expectRequest(httpMock, `${baseUrl}/shopping-list`, 'GET');
    service.findOne(1).subscribe();
    expectRequest(httpMock, `${baseUrl}/shopping-list/1`, 'GET');
    service.create(listDto).subscribe();
    expectRequest(httpMock, `${baseUrl}/shopping-list`, 'POST', listDto);
    service.update(1, { name: 'Updated groceries' }).subscribe();
    expectRequest(httpMock, `${baseUrl}/shopping-list/1`, 'PATCH', { name: 'Updated groceries' });
    service.remove(1).subscribe();
    expectRequest(httpMock, `${baseUrl}/shopping-list/1`, 'DELETE');
    const listItem = {} as Parameters<ShoppingListService['createItem']>[1];
    service.createItem(1, listItem).subscribe();
    expectRequest(httpMock, `${baseUrl}/shopping-list/1/items`, 'POST', listItem);
    const listItemUpdate = {} as Parameters<ShoppingListService['updateItem']>[2];
    service.updateItem(1, 2, listItemUpdate).subscribe();
    expectRequest(httpMock, `${baseUrl}/shopping-list/1/items/2`, 'PATCH', listItemUpdate);
    service.removeItem(1, 2).subscribe();
    expectRequest(httpMock, `${baseUrl}/shopping-list/1/items/2`, 'DELETE');
    service.checkAll(1, { checked: true }).subscribe();
    expectRequest(httpMock, `${baseUrl}/shopping-list/1/check-all`, 'PATCH', { checked: true });
    service.convertChecked(1, { inventoryId: 3 }).subscribe();
    expectRequest(httpMock, `${baseUrl}/shopping-list/1/convert-checked`, 'POST', { inventoryId: 3 });
    service.saveTemplate(1, { name: 'Base list' }).subscribe();
    expectRequest(httpMock, `${baseUrl}/shopping-list/1/save-template`, 'POST', { name: 'Base list' });
    service.findAllTemplates().subscribe();
    expectRequest(httpMock, `${baseUrl}/shopping-list/templates`, 'GET');
    service.createTemplate({ name: 'Quick list' }).subscribe();
    expectRequest(httpMock, `${baseUrl}/shopping-list/templates`, 'POST', { name: 'Quick list' });
    service.updateTemplate(4, { name: 'Updated list' }).subscribe();
    expectRequest(httpMock, `${baseUrl}/shopping-list/templates/4`, 'PATCH', { name: 'Updated list' });
    service.removeTemplate(4).subscribe();
    expectRequest(httpMock, `${baseUrl}/shopping-list/templates/4`, 'DELETE');
    const fromTemplateDto = {} as Parameters<ShoppingListService['createFromTemplate']>[1];
    service.createFromTemplate(4, fromTemplateDto).subscribe();
    expectRequest(httpMock, `${baseUrl}/shopping-list/templates/4/create-list`, 'POST', fromTemplateDto);
  });

  it('covers meal prep and statistics endpoints', () => {
    const mealPrep = TestBed.inject(MealPrepService);
    const statistics = TestBed.inject(StatisticService);
    mealPrep.setBaseUrl(`${baseUrl}/`);
    statistics.setBaseUrl(`${baseUrl}/`);

    mealPrep.findAllDishes().subscribe();
    expectRequest(httpMock, `${baseUrl}/meal-prep/dishes`, 'GET');
    const dishDto = {} as Parameters<MealPrepService['createDish']>[0];
    mealPrep.createDish(dishDto).subscribe();
    expectRequest(httpMock, `${baseUrl}/meal-prep/dishes`, 'POST', dishDto);
    const dishUpdate = {} as Parameters<MealPrepService['updateDish']>[1];
    mealPrep.updateDish(1, dishUpdate).subscribe();
    expectRequest(httpMock, `${baseUrl}/meal-prep/dishes/1`, 'PATCH', dishUpdate);
    mealPrep.removeDish(1).subscribe();
    expectRequest(httpMock, `${baseUrl}/meal-prep/dishes/1`, 'DELETE');
    mealPrep.createShoppingListFromDish(1).subscribe();
    expectRequest(httpMock, `${baseUrl}/meal-prep/dishes/1/create-shopping-list`, 'POST', {});
    mealPrep.findAllMeals().subscribe();
    expectRequest(httpMock, `${baseUrl}/meal-prep/meals`, 'GET');
    const mealDto = {} as Parameters<MealPrepService['createMeal']>[0];
    mealPrep.createMeal(mealDto).subscribe();
    expectRequest(httpMock, `${baseUrl}/meal-prep/meals`, 'POST', mealDto);
    const mealUpdate = {} as Parameters<MealPrepService['updateMeal']>[1];
    mealPrep.updateMeal(2, mealUpdate).subscribe();
    expectRequest(httpMock, `${baseUrl}/meal-prep/meals/2`, 'PATCH', mealUpdate);
    mealPrep.removeMeal(2).subscribe();
    expectRequest(httpMock, `${baseUrl}/meal-prep/meals/2`, 'DELETE');
    const mealShoppingListDto = {} as Parameters<MealPrepService['createShoppingListFromMeal']>[1];
    mealPrep.createShoppingListFromMeal(2, mealShoppingListDto).subscribe();
    expectRequest(httpMock, `${baseUrl}/meal-prep/meals/2/create-shopping-list`, 'POST', mealShoppingListDto);

    statistics.getTimeline('2026-07-01', '2026-07-31', 'UTC').subscribe();
    let request = httpMock.expectOne(
      (candidate) => candidate.url === `${baseUrl}/statistics/timeline`,
    );
    expect(request.request.params.get('from')).toBe('2026-07-01');
    expect(request.request.params.get('to')).toBe('2026-07-31');
    expect(request.request.params.get('timezone')).toBe('UTC');
    request.flush({});
    statistics.getProductPriceHistory(3, '2026-07-01', '2026-07-31', 'UTC').subscribe();
    request = httpMock.expectOne(
      (candidate) => candidate.url === `${baseUrl}/statistics/product-price-history/3`,
    );
    expect(request.request.params.get('from')).toBe('2026-07-01');
    request.flush({});
    const exclusionDto = {} as Parameters<StatisticService['updatePurchaseEventExclusion']>[1];
    statistics.updatePurchaseEventExclusion(4, exclusionDto, '2026-07-01', '2026-07-31', 'UTC').subscribe();
    request = httpMock.expectOne(
      (candidate) => candidate.url === `${baseUrl}/statistics/purchase-events/4/exclusion`,
    );
    expect(request.request.body).toEqual(exclusionDto);
    expect(request.request.params.get('timezone')).toBe('UTC');
    request.flush({});
    const correctionDto = {} as Parameters<StatisticService['correctProductPrice']>[0];
    statistics.correctProductPrice(correctionDto, 'UTC').subscribe();
    request = httpMock.expectOne(
      (candidate) => candidate.url === `${baseUrl}/statistics/product-price-corrections`,
    );
    expect(request.request.body).toEqual(correctionDto);
    expect(request.request.params.get('timezone')).toBe('UTC');
    request.flush({});
  });

  it('covers template lookup query validation', () => {
    const service = TestBed.inject(TemplateService);
    service.setBaseUrl(`${baseUrl}/`);

    service.findAll().subscribe();
    expectRequest(httpMock, `${baseUrl}/template`, 'GET');
    service.findOne(1).subscribe();
    let request = httpMock.expectOne(`${baseUrl}/template/1`);
    expect(request.request.params.has('compareDaySetId')).toBeFalse();
    request.flush({});
    service.findOne(1, 2).subscribe();
    request = httpMock.expectOne((candidate) => candidate.url === `${baseUrl}/template/1`);
    expect(request.request.params.get('compareDaySetId')).toBe('2');
    request.flush({});
    service.findOne(1, 0).subscribe();
    request = httpMock.expectOne(`${baseUrl}/template/1`);
    expect(request.request.params.has('compareDaySetId')).toBeFalse();
    request.flush({});
    const templateDto = {} as Parameters<TemplateService['create']>[0];
    service.create(templateDto).subscribe();
    expectRequest(httpMock, `${baseUrl}/template`, 'POST', templateDto);
    const templateUpdate = {} as Parameters<TemplateService['update']>[1];
    service.update(1, templateUpdate).subscribe();
    expectRequest(httpMock, `${baseUrl}/template/1`, 'PATCH', templateUpdate);
    service.remove(1).subscribe();
    expectRequest(httpMock, `${baseUrl}/template/1`, 'DELETE');
    const templateItemDto = {} as Parameters<TemplateService['createItem']>[1];
    service.createItem(1, templateItemDto).subscribe();
    expectRequest(httpMock, `${baseUrl}/template/1/items`, 'POST', templateItemDto);
    const templateItemUpdate = {} as Parameters<TemplateService['updateItem']>[2];
    service.updateItem(1, 2, templateItemUpdate).subscribe();
    expectRequest(httpMock, `${baseUrl}/template/1/items/2`, 'PATCH', templateItemUpdate);
    service.removeItem(1, 2).subscribe();
    expectRequest(httpMock, `${baseUrl}/template/1/items/2`, 'DELETE');
  });
});
