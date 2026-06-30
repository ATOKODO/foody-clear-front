import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, catchError, exhaustMap, pipe, switchMap, tap } from 'rxjs';
import {
  CategoryFormMode,
  CategoryFormValue,
} from '../../components/category/category-form/category-form';
import { CategoryListItem } from '../../components/category/category-list/category-list';
import {
  Category as CategoryApiModel,
  CategoryService,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../../services/category-service';

interface CategoryState {
  categories: CategoryApiModel[];
  loading: boolean;
  saving: boolean;
  lastError: unknown;
  formVisible: boolean;
  formMode: CategoryFormMode;
  editingCategoryId: number | null;
  formInitialValue: Partial<CategoryFormValue> | null;
  mutationVersion: number;
}

interface CategoryFormSubmission {
  mode: CategoryFormMode;
  value: CategoryFormValue;
}

const initialState: CategoryState = {
  categories: [],
  loading: false,
  saving: false,
  lastError: null,
  formVisible: false,
  formMode: 'add',
  editingCategoryId: null,
  formInitialValue: null,
  mutationVersion: 0,
};

export const CategoryStore = signalStore(
  withState(initialState),
  withComputed((store) => ({
    categoryListItems: computed(() => toCategoryListItems(store.categories())),
    dialogTitle: computed(() =>
      store.formMode() === 'edit' ? 'Modifier une categorie' : 'Ajouter une categorie',
    ),
    dialogSubtitle: computed(
      () =>
        'Regle les alertes, la fraicheur recente et le seuil minimum pour cette categorie.',
    ),
    isEditing: computed(
      () => store.formMode() === 'edit' && store.editingCategoryId() !== null,
    ),
    hasError: computed(() => store.lastError() !== null),
  })),
  withMethods((store, categoryService = inject(CategoryService)) => {
    const loadCategories = rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, lastError: null })),
        switchMap(() =>
          categoryService.findAll().pipe(
            tap({
              next: (response) => {
                const categories = extractCategoriesFromResponse(response);
                patchState(store, {
                  categories,
                  loading: false,
                  lastError: null,
                  ...syncEditingState(categories, store.editingCategoryId()),
                });
              },
              error: (error) => patchState(store, { loading: false, lastError: error }),
            }),
            catchError(() => EMPTY),
          ),
        ),
      ),
    );

    const submitCategoryForm = rxMethod<CategoryFormSubmission>(
      pipe(
        tap(() => patchState(store, { saving: true, lastError: null })),
        exhaustMap((event) => {
          const editingCategoryId = store.editingCategoryId();
          const request$ =
            event.mode === 'edit' && editingCategoryId !== null
              ? categoryService.update(editingCategoryId, toUpdateDto(event.value))
              : categoryService.create(toCreateDto(event.value));

          return request$.pipe(
            tap({
              next: () => {
                patchState(store, (state) => ({
                  ...resetFormState(),
                  saving: false,
                  lastError: null,
                  mutationVersion: state.mutationVersion + 1,
                }));
                loadCategories();
              },
              error: (error) => patchState(store, { saving: false, lastError: error }),
            }),
            catchError(() => EMPTY),
          );
        }),
      ),
    );

    const deleteCategory = rxMethod<CategoryListItem>(
      pipe(
        tap(() => patchState(store, { saving: true, lastError: null })),
        exhaustMap((item) => {
          const categoryId = toCategoryId(item);
          if (categoryId === null) {
            patchState(store, { saving: false });
            return EMPTY;
          }

          return categoryService.remove(categoryId).pipe(
            tap({
              next: () => {
                patchState(store, (state) => ({
                  saving: false,
                  lastError: null,
                  mutationVersion: state.mutationVersion + 1,
                  ...(state.editingCategoryId === categoryId ? resetFormState() : {}),
                }));
                loadCategories();
              },
              error: (error) => patchState(store, { saving: false, lastError: error }),
            }),
            catchError(() => EMPTY),
          );
        }),
      ),
    );

    return {
      load: loadCategories,
      refresh(): void {
        loadCategories();
      },
      openCreateForm(): void {
        patchState(store, {
          ...resetFormState(),
          formVisible: true,
        });
      },
      openEditForm(item: CategoryListItem): void {
        const categoryId = toCategoryId(item);
        if (categoryId === null) {
          return;
        }

        const category = store.categories().find((value) => value.id === categoryId);
        if (!category) {
          return;
        }

        patchState(store, {
          formVisible: true,
          formMode: 'edit',
          editingCategoryId: category.id,
          formInitialValue: toFormValue(category),
        });
      },
      submitForm: submitCategoryForm,
      deleteCategory,
      cancelForm(): void {
        patchState(store, resetFormState());
      },
    };
  }),
  withHooks({
    onInit(store) {
      store.load();
    },
  }),
);

