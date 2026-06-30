import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateForm } from './template-form';
import { Product as ProductApiModel } from '../../../services/product-service';
import { Template } from '../../../interfaces/template.interface';

describe('TemplateForm', () => {
  let component: TemplateForm;
  let fixture: ComponentFixture<TemplateForm>;

  const products: ProductApiModel[] = [
    {
      id: 7,
      name: 'Skyr',
      barcode: '111',
      unitType: 'Paquet',
      quantityPerUnit: 150,
      quantityUnit: 'g',
      nutritionValues: [],
    },
    {
      id: 8,
      name: 'Riz',
      barcode: '222',
      unitType: 'Paquet',
      quantityPerUnit: 500,
      quantityUnit: 'g',
      nutritionValues: [],
    },
  ];

  const template = {
    id: 3,
    title: 'Jour training',
    items: [
      {
        id: 11,
        productId: 7,
        productName: 'Skyr',
        qty: 1,
        qtyUnit: 'unit',
        qtyNormalized: 1,
        slotId: null,
        slotKey: 'breakfast',
        preferredTime: '07:30:00',
        nutritionValue: null,
        stockAvailability: {
          enoughStock: true,
          totalAvailableNormalized: 10,
          requestedQtyNormalized: 1,
        },
        stockByInventory: [],
      },
    ],
    totalsMacros: null,
  } as unknown as Template;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateForm],
    }).compileComponents();

    fixture = TestBed.createComponent(TemplateForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the item editor when a template is editable', () => {
    fixture.componentRef.setInput('products', products);
    fixture.componentRef.setInput('template', template);
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;

    expect(
      nativeElement.querySelector('[data-testid="template-item-save"]'),
    ).not.toBeNull();
  });

  it('should update the selected product in the draft', () => {
    component.updateItemDraft({ productId: 8 });

    expect(component.itemDraft.itemType).toBe('product');
    expect(component.itemDraft.productId).toBe(8);
    expect(component.itemDraft.dishId).toBeNull();
    expect(component.itemDraft.mealId).toBeNull();
  });

  it('should preload the edited product in the draft', async () => {
    fixture.componentRef.setInput('products', products);
    fixture.componentRef.setInput('template', template);
    fixture.detectChanges();

    component.editItem(template.items[0]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.itemDraft.itemType).toBe('product');
    expect(component.itemDraft.productId).toBe(7);
    expect(component.itemDraft.dishId).toBeNull();
    expect(component.itemDraft.mealId).toBeNull();
  });

  it('should default slotless items to 06:00 and restore their preferred time when editing', async () => {
    fixture.componentRef.setInput('template', template);
    fixture.detectChanges();

    expect(component.itemDraft.preferredTime).toBe('06:00');

    component.editItem(template.items[0]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.itemDraft.preferredTime).toBe('07:30');
    const input = fixture.nativeElement.querySelector(
      'input[type="time"]',
    ) as HTMLInputElement;
    expect(input.value).toBe('07:30');
  });

  it('should keep the item save button disabled until product and qty are valid', async () => {
    fixture.componentRef.setInput('products', products);
    fixture.componentRef.setInput('template', template);
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    const saveButton = nativeElement.querySelector(
      '[data-testid="template-item-save"]',
    ) as HTMLButtonElement;

    expect(saveButton.disabled).toBeTrue();

    component.updateItemDraft({ productId: 8 });
    component.updateItemDraft({ qty: 2 });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const updatedSaveButton = nativeElement.querySelector(
      '[data-testid="template-item-save"]',
    ) as HTMLButtonElement;
    expect(updatedSaveButton.disabled).toBeFalse();
  });
});
