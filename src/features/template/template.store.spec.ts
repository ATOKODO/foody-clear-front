import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { TemplateFeatureStore } from './template.store';
import { DaySetService } from '../../services/day-set-service';
import { MealPrepService } from '../../services/meal-prep-service';
import { ProductService } from '../../services/product-service';
import { SlotService } from '../../services/slot-service';
import { TemplateService } from '../../services/template-service';
import type { Template } from '../../interfaces/template.interface';
import type { TemplateItemDraft } from '../../components/template/template-form/template-form';

describe('TemplateFeatureStore', () => {
  let store: TemplateFeatureStore;
  let templateServiceMock: ReturnType<typeof createMocks>['template'];

  beforeEach(() => {
    const mocks = createMocks();
    templateServiceMock = mocks.template;
    TestBed.configureTestingModule({
      providers: [
        TemplateFeatureStore,
        { provide: TemplateService, useValue: mocks.template },
        { provide: ProductService, useValue: mocks.product },
        { provide: DaySetService, useValue: mocks.daySet },
        { provide: SlotService, useValue: mocks.slot },
        { provide: MealPrepService, useValue: mocks.mealPrep },
      ],
    });
    store = TestBed.inject(TemplateFeatureStore);
    store.init();
  });

  it('should load and sort workspace options and select the first template', () => {
    expect(store.templates.length).toBe(2);
    expect(store.selectedTemplateId).toBe(1);
    expect(store.selectedTemplate?.title).toBe('Breakfast');
    expect(store.productOptions.map((product) => product.name)).toEqual(['Apple', 'Milk']);
    expect(store.dishOptions.map((dish) => dish.name)).toEqual(['Soup']);
    expect(store.mealOptions.map((meal) => meal.name)).toEqual(['Lunch']);
    expect(store.daySetOptions.map((daySet) => daySet.title)).toEqual(['Morning']);
    expect(store.slotOptions.map((slot) => slot.title)).toEqual(['Breakfast']);
    expect(store.busy).toBeFalse();
  });

  it('should select templates, compare day sets and reload workspace', () => {
    store.selectTemplate(2);
    expect(templateServiceMock.findOne).toHaveBeenCalledWith(2, null);
    expect(store.selectedTemplateId).toBe(2);
    store.onCompareDaySetChange(3);
    expect(templateServiceMock.findOne).toHaveBeenCalledWith(2, 3);
    store.onRefreshRequested();
    expect(templateServiceMock.findAll).toHaveBeenCalled();
    store.onBaseUrlChange();
    expect(templateServiceMock.setBaseUrl).toHaveBeenCalled();
  });

  it('should save and delete templates through create and edit paths', () => {
    const saved: Template[] = [];
    store.saveTemplate(
      { mode: 'add', title: ' New template ' },
      null,
      (template) => saved.push(template),
    );
    expect(templateServiceMock.create).toHaveBeenCalledWith({ title: 'New template' });
    expect(saved.length).toBe(1);

    store.saveTemplate(
      { mode: 'edit', title: ' Updated template ' },
      1,
      (template) => saved.push(template),
    );
    expect(templateServiceMock.update).toHaveBeenCalledWith(1, { title: 'Updated template' });
    store.saveTemplate({ mode: 'add', title: '   ' }, null, () => fail('blank title should not save'));

    const deleted = jasmine.createSpy('deleted');
    store.deleteTemplate(1, 1, deleted);
    expect(templateServiceMock.remove).toHaveBeenCalledWith(1);
    expect(deleted).toHaveBeenCalled();
    expect(store.selectedTemplateId).not.toBe(1);
    store.deleteTemplate(0, null, deleted);
  });

  it('should save and delete template items and expose their errors', () => {
    const draft: TemplateItemDraft = {
      id: null,
      itemType: 'product',
      productId: 2,
      dishId: null,
      mealId: null,
      qty: 2,
      qtyUnit: 'unit',
      slotId: 1,
      slotKey: 'breakfast',
      preferredTime: '08:00',
    };
    const saved = jasmine.createSpy('saved');
    store.saveItem(1, draft, saved);
    expect(templateServiceMock.createItem).toHaveBeenCalledWith(1, jasmine.anything());
    expect(saved).toHaveBeenCalled();

    store.saveItem(1, { ...draft, id: 8 }, saved);
    expect(templateServiceMock.updateItem).toHaveBeenCalledWith(1, 8, jasmine.anything());
    store.saveItem(null, draft, saved);

    store.deleteItem(1, 8);
    expect(templateServiceMock.removeItem).toHaveBeenCalledWith(1, 8);
    store.deleteItem(null, 8);

    templateServiceMock.createItem.and.returnValue(throwError(() => new Error('item')));
    store.saveItem(1, draft, saved);
    expect(store.itemError).toContain('Impossible');
    templateServiceMock.removeItem.and.returnValue(throwError(() => new Error('remove item')));
    store.deleteItem(1, 8);
    expect(store.itemError).toContain('Impossible');
  });

  it('should handle template lookup and workspace errors', () => {
    const ready = jasmine.createSpy('ready');
    store.loadTemplateForEdit(0, ready);
    expect(ready).not.toHaveBeenCalled();
    store.loadTemplateForEdit(1, ready);
    expect(ready).toHaveBeenCalledWith(1);

    templateServiceMock.findOne.and.returnValue(throwError(() => new Error('lookup')));
    store.loadTemplateForEdit(9, ready);
    expect(store.lastError).toEqual(jasmine.any(Error));
    templateServiceMock.findAll.and.returnValue(throwError(() => new Error('templates')));
    templateServiceMock.findOne.and.returnValue(of(createTemplate(1)));
    store.onRefreshRequested();
    expect(store.lastError).toEqual(jasmine.any(Error));
    const mocks = createMocks();
    void mocks;
  });
});

