import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ShoppingListStore } from './shopping-list.store';
import { InventoryService } from '../../services/inventory-service';
import { ProductService } from '../../services/product-service';
import { ShoppingListService } from '../../services/shopping-list-service';
import type { ShoppingList, ShoppingListTemplate } from '../../interfaces/shopping-list.interface';

describe('ShoppingListStore', () => {
  let store: ShoppingListStore;
  let shoppingListServiceMock: ReturnType<typeof createMocks>['shoppingList'];
  let productServiceMock: ReturnType<typeof createMocks>['product'];
  let inventoryServiceMock: ReturnType<typeof createMocks>['inventory'];

  beforeEach(() => {
    const mocks = createMocks();
    shoppingListServiceMock = mocks.shoppingList;
    productServiceMock = mocks.product;
    inventoryServiceMock = mocks.inventory;

    TestBed.configureTestingModule({
      providers: [
        ShoppingListStore,
        { provide: ShoppingListService, useValue: shoppingListServiceMock },
        { provide: ProductService, useValue: productServiceMock },
        { provide: InventoryService, useValue: inventoryServiceMock },
      ],
    });
    store = TestBed.inject(ShoppingListStore);
    store.init();
  });

  it('should load the workspace and expose selected data and derived options', () => {
    expect(store.shoppingLists.length).toBe(1);
    expect(store.templates.length).toBe(1);
    expect(store.products.length).toBe(2);
    expect(store.inventories.length).toBe(1);
    expect(store.selectedList?.id).toBe(1);
    expect(store.selectedTemplate?.id).toBe(5);
    expect(store.selectedInventoryId).toBe(7);
    expect(store.checkedItemCount).toBe(1);
    expect(store.productPickerSelectedIds).toEqual([]);
    expect(store.resolveDraftProductName()).toBe('No product selected');
    expect(store.resolveProductName(store.selectedList!.items[0])).toBe('Milk');
    expect(store.getDraftQtyUnitOptions().length).toBeGreaterThan(0);
    expect(store.getItemQtyUnitOptions(store.selectedList!.items[0]).length).toBeGreaterThan(0);
  });

  it('should manage editors, selections, keyboard escape and draft product changes', () => {
    store.openCreateListEditor();
    expect(store.isListEditorOpen).toBeTrue();
    expect(store.listEditorMode).toBe('create');
    expect(store.draftListName).toContain('Shopping list');
    store.closeListEditor();
    expect(store.isListEditorOpen).toBeFalse();

    store.openSelectedListEditor();
    expect(store.isListEditorOpen).toBeTrue();
    expect(store.listEditorMode).toBe('edit');
    store.openSelectedTemplateEditor();
    expect(store.isTemplateEditorOpen).toBeTrue();
    store.closeTemplateEditor();
    expect(store.isTemplateEditorOpen).toBeFalse();

    store.openProductPicker();
    expect(store.isProductPickerOpen).toBeTrue();
    store.onProductPicked({ id: '2', name: 'Bread' } as never);
    expect(store.draftItemProductId).toBe(2);
    expect(store.productPickerSelectedIds).toEqual(['2']);
    expect(store.isProductPickerOpen).toBeFalse();
    store.onEscapeKey();
    expect(store.isListEditorOpen).toBeFalse();

    store.selectList(1);
    expect(store.templateDraftName).toBe('Weekly groceries modele');
    store.selectList(999);
    expect(store.templateDraftName).toBe('');
    store.selectTemplate(5);
    expect(store.templateCreateListName).toBe('Base template');
    store.selectTemplate(999);
    expect(store.templateCreateListName).toBe('');
    store.onDraftProductChange(1);
    expect(store.resolveDraftProductName()).toBe('Milk');
    store.onActiveViewChange('template');
    expect(store.activeView).toBe('template');
    store.saveListEditor();
    store.saveTemplateEditor();
  });

  it('should execute shopping list and item mutations', () => {
    store.draftListName = ' New list ';
    store.createList();
    expect(shoppingListServiceMock.create).toHaveBeenCalledWith({ name: 'New list' });
    expect(store.shoppingLists.some((list) => list.id === 2)).toBeTrue();

    store.selectList(1);
    store.selectedList!.name = 'Renamed';
    store.renameSelectedList();
    expect(shoppingListServiceMock.update).toHaveBeenCalledWith(1, { name: 'Renamed' });

    store.draftItemProductId = 2;
    store.draftItemQty = 3;
    store.addItemToSelectedList();
    expect(shoppingListServiceMock.createItem).toHaveBeenCalledWith(1, {
      productId: 2,
      qty: 3,
      qtyUnit: 'unit',
    });

    const item = store.selectedList!.items[0];
    store.toggleItem(item, false);
    expect(shoppingListServiceMock.updateItem).toHaveBeenCalledWith(1, item.id, jasmine.anything());
    store.saveItem(item);
    store.removeItem(item.id);
    expect(shoppingListServiceMock.removeItem).toHaveBeenCalledWith(1, item.id);
    store.setAllChecked(true);
    expect(shoppingListServiceMock.checkAll).toHaveBeenCalledWith(1, { checked: true });
    store.selectedInventoryId = 7;
    store.convertChecked();
    expect(shoppingListServiceMock.convertChecked).toHaveBeenCalledWith(1, { inventoryId: 7 });
  });

  it('should execute template mutations and convert all items', () => {
    store.selectList(1);
    store.selectedInventoryId = 7;
    store.convertAll();
    expect(shoppingListServiceMock.checkAll).toHaveBeenCalledWith(1, { checked: true });
    expect(shoppingListServiceMock.convertChecked).toHaveBeenCalledWith(1, { inventoryId: 7 });

    store.templateDraftName = ' Saved template ';
    store.saveAsTemplate();
    expect(shoppingListServiceMock.saveTemplate).toHaveBeenCalledWith(1, { name: 'Saved template' });

    store.selectTemplate(5);
    store.selectedTemplate!.name = 'Renamed template';
    store.renameSelectedTemplate();
    expect(shoppingListServiceMock.updateTemplate).toHaveBeenCalledWith(5, { name: 'Renamed template' });
    store.templateCreateListName = 'Created from template';
    store.createListFromTemplate();
    expect(shoppingListServiceMock.createFromTemplate).toHaveBeenCalledWith(5, {
      name: 'Created from template',
    });
    store.deleteSelectedTemplate();
    expect(shoppingListServiceMock.removeTemplate).toHaveBeenCalledWith(5);

    store.selectList(1);
    store.deleteSelectedList();
    expect(shoppingListServiceMock.remove).toHaveBeenCalledWith(1);
    expect(store.selectedList).not.toBeNull();
  });

  it('should handle nullable updates, guards and request errors', () => {
    store.selectList(1);
    shoppingListServiceMock.removeItem.and.returnValue(of(null));
    store.removeItem(101);
    expect(store.shoppingLists.some((list) => list.id === 1)).toBeFalse();

    store.openCreateListEditor();
    setSaving(store, true);
    store.openCreateListEditor();
    store.openProductPicker();
    store.closeListEditor();
    store.closeTemplateEditor();
    store.createList();
    store.addItemToSelectedList();
    store.setAllChecked(true);
    store.convertChecked();
    store.convertAll();
    setSaving(store, false);

    shoppingListServiceMock.findAll.and.returnValue(throwError(() => new Error('load')));
    store.loadScreen();
    expect(store.lastError).toEqual(jasmine.any(Error));
    shoppingListServiceMock.create.and.returnValue(throwError(() => new Error('create')));
    store.draftListName = 'Error';
    store.createList();
    expect(store.lastError).toEqual(jasmine.any(Error));
    shoppingListServiceMock.update.and.returnValue(throwError(() => new Error('update')));
    store.selectList(1);
    store.renameSelectedList();
    expect(store.lastError).toEqual(jasmine.any(Error));
  });
});

