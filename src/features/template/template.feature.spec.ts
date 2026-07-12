import { OverlayContainer } from '@angular/cdk/overlay';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';

import { TemplateFeature } from './template.feature';
import { TemplateService } from '../../services/template-service';
import { ProductService } from '../../services/product-service';
import { DaySetService } from '../../services/day-set-service';
import { SlotService } from '../../services/slot-service';
import { MealPrepService } from '../../services/meal-prep-service';
import { TemplateItemDraft } from '../../components/template/template-form/template-form';
import type { Template } from '../../interfaces/template.interface';

describe('TemplateFeature', () => {
  let component: TemplateFeature;
  let fixture: ComponentFixture<TemplateFeature>;
  let overlayContainer: OverlayContainer;

  const templates = [
    {
      id: 1,
      title: 'Template test',
      items: [],
      totalsMacros: null,
    },
    {
      id: 2,
      title: 'Template repos',
      items: [],
      totalsMacros: null,
    },
  ];

  const templateServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of(templates)),
    findOne: jasmine.createSpy('findOne').and.returnValue(
      of({
        id: 1,
        title: 'Template test',
        items: [],
        totalsMacros: null,
      }),
    ),
    create: jasmine.createSpy('create').and.returnValue(
      of({
        id: 1,
        title: 'Template test',
        items: [],
        totalsMacros: null,
      }),
    ),
    update: jasmine.createSpy('update').and.returnValue(
      of({
        id: 1,
        title: 'Template test',
        items: [],
        totalsMacros: null,
      }),
    ),
    remove: jasmine.createSpy('remove').and.returnValue(of(void 0)),
    createItem: jasmine.createSpy('createItem').and.returnValue(
      of({
        id: 1,
        title: 'Template test',
        items: [],
        totalsMacros: null,
      }),
    ),
    updateItem: jasmine.createSpy('updateItem').and.returnValue(
      of({
        id: 1,
        title: 'Template test',
        items: [],
        totalsMacros: null,
      }),
    ),
    removeItem: jasmine.createSpy('removeItem').and.returnValue(
      of({
        id: 1,
        title: 'Template test',
        items: [],
        totalsMacros: null,
      }),
    ),
  };

  const productServiceMock = {
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([])),
  };

  const daySetServiceMock = {
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([])),
  };

  const slotServiceMock = {
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([])),
  };

  const mealPrepServiceMock = {
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAllDishes: jasmine.createSpy('findAllDishes').and.returnValue(of([])),
    findAllMeals: jasmine.createSpy('findAllMeals').and.returnValue(of([])),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateFeature],
      providers: [
        { provide: TemplateService, useValue: templateServiceMock },
        { provide: ProductService, useValue: productServiceMock },
        { provide: DaySetService, useValue: daySetServiceMock },
        { provide: SlotService, useValue: slotServiceMock },
        { provide: MealPrepService, useValue: mealPrepServiceMock },
      ],
    }).compileComponents();

    templateServiceMock.setBaseUrl.calls.reset();
    templateServiceMock.findAll.calls.reset();
    templateServiceMock.findAll.and.returnValue(of(templates));
    templateServiceMock.findOne.calls.reset();
    templateServiceMock.findOne.and.returnValue(
      of({
        id: 1,
        title: 'Template test',
        items: [],
        totalsMacros: null,
      }),
    );
    templateServiceMock.create.calls.reset();
    templateServiceMock.update.calls.reset();
    templateServiceMock.remove.calls.reset();
    templateServiceMock.createItem.calls.reset();
    templateServiceMock.updateItem.calls.reset();
    templateServiceMock.removeItem.calls.reset();

    productServiceMock.setBaseUrl.calls.reset();
    productServiceMock.findAll.calls.reset();

    daySetServiceMock.setBaseUrl.calls.reset();
    daySetServiceMock.findAll.calls.reset();

    slotServiceMock.setBaseUrl.calls.reset();
    slotServiceMock.findAll.calls.reset();

    mealPrepServiceMock.setBaseUrl.calls.reset();
    mealPrepServiceMock.findAllDishes.calls.reset();
    mealPrepServiceMock.findAllMeals.calls.reset();

    fixture = TestBed.createComponent(TemplateFeature);
    component = fixture.componentInstance;
    overlayContainer = TestBed.inject(OverlayContainer);
    fixture.detectChanges();
  });

  afterEach(() => {
    overlayContainer.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the simplified template header actions', () => {
    const nativeElement = fixture.nativeElement as HTMLElement;

    expect(
      nativeElement.querySelector('[data-testid="template-panel-title"]')
        ?.textContent,
    ).toContain('Templates');
    expect(
      nativeElement.querySelector('[data-testid="template-refresh-action"]')
        ?.textContent,
    ).toContain('Rafraichir');
    expect(
      nativeElement.querySelector('[data-testid="template-add"]')?.textContent,
    ).toContain('New template');
  });

  it('should enable the header actions after initial loading completes', async () => {
    fixture.autoDetectChanges();
    await fixture.whenStable();

    const refreshButton = fixture.nativeElement.querySelector(
      '[data-testid="template-refresh-action"]',
    ) as HTMLButtonElement;
    const addButton = fixture.nativeElement.querySelector(
      '[data-testid="template-add"]',
    ) as HTMLButtonElement;

    expect(refreshButton.disabled).toBeFalse();
    expect(addButton.disabled).toBeFalse();
  });

  it('should open the new template dialog from the header action', async () => {
    fixture.autoDetectChanges();
    await fixture.whenStable();

    const addButton = fixture.nativeElement.querySelector(
      '[data-testid="template-add"]',
    ) as HTMLButtonElement;
    addButton.click();
    await fixture.whenStable();

    const overlay = overlayContainer.getContainerElement();
    expect(
      overlay.querySelector('[data-testid="template-dialog"]'),
    ).not.toBeNull();
    expect(overlay.textContent).toContain('Nouveau template');
  });

  it('should render refreshed templates after an async response', async () => {
    const refreshedTemplates$ = new Subject<typeof templates>();
    templateServiceMock.findAll.and.returnValue(refreshedTemplates$);
    component.selectedTemplateId = null;
    component.selectedTemplate = null;
    fixture.autoDetectChanges();
    await fixture.whenStable();

    const refreshButton = fixture.nativeElement.querySelector(
      '[data-testid="template-refresh-action"]',
    ) as HTMLButtonElement;
    refreshButton.click();

    refreshedTemplates$.next([
      {
        id: 77,
        title: 'Modele async',
        items: [],
        totalsMacros: null,
      },
    ]);
    refreshedTemplates$.complete();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(
      element.querySelector('[data-testid="template-select-77"]'),
    ).not.toBeNull();
    expect(element.textContent).toContain('Modele async');
  });

  it('should refresh all template dependencies and preserve the current selection', () => {
    component.selectedTemplateId = 2;
    component.selectedTemplate = templates[1];
    component.compareDaySetId = 9;
    templateServiceMock.findOne.and.returnValue(
      of({
        id: 2,
        title: 'Template repos',
        items: [],
        totalsMacros: null,
      }),
    );

    component.onRefreshRequested();

    expect(productServiceMock.findAll).toHaveBeenCalled();
    expect(daySetServiceMock.findAll).toHaveBeenCalled();
    expect(slotServiceMock.findAll).toHaveBeenCalled();
    expect(templateServiceMock.findAll).toHaveBeenCalled();
    expect(templateServiceMock.findOne).toHaveBeenCalledWith(2, 9);
    expect(component.selectedTemplateId).toBe(2);
  });

  it('should remove the selected template via the list action and keep no fallback selection', () => {
    component.selectedTemplateId = 1;
    component.selectedTemplate = templates[0];
    templateServiceMock.findAll.and.returnValue(of([templates[1]]));

    component.onTemplateDeleteRequested(1);

    expect(templateServiceMock.remove).toHaveBeenCalledWith(1);
    expect(component.selectedTemplateId).toBeNull();
    expect(component.selectedTemplate).toBeNull();
  });

  it('should create one template item with the selected product payload', () => {
    component.editingTemplateId = 1;

    const draft: TemplateItemDraft = {
      id: null,
      itemType: 'product',
      productId: 7,
      dishId: null,
      mealId: null,
      qty: 2,
      qtyUnit: 'portion',
      slotId: 5,
      slotKey: 'snack',
      preferredTime: '06:00',
    };

    component.onItemSubmitted(draft);

    expect(templateServiceMock.createItem).toHaveBeenCalledTimes(1);
    expect(templateServiceMock.createItem).toHaveBeenCalledWith(1, {
      itemType: 'product',
      productId: 7,
      qty: 2,
      qtyUnit: 'portion',
      slotId: 5,
      slotKey: 'snack',
    });
  });

  it('should update one template item with the reselected product payload', () => {
    component.editingTemplateId = 1;

    const draft: TemplateItemDraft = {
      id: 11,
      itemType: 'product',
      productId: 8,
      dishId: null,
      mealId: null,
      qty: 3,
      qtyUnit: 'g',
      slotId: null,
      slotKey: '',
      preferredTime: '07:30',
    };

    component.onItemSubmitted(draft);

    expect(templateServiceMock.updateItem).toHaveBeenCalledTimes(1);
    expect(templateServiceMock.updateItem).toHaveBeenCalledWith(1, 11, {
      itemType: 'product',
      productId: 8,
      qty: 3,
      qtyUnit: 'g',
      slotId: null,
      preferredTime: '07:30',
    });
  });

  it('should expose store state and delegate all editor actions', () => {
    const store = (component as any).store as any;
    const template = templates[0];

    component.baseUrl = 'http://changed.local';
    expect(component.baseUrl).toBe('http://changed.local');
    component.templates = templates;
    component.products = [];
    component.dishes = [];
    component.meals = [];
    component.daySets = [];
    component.slots = [];
    component.selectedTemplateId = 1;
    component.selectedTemplate = template;
    component.compareDaySetId = 9;
    component.loadingTemplates = true;
    component.loadingProducts = true;
    component.loadingMealPrep = true;
    component.loadingDaySets = true;
    component.loadingSlots = true;
    component.savingTemplate = true;
    component.savingItem = true;
    component.lastError = 'error';
    component.itemError = 'item error';
    component.lastResponse = { ok: true };

    expect(component.templates).toBe(templates);
    expect(component.products).toEqual([]);
    expect(component.dishes).toEqual([]);
    expect(component.meals).toEqual([]);
    expect(component.daySets).toEqual([]);
    expect(component.slots).toEqual([]);
    expect(component.selectedTemplateId).toBe(1);
    expect(component.selectedTemplate).toBe(template);
    expect(component.compareDaySetId).toBe(9);
    expect(component.loadingTemplates).toBeTrue();
    expect(component.loadingProducts).toBeTrue();
    expect(component.loadingMealPrep).toBeTrue();
    expect(component.loadingDaySets).toBeTrue();
    expect(component.loadingSlots).toBeTrue();
    expect(component.savingTemplate).toBeTrue();
    expect(component.savingItem).toBeTrue();
    expect(component.lastError).toBe('error');
    expect(component.itemError).toBe('item error');
    expect(component.lastResponse).toEqual({ ok: true });
    expect(component.productOptions).toEqual([]);
    expect(component.dishOptions).toEqual([]);
    expect(component.mealOptions).toEqual([]);
    expect(component.daySetOptions).toEqual([]);
    expect(component.slotOptions).toEqual([]);
    expect(component.busy).toBeTrue();

    component.editingTemplateId = null;
    expect(component.editedTemplate).toBeNull();
    component.editingTemplateId = 99;
    expect(component.editedTemplate).toBeNull();
    component.editingTemplateId = 1;
    expect(component.editedTemplate).toBe(template);
    component.formMode = 'add';
    expect(component.formDialogTitle).toBe('Nouveau template');
    expect(component.formDialogSubtitle).toContain('Create');
    component.formMode = 'edit';
    expect(component.formDialogTitle).toBe('Edit template');
    expect(component.formDialogSubtitle).toContain('Update');

    spyOn(store, 'onBaseUrlChange');
    spyOn(store, 'onRefreshRequested');
    spyOn(store, 'selectTemplate');
    spyOn(store, 'onCompareDaySetChange');
    component.onBaseUrlChange();
    component.onRefreshRequested();
    component.selectTemplate(2);
    component.onCompareDaySetChange(null);
    expect(store.onBaseUrlChange).toHaveBeenCalled();
    expect(store.onRefreshRequested).toHaveBeenCalled();
    expect(store.selectTemplate).toHaveBeenCalledWith(2);
    expect(store.onCompareDaySetChange).toHaveBeenCalledWith(null);

    component.selectedTemplateId = null;
    component.selectedTemplate = null;
    component.openSelectedTemplateEditor();
    component.selectedTemplateId = 1;
    component.selectedTemplate = template;
    spyOn(store, 'loadTemplateForEdit').and.callFake((_id: number, callback: (id: number) => void) => callback(1));
    component.onTemplateEditRequested(1);
    expect(component.formMode).toBe('edit');
    expect(component.editingTemplateId).toBe(1);
    component.closeEditorDialog();

    spyOn(store, 'saveTemplate').and.callFake((_event: unknown, _id: number | null, callback: (value: Template) => void) => callback(template));
    component.onTemplateSubmitted({ mode: 'add', value: { title: 'New', items: [] } } as any);
    expect(component.editingTemplateId).toBe(1);
    expect(component.formMode).toBe('edit');

    spyOn(store, 'deleteTemplate').and.callFake((_id: number, _editingId: number | null, callback: () => void) => callback());
    component.onTemplateDeleteRequested(1);
    spyOn(store, 'saveItem').and.callFake((_id: number | null, _draft: TemplateItemDraft, callback: (value: Template) => void) => callback(template));
    component.onItemSubmitted({ id: null } as TemplateItemDraft);
    expect(component.editingTemplateId).toBe(1);
    spyOn(store, 'deleteItem');
    component.onItemDeleted(11);
    expect(store.deleteItem).toHaveBeenCalledWith(1, 11);

    component.startCreateTemplate();
    component.closeEditorDialog();
    expect(component.formMode).toBe('add');
    expect(component.editingTemplateId).toBeNull();
  });
});
