import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { DaySetFeature } from './day-set.feature';
import { DaySetService } from '../../services/day-set-service';
import { MetaService } from '../../services/meta-service';
import { SlotService } from '../../services/slot-service';
import { TemplateService } from '../../services/template-service';
import type { DaySet } from '../../interfaces/day-set.interface';

describe('DaySetFeature', () => {
  let component: DaySetFeature;
  let fixture: ComponentFixture<DaySetFeature>;

  const daySetServiceMock = {
    findAll: jasmine.createSpy('findAll').and.returnValue(of([])),
    create: jasmine.createSpy('create').and.returnValue(of(createDaySet())),
    update: jasmine.createSpy('update').and.returnValue(of(createDaySet())),
    remove: jasmine.createSpy('remove').and.returnValue(of(void 0)),
  };
  const metaServiceMock = {
    getNutritionKeys: jasmine.createSpy('getNutritionKeys').and.returnValue(of([])),
  };
  const slotServiceMock = {
    findAll: jasmine.createSpy('findAll').and.returnValue(of([])),
  };
  const templateServiceMock = {
    findAll: jasmine.createSpy('findAll').and.returnValue(of([])),
  };

  beforeEach(async () => {
    daySetServiceMock.findAll.and.returnValue(of([createDaySet()]));
    daySetServiceMock.create.and.returnValue(of(createDaySet({ id: 2, title: 'Created' })));
    daySetServiceMock.update.and.returnValue(of(createDaySet({ title: 'Updated' })));
    daySetServiceMock.remove.and.returnValue(of(void 0));
    metaServiceMock.getNutritionKeys.and.returnValue(of([
      { key: 'PROTEIN', value: 'protein', label: 'Protein', allowedUnits: ['g'] },
    ]));
    slotServiceMock.findAll.and.returnValue(of([
      { id: 2, key: 'breakfast', title: 'Breakfast', sortOrder: 1 },
    ]));
    templateServiceMock.findAll.and.returnValue(of([
      { id: 2, title: 'Z template' },
      { id: 1, title: 'A template' },
    ]));

    await TestBed.configureTestingModule({
      imports: [DaySetFeature],
      providers: [
        { provide: DaySetService, useValue: daySetServiceMock },
        { provide: MetaService, useValue: metaServiceMock },
        { provide: SlotService, useValue: slotServiceMock },
        { provide: TemplateService, useValue: templateServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DaySetFeature);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load and map day sets, slots, templates and nutrition metadata', () => {
    expect(component.daySets.length).toBe(1);
    expect(component.daySetListItems()).toEqual([
      jasmine.objectContaining({ id: '1', title: 'Breakfast day', templateTitle: 'Template' }),
    ]);
    expect(component.slotListItems()).toEqual([
      jasmine.objectContaining({ id: '2', title: 'Breakfast' }),
    ]);
    expect(component.templates.map((template) => template.title)).toEqual(['A template', 'Z template']);
    expect(component.nutritionKeys.length).toBe(1);
    expect(component.loading).toBeFalse();
    expect(component.loadingMeta).toBeFalse();
  });

  it('should manage create, edit, delete and form state transitions', () => {
    const emitSpy = spyOn(component.dataChanged, 'emit');
    component.openCreate();
    expect(component.formVisible()).toBeTrue();
    expect(component.formMode).toBe('add');

    component.onFormSubmitted({
      mode: 'add',
      value: {
        title: 'New day',
        nutritionValues: [
          { nutritionKey: ' protein ', amount: -2, unit: 'g', reference: 'PER_100G' },
          { nutritionKey: ' ', amount: Number.NaN, unit: 'g', reference: 'PER_100G' },
        ],
        slotIds: [2, 2, 0],
        templateId: 3,
      },
    });
    expect(daySetServiceMock.create).toHaveBeenCalledWith({
      title: 'New day',
      nutritionValues: [{ nutritionKey: 'PROTEIN', amount: 0, unit: 'g', reference: 'PER_100G' }],
      slotIds: [2],
      templateId: 3,
    });
    expect(emitSpy).toHaveBeenCalled();
    expect(component.formVisible()).toBeFalse();

    component.onEditRequested(component.daySetListItems()[0]);
    expect(component.formMode).toBe('edit');
    expect(component.editingDaySetId).toBe(1);
    expect(component.formInitialValue?.slotIds).toEqual([2]);
    component.onFormSubmitted({
      mode: 'edit',
      value: {
        title: 'Updated day',
        nutritionValues: [],
        slotIds: [],
        templateId: null,
      },
    });
    expect(daySetServiceMock.update).toHaveBeenCalledWith(1, jasmine.anything());
    expect(component.formVisible()).toBeFalse();

    component.onEditRequested({ id: 'not-a-number', title: '', nutritionValues: [], templateTitle: null });
    component.onDeleteRequested(component.daySetListItems()[0]);
    expect(daySetServiceMock.remove).toHaveBeenCalledWith(1);
    expect(emitSpy).toHaveBeenCalled();
    component.onMenuClicked();
    expect(component.lastResponse).toEqual(jasmine.objectContaining({ info: jasmine.any(String) }));
    component.onCancelForm();
    expect(component.formMode).toBe('add');
  });

  it('should cover normalization, fallback and error branches', () => {
    const callPrivate = privateMethod(component);
    const daySet = createDaySet();
    expect(callPrivate('normalizeNutritionValues', [
      { nutritionKey: ' protein ', amount: -1, unit: 'g', reference: 'PER_100G' },
      { nutritionKey: ' ', amount: 2, unit: 'g', reference: 'PER_100G' },
    ])).toEqual([{ nutritionKey: 'PROTEIN', amount: 0, unit: 'g', reference: 'PER_100G' }]);
    expect(callPrivate('normalizeSlotIds', [1, 1, 0, -2, 3.5])).toEqual([1]);
    expect(callPrivate('getEditableNutritionValues', daySet)).toEqual(daySet.nutritionValues);
    expect(callPrivate('getEditableNutritionValues', { ...daySet, nutritionValues: [] })).toEqual([
      jasmine.objectContaining({ nutritionKey: 'PROTEIN' }),
      jasmine.objectContaining({ nutritionKey: 'CARBOHYDRATE' }),
      jasmine.objectContaining({ nutritionKey: 'FAT' }),
    ]);
    expect(callPrivate('resolveDaySetSlotIds', { ...daySet, slotIds: [2, 2] })).toEqual([2]);
    expect(callPrivate('resolveDaySetSlotIds', { ...daySet, slotIds: [], slots: [2, { id: 3 }, { id: 'bad' }] })).toEqual([2, 3]);

    component.embeddedDialogTopOffset.set(20);
    component.onWindowResize();
    fixture.componentRef.setInput('embedded', true);
    component.onWindowResize();
    component.onAddRequested();
    expect(component.formVisible()).toBeTrue();
    component.onCancelForm();

    metaServiceMock.getNutritionKeys.and.returnValue(throwError(() => new Error('meta')));
    slotServiceMock.findAll.and.returnValue(throwError(() => new Error('slots')));
    templateServiceMock.findAll.and.returnValue(throwError(() => new Error('templates')));
    daySetServiceMock.findAll.and.returnValue(throwError(() => new Error('day sets')));
    component.refresh();
    expect(component.lastMetaError).toEqual(jasmine.any(Error));
    expect(component.lastError).toEqual(jasmine.any(Error));
    expect(component.daySets).toEqual([daySet]);

    daySetServiceMock.create.and.returnValue(throwError(() => new Error('create')));
    component.onFormSubmitted({
      mode: 'add',
      value: { title: 'Error', nutritionValues: [], slotIds: [], templateId: null },
    });
    expect(component.lastError).toEqual(jasmine.any(Error));
    daySetServiceMock.remove.and.returnValue(throwError(() => new Error('remove')));
    component.onDeleteRequested({ id: '1', title: 'Error', nutritionValues: [], templateTitle: null });
    expect(component.lastError).toEqual(jasmine.any(Error));
  });
});

function privateMethod(
  component: DaySetFeature,
): (name: string, ...args: unknown[]) => unknown {
  const methods = component as unknown as Record<string, (...args: unknown[]) => unknown>;
  return (name, ...args) => methods[name](...args);
}

function createDaySet(overrides: Partial<DaySet> = {}): DaySet {
  return {
    id: 1,
    title: 'Breakfast day',
    nutritionValues: [
      { nutritionKey: 'PROTEIN', amount: 20, unit: 'g', reference: 'PER_100G' },
    ],
    slotIds: [2],
    slots: [{ id: 2 }],
    templateId: 4,
    template: { id: 4, title: 'Template' },
    ...overrides,
  };
}
