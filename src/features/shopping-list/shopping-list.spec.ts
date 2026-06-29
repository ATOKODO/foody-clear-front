import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ShoppingList } from './shopping-list';
import { ShoppingListService } from '../../services/shopping-list-service';
import { ProductService } from '../../services/product-service';
import { InventoryService } from '../../services/inventory-service';

describe('ShoppingList', () => {
  let component: ShoppingList;
  let fixture: ComponentFixture<ShoppingList>;

  const shoppingListServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([
      {
        id: 11,
        name: 'Courses semaine',
        items: [
          {
            id: 101,
            productId: 1,
            product: { id: 1, name: 'Poulet' },
            qty: 2,
            qtyUnit: 'kg',
            checked: false,
          },
        ],
      },
    ])),
    findAllTemplates: jasmine.createSpy('findAllTemplates').and.returnValue(of([
      {
        id: 21,
        name: 'Base meal prep',
        items: [
          {
            id: 201,
            productId: 1,
            product: { id: 1, name: 'Poulet' },
            qty: 2,
            qtyUnit: 'kg',
          },
        ],
      },
    ])),
    create: jasmine.createSpy('create').and.returnValue(of({ id: 12, name: 'Nouveau', items: [] })),
    update: jasmine.createSpy('update').and.returnValue(of({ id: 11, name: 'Courses semaine', items: [] })),
    remove: jasmine.createSpy('remove').and.returnValue(of(void 0)),
    createItem: jasmine.createSpy('createItem').and.returnValue(of({ id: 11, name: 'Courses semaine', items: [] })),
    updateItem: jasmine.createSpy('updateItem').and.returnValue(of({ id: 11, name: 'Courses semaine', items: [] })),
    removeItem: jasmine.createSpy('removeItem').and.returnValue(of({ id: 11, name: 'Courses semaine', items: [] })),
    checkAll: jasmine.createSpy('checkAll').and.returnValue(of({ id: 11, name: 'Courses semaine', items: [] })),
    convertChecked: jasmine.createSpy('convertChecked').and.returnValue(of(null)),
    saveTemplate: jasmine.createSpy('saveTemplate').and.returnValue(of({ id: 31, name: 'Sauvegarde', items: [] })),
    updateTemplate: jasmine.createSpy('updateTemplate').and.returnValue(of({ id: 21, name: 'Base meal prep', items: [] })),
    removeTemplate: jasmine.createSpy('removeTemplate').and.returnValue(of(void 0)),
    createFromTemplate: jasmine.createSpy('createFromTemplate').and.returnValue(of({ id: 13, name: 'Depuis modele', items: [] })),
  };

  const productServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([
      { id: 1, name: 'Poulet', unitType: 'Paquet', quantityPerUnit: 1, quantityUnit: 'unit' },
      { id: 2, name: 'Riz', unitType: 'Paquet', quantityPerUnit: 500, quantityUnit: 'g' },
    ])),
  };

  const inventoryServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([
      { id: 4, name: 'Stock principal', inventoryProducts: [] },
    ])),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShoppingList],
      providers: [
        { provide: ShoppingListService, useValue: shoppingListServiceMock },
        { provide: ProductService, useValue: productServiceMock },
        { provide: InventoryService, useValue: inventoryServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShoppingList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render shopping lists and templates', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[data-testid="shopping-list-panel"]')).not.toBeNull();
    expect(element.textContent).toContain('Listes de course');
    expect(element.textContent).toContain('Courses semaine');
    expect(element.textContent).toContain('Base meal prep');
  });

  it('should create a list from the draft form', () => {
    component.draftListName = 'Courses week-end';

    component.createList();

    expect(shoppingListServiceMock.create).toHaveBeenCalledWith({ name: 'Courses week-end' });
  });

  it('should convert checked items into inventory', () => {
    component['selectedListIdState'].set(11);
    component.selectedInventoryId = 4;
    const list = component.selectedList;
    if (!list) {
      fail('selected list should exist');
      return;
    }
    list.items = [
      {
        id: 101,
        productId: 1,
        product: { id: 1, name: 'Poulet' },
        qty: 2,
        qtyUnit: 'kg',
        checked: true,
      },
    ];

    component.convertChecked();

    expect(shoppingListServiceMock.convertChecked).toHaveBeenCalledWith(11, { inventoryId: 4 });
  });
});
