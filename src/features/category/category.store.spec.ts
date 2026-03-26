import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { CategoryStore } from './category.store';
import { CategoryService } from '../../services/category-service';

describe('CategoryStore', () => {
  let categoryServiceMock: jasmine.SpyObj<CategoryService>;

  beforeEach(() => {
    categoryServiceMock = jasmine.createSpyObj<CategoryService>(
      'CategoryService',
      ['setBaseUrl', 'findAll', 'create', 'update', 'remove'],
      { baseUrl: 'http://localhost:3000' },
    );

    categoryServiceMock.findAll.and.returnValue(of([]));
    categoryServiceMock.create.and.returnValue(of(createCategory()));
    categoryServiceMock.update.and.returnValue(of(createCategory()));
    categoryServiceMock.remove.and.returnValue(of(void 0));

    TestBed.configureTestingModule({
      providers: [
        CategoryStore,
        { provide: CategoryService, useValue: categoryServiceMock },
      ],
    });
  });

  it('should load categories on init and map a nested payload', () => {
    const response$ = new Subject<unknown>();
    categoryServiceMock.findAll.and.returnValue(response$.asObservable() as never);

    const store = createStore();

    expect(categoryServiceMock.findAll).toHaveBeenCalledTimes(1);
    expect(store.loading()).toBeTrue();

    response$.next({ categories: [createCategory()] });
    response$.complete();

    expect(store.loading()).toBeFalse();
    expect(store.lastError()).toBeNull();
    expect(store.categoryListItems()).toEqual([
      {
        id: '1',
        name: 'Fruits',
        warnBeforeDays: 3,
        recentlyExpiredDays: 1,
        minQuantity: 2,
      },
    ]);
  });

  it('should expose a load error and clear it on refresh success', () => {
    const error = new Error('load failed');
    categoryServiceMock.findAll.and.returnValues(
      throwError(() => error),
      of([createCategory()]),
    );

    const store = createStore();

    expect(store.loading()).toBeFalse();
    expect(store.lastError()).toBe(error);

    store.refresh();

    expect(categoryServiceMock.findAll).toHaveBeenCalledTimes(2);
    expect(store.lastError()).toBeNull();
    expect(store.categoryListItems().length).toBe(1);
  });

  it('should open and cancel the create form state', () => {
    const store = createStore();

    store.openCreateForm();

    expect(store.formVisible()).toBeTrue();
    expect(store.formMode()).toBe('add');
    expect(store.editingCategoryId()).toBeNull();
    expect(store.formInitialValue()).toBeNull();

    store.cancelForm();

    expect(store.formVisible()).toBeFalse();
    expect(store.formMode()).toBe('add');
    expect(store.editingCategoryId()).toBeNull();
    expect(store.formInitialValue()).toBeNull();
  });

  it('should open the edit form with the current category values', () => {
    categoryServiceMock.findAll.and.returnValue(of([createCategory()]));

    const store = createStore();
    const item = store.categoryListItems()[0];

    store.openEditForm(item);

    expect(store.formVisible()).toBeTrue();
    expect(store.formMode()).toBe('edit');
    expect(store.editingCategoryId()).toBe(1);
    expect(store.formInitialValue()).toEqual({
      name: 'Fruits',
      warnBeforeDays: 3,
      recentlyExpiredDays: 1,
      minQuantity: 2,
    });
  });

  it('should create a category, close the form, reload data, and increment mutationVersion', () => {
    const created = createCategory({ id: 2, name: 'Epicerie' });
    categoryServiceMock.findAll.and.returnValues(of([]), of([created]));
    categoryServiceMock.create.and.returnValue(of(created));

    const store = createStore();
    store.openCreateForm();

    store.submitForm({
      mode: 'add',
      value: {
        name: 'Epicerie',
        warnBeforeDays: 7,
        recentlyExpiredDays: 3,
        minQuantity: 4,
      },
    });

    expect(categoryServiceMock.create).toHaveBeenCalledWith({
      name: 'Epicerie',
      warnBeforeDays: 7,
      recentlyExpiredDays: 3,
      minQuantity: 4,
    });
    expect(categoryServiceMock.findAll).toHaveBeenCalledTimes(2);
    expect(store.formVisible()).toBeFalse();
    expect(store.mutationVersion()).toBe(1);
    expect(store.categoryListItems()[0].id).toBe('2');
  });

  it('should update an existing category and increment mutationVersion only on success', () => {
    const existing = createCategory();
    const updated = createCategory({
      name: 'Fruits frais',
      warnBeforeDays: 5,
      recentlyExpiredDays: 2,
      minQuantity: 6,
    });
    categoryServiceMock.findAll.and.returnValues(of([existing]), of([updated]));
    categoryServiceMock.update.and.returnValue(of(updated));

    const store = createStore();
    store.openEditForm(store.categoryListItems()[0]);

    store.submitForm({
      mode: 'edit',
      value: {
        name: 'Fruits frais',
        warnBeforeDays: 5,
        recentlyExpiredDays: 2,
        minQuantity: 6,
      },
    });

    expect(categoryServiceMock.update).toHaveBeenCalledWith(1, {
      name: 'Fruits frais',
      warnBeforeDays: 5,
      recentlyExpiredDays: 2,
      minQuantity: 6,
    });
    expect(store.formVisible()).toBeFalse();
    expect(store.mutationVersion()).toBe(1);
  });

  it('should delete a category, cancel the matching edit form, and increment mutationVersion', () => {
    const current = createCategory();
    const remaining = createCategory({ id: 2, name: 'Epicerie' });
    categoryServiceMock.findAll.and.returnValues(
      of([current, remaining]),
      of([remaining]),
    );

    const store = createStore();
    const item = store.categoryListItems()[0];
    store.openEditForm(item);

    store.deleteCategory(item);

    expect(categoryServiceMock.remove).toHaveBeenCalledWith(1);
    expect(store.formVisible()).toBeFalse();
    expect(store.editingCategoryId()).toBeNull();
    expect(store.mutationVersion()).toBe(1);
    expect(store.categoryListItems()).toEqual([
      {
        id: '2',
        name: 'Epicerie',
        warnBeforeDays: 3,
        recentlyExpiredDays: 1,
        minQuantity: 2,
      },
    ]);
  });

  it('should keep the form open and avoid incrementing mutationVersion on mutation failure', () => {
    const error = new Error('create failed');
    categoryServiceMock.create.and.returnValue(throwError(() => error));

    const store = createStore();
    store.openCreateForm();

    store.submitForm({
      mode: 'add',
      value: {
        name: 'Fruits',
        warnBeforeDays: 3,
        recentlyExpiredDays: 1,
        minQuantity: 2,
      },
    });

    expect(store.saving()).toBeFalse();
    expect(store.formVisible()).toBeTrue();
    expect(store.lastError()).toBe(error);
    expect(store.mutationVersion()).toBe(0);
    expect(categoryServiceMock.findAll).toHaveBeenCalledTimes(1);
  });
});

function createStore(): InstanceType<typeof CategoryStore> {
  return TestBed.inject(CategoryStore) as InstanceType<typeof CategoryStore>;
}

function createCategory(
  overrides: Partial<{
    id: number;
    name: string;
    warnBeforeDays: number;
    recentlyExpiredDays: number;
    minQuantity: number;
  }> = {},
) {
  return {
    id: 1,
    name: 'Fruits',
    warnBeforeDays: 3,
    recentlyExpiredDays: 1,
    minQuantity: 2,
    ...overrides,
  };
}
