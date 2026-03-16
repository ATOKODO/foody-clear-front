import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TemplateFeature } from './template.feature';
import { TemplateService } from '../../services/template-service';
import { ProductService } from '../../services/product-service';
import { DaySetService } from '../../services/day-set-service';
import { SlotService } from '../../services/slot-service';

describe('TemplateFeature', () => {
  let component: TemplateFeature;
  let fixture: ComponentFixture<TemplateFeature>;

  const templateServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([])),
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

    fixture = TestBed.createComponent(TemplateFeature);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
