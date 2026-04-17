import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TemplateFeature } from './template.feature';
import { TemplateService } from '../../services/template-service';
import { ProductService } from '../../services/product-service';
import { DaySetService } from '../../services/day-set-service';
import { SlotService } from '../../services/slot-service';
import { TemplateItemDraft } from '../../components/template/template-form/template-form';

describe('TemplateFeature', () => {
  let component: TemplateFeature;
  let fixture: ComponentFixture<TemplateFeature>;

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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateFeature],
      providers: [
        { provide: TemplateService, useValue: templateServiceMock },
        { provide: ProductService, useValue: productServiceMock },
        { provide: DaySetService, useValue: daySetServiceMock },
        { provide: SlotService, useValue: slotServiceMock },
      ],
    })
    .compileComponents();

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

    fixture = TestBed.createComponent(TemplateFeature);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the simplified template header actions', () => {
    const nativeElement = fixture.nativeElement as HTMLElement;

    expect(nativeElement.querySelector('[data-testid="template-panel-title"]')?.textContent)
      .toContain('Modeles');
    expect(nativeElement.querySelector('[data-testid="template-refresh-action"]')?.textContent)
      .toContain('Rafraichir');
    expect(nativeElement.querySelector('[data-testid="template-add"]')?.textContent)
      .toContain('Nouveau modele');
  });

  it('should refresh all template dependencies and preserve the current selection', () => {
    component.selectedTemplateId = 2;
    component.selectedTemplate = templates[1] as (typeof component.selectedTemplate);
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
    component.selectedTemplate = templates[0] as (typeof component.selectedTemplate);
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
      productId: 7,
      qty: 2,
      qtyUnit: 'portion',
      slotId: 5,
      slotKey: 'snack',
    };

    component.onItemSubmitted(draft);

    expect(templateServiceMock.createItem).toHaveBeenCalledTimes(1);
    expect(templateServiceMock.createItem).toHaveBeenCalledWith(1, {
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
      productId: 8,
      qty: 3,
      qtyUnit: 'g',
      slotId: null,
      slotKey: '',
    };

    component.onItemSubmitted(draft);

    expect(templateServiceMock.updateItem).toHaveBeenCalledTimes(1);
    expect(templateServiceMock.updateItem).toHaveBeenCalledWith(1, 11, {
      productId: 8,
      qty: 3,
      qtyUnit: 'g',
    });
  });
});
