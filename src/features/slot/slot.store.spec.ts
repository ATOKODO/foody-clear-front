import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { SlotFeatureStore } from './slot.store';
import { MetaService } from '../../services/meta-service';
import { SlotService } from '../../services/slot-service';

describe('SlotFeatureStore', () => {
  let store: SlotFeatureStore;
  let slotServiceMock: ReturnType<typeof createMocks>['slot'];
  let metaServiceMock: ReturnType<typeof createMocks>['meta'];

  beforeEach(() => {
    const mocks = createMocks();
    slotServiceMock = mocks.slot;
    metaServiceMock = mocks.meta;
    TestBed.configureTestingModule({
      providers: [
        SlotFeatureStore,
        { provide: SlotService, useValue: slotServiceMock },
        { provide: MetaService, useValue: metaServiceMock },
      ],
    });
    store = TestBed.inject(SlotFeatureStore);
  });

  it('should refresh slots and nutrition metadata', () => {
    store.refresh();
    expect(store.slots.length).toBe(1);
    expect(store.slotListItems()[0].id).toBe('1');
    expect(store.nutritionKeys.length).toBe(1);
    expect(store.loading).toBeFalse();
    expect(store.loadingMeta).toBeFalse();
  });

  it('should manage create, edit, delete and errors', () => {
    store.refresh();
    expect(store.onEditRequested({ id: 'bad' } as never)).toBeFalse();
    expect(store.onEditRequested({ id: '99' } as never)).toBeFalse();
    expect(store.openCreate()).toBeTrue();
    expect(store.formVisible()).toBeTrue();
    const changed = jasmine.createSpy('changed');
    store.onFormSubmitted({
      mode: 'add',
      value: {
        key: ' breakfast ',
        title: 'Breakfast',
        sortOrder: 1,
        startTime: null,
        endTime: null,
        nutritionValues: [],
      },
    }, changed);
    expect(slotServiceMock.create).toHaveBeenCalled();
    expect(changed).toHaveBeenCalled();
    store.onEditRequested(store.slotListItems()[0]);
    store.onFormSubmitted({
      mode: 'edit',
      value: {
        key: 'breakfast',
        title: 'Morning',
        sortOrder: 1,
        startTime: null,
        endTime: null,
        nutritionValues: [],
      },
    }, changed);
    expect(slotServiceMock.update).toHaveBeenCalledWith(1, jasmine.anything());
    store.onDeleteRequested(store.slotListItems()[0], changed);
    expect(slotServiceMock.remove).toHaveBeenCalledWith(1);
    store.onMenuClicked();
    expect(store.lastResponse).toEqual(jasmine.objectContaining({ info: jasmine.any(String) }));

    slotServiceMock.findAll.and.returnValue(throwError(() => new Error('load')));
    metaServiceMock.getNutritionKeys.and.returnValue(throwError(() => new Error('meta')));
    store.refresh();
    expect(store.lastError).toEqual(jasmine.any(Error));
    expect(store.lastMetaError).toEqual(jasmine.any(Error));
    slotServiceMock.create.and.returnValue(throwError(() => new Error('create')));
    store.onFormSubmitted({ mode: 'add', value: { key: 'x', title: 'X', sortOrder: 1, nutritionValues: [] } as never }, changed);
    expect(store.lastError).toEqual(jasmine.any(Error));
  });
});

function createMocks() {
  return {
    slot: {
      baseUrl: 'http://localhost:3000',
      setBaseUrl: jasmine.createSpy('setBaseUrl'),
      findAll: jasmine.createSpy('findAll').and.returnValue(of([
        { id: 1, key: 'breakfast', title: 'Breakfast', sortOrder: 1, nutritionValues: [] },
      ])),
      create: jasmine.createSpy('create').and.returnValue(of({ id: 2, key: 'lunch', title: 'Lunch', sortOrder: 2, nutritionValues: [] })),
      update: jasmine.createSpy('update').and.returnValue(of({ id: 1, key: 'breakfast', title: 'Morning', sortOrder: 1, nutritionValues: [] })),
      remove: jasmine.createSpy('remove').and.returnValue(of(void 0)),
    },
    meta: {
      getNutritionKeys: jasmine.createSpy('getNutritionKeys').and.returnValue(of([
        { key: 'PROTEIN', value: 'protein', label: 'Protein', allowedUnits: ['g'] },
      ])),
    },
  };
}