function toCategoryListItems(categories: CategoryApiModel[]): CategoryListItem[] {
  return categories.map((category) => ({
    id: String(category.id),
    name: category.name,
    warnBeforeDays: normalizeNonNegativeNumber(category.warnBeforeDays),
    recentlyExpiredDays: normalizeNonNegativeNumber(category.recentlyExpiredDays),
    minQuantity: normalizeNonNegativeNumber(category.minQuantity),
  }));
}

function resetFormState(): Pick<
  CategoryState,
  'formVisible' | 'formMode' | 'editingCategoryId' | 'formInitialValue'
> {
  return {
    formVisible: false,
    formMode: 'add',
    editingCategoryId: null,
    formInitialValue: null,
  };
}

function syncEditingState(
  categories: CategoryApiModel[],
  editingCategoryId: number | null,
): Partial<CategoryState> {
  if (editingCategoryId === null) {
    return {};
  }

  const currentCategory =
    categories.find((category) => category.id === editingCategoryId) ?? null;

  if (!currentCategory) {
    return resetFormState();
  }

  return {
    formInitialValue: toFormValue(currentCategory),
  };
}

function toCreateDto(value: CategoryFormValue): CreateCategoryDto {
  return {
    name: value.name.trim(),
    warnBeforeDays: value.warnBeforeDays,
    recentlyExpiredDays: value.recentlyExpiredDays,
    minQuantity: value.minQuantity,
  };
}

function toUpdateDto(value: CategoryFormValue): UpdateCategoryDto {
  return toCreateDto(value);
}

function toFormValue(category: CategoryApiModel): CategoryFormValue {
  return {
    name: category.name,
    warnBeforeDays: normalizeNonNegativeNumber(category.warnBeforeDays) ?? 0,
    recentlyExpiredDays: normalizeNonNegativeNumber(category.recentlyExpiredDays) ?? 0,
    minQuantity: normalizeNonNegativeNumber(category.minQuantity) ?? 0,
  };
}

function extractCategoriesFromResponse(value: unknown): CategoryApiModel[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is CategoryApiModel => isCategoryLike(item));
  }

  if (isCategoryLike(value)) {
    return [value];
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  const raw = value as Record<string, unknown>;
  const nestedCandidates = ['data', 'items', 'categories', 'results', 'payload'];
  for (const key of nestedCandidates) {
    const nested = raw[key];
    if (Array.isArray(nested)) {
      const categories = nested.filter((item): item is CategoryApiModel =>
        isCategoryLike(item),
      );
      if (categories.length > 0) {
        return categories;
      }
    }
  }

  return [];
}

function isCategoryLike(value: unknown): value is CategoryApiModel {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const category = value as Partial<CategoryApiModel>;
  return typeof category.id === 'number' && typeof category.name === 'string';
}

function normalizeNonNegativeNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed === '') {
    return null;
  }

  const parsedValue = Number(trimmed);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : null;
}

function toCategoryId(item: CategoryListItem): number | null {
  const categoryId = Number(item.id);
  return Number.isInteger(categoryId) && categoryId > 0 ? categoryId : null;
}