function createMocks() {
  const list = createList();
  const template: ShoppingListTemplate = {
    id: 5,
    name: 'Base template',
    items: [
      { id: 501, productId: 1, product: { id: 1, name: 'Milk' }, qty: 1, qtyUnit: 'unit' },
    ],
  };
  const updatedList = createList({ name: 'Updated list' });
  const shoppingList = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([list])),
    findAllTemplates: jasmine.createSpy('findAllTemplates').and.returnValue(of([template])),
    create: jasmine.createSpy('create').and.returnValue(of(createList({ id: 2, name: 'New list' }))),
    update: jasmine.createSpy('update').and.returnValue(of(updatedList)),
    remove: jasmine.createSpy('remove').and.returnValue(of(void 0)),
    createItem: jasmine.createSpy('createItem').and.returnValue(of(updatedList)),
    updateItem: jasmine.createSpy('updateItem').and.returnValue(of(updatedList)),
    removeItem: jasmine.createSpy('removeItem').and.returnValue(of(updatedList)),
    checkAll: jasmine.createSpy('checkAll').and.returnValue(of(updatedList)),
    convertChecked: jasmine.createSpy('convertChecked').and.returnValue(of(updatedList)),
    saveTemplate: jasmine.createSpy('saveTemplate').and.returnValue(of({ id: 6, name: 'Saved', items: [] })),
    updateTemplate: jasmine.createSpy('updateTemplate').and.returnValue(of({ id: 5, name: 'Renamed template', items: [] })),
    removeTemplate: jasmine.createSpy('removeTemplate').and.returnValue(of(void 0)),
    createFromTemplate: jasmine.createSpy('createFromTemplate').and.returnValue(of(createList({ id: 3, name: 'From template' }))),
  };
  const product = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([
      { id: 1, name: 'Milk', unitType: 'Bouteille', quantityPerUnit: 1, quantityUnit: 'l' },
      { id: 2, name: 'Bread', unitType: 'Paquet', quantityPerUnit: 1, quantityUnit: 'unit' },
    ])),
  };
  const inventory = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([{ id: 7, name: 'Main stock' }])),
  };
  return { shoppingList, product, inventory };
}

function createList(overrides: Partial<ShoppingList> = {}): ShoppingList {
  return {
    id: 1,
    name: 'Weekly groceries',
    items: [
      {
        id: 101,
        productId: 1,
        product: { id: 1, name: 'Milk' },
        qty: 2,
        qtyUnit: 'unit',
        checked: true,
      },
    ],
    ...overrides,
  };
}

function setSaving(store: ShoppingListStore, value: boolean): void {
  const state = store as unknown as {
    savingState: { set(nextValue: boolean): void };
  };
  state.savingState.set(value);
}