function createMocks() {
  const template = createTemplate(1, 'Breakfast');
  const secondTemplate = createTemplate(2, 'Dinner');
  const result = {
    template: {
      baseUrl: 'http://localhost:3000',
      setBaseUrl: jasmine.createSpy('setBaseUrl'),
      findAll: jasmine.createSpy('findAll').and.returnValue(of([template, secondTemplate])),
      findOne: jasmine.createSpy('findOne').and.returnValue(of(template)),
      create: jasmine.createSpy('create').and.returnValue(of(createTemplate(3, 'New template'))),
      update: jasmine.createSpy('update').and.returnValue(of(createTemplate(1, 'Updated template'))),
      remove: jasmine.createSpy('remove').and.returnValue(of(void 0)),
      createItem: jasmine.createSpy('createItem').and.returnValue(of(template)),
      updateItem: jasmine.createSpy('updateItem').and.returnValue(of(template)),
      removeItem: jasmine.createSpy('removeItem').and.returnValue(of(template)),
    },
    product: {
      baseUrl: 'http://localhost:3000',
      setBaseUrl: jasmine.createSpy('setBaseUrl'),
      findAll: jasmine.createSpy('findAll').and.returnValue(of([
        { id: 1, name: 'Milk' },
        { id: 2, name: 'Apple' },
      ])),
    },
    daySet: {
      baseUrl: 'http://localhost:3000',
      setBaseUrl: jasmine.createSpy('setBaseUrl'),
      findAll: jasmine.createSpy('findAll').and.returnValue(of([{ id: 3, title: 'Morning' }])),
    },
    slot: {
      baseUrl: 'http://localhost:3000',
      setBaseUrl: jasmine.createSpy('setBaseUrl'),
      findAll: jasmine.createSpy('findAll').and.returnValue(of([{ id: 1, title: 'Breakfast' }])),
    },
    mealPrep: {
      baseUrl: 'http://localhost:3000',
      setBaseUrl: jasmine.createSpy('setBaseUrl'),
      findAllDishes: jasmine.createSpy('findAllDishes').and.returnValue(of([{ id: 1, name: 'Soup', items: [] }])),
      findAllMeals: jasmine.createSpy('findAllMeals').and.returnValue(of([{ id: 1, name: 'Lunch', items: [] }])),
    },
  };
  return result;
}

function createTemplate(id: number, title = 'Template'): Template {
  return { id, title, items: [], totalsMacros: null };
}
