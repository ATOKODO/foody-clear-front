import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UiErrorPanel } from '../../app/ui/error-panel/error-panel';
import {
  CategoryForm,
  CategoryFormMode,
  CategoryFormValue,
} from '../../components/category/category-form/category-form';
import {
  CategoryList,
  CategoryListItem,
} from '../../components/category/category-list/category-list';
import {
  Category as CategoryApiModel,
  CategoryService,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../../services/category-service';

@Component({
  selector: 'app-category',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    UiErrorPanel,
    CategoryList,
    CategoryForm,
  ],
  templateUrl: './category.html',
  styleUrl: './category.scss',
})
export class Category implements OnInit {
  @Output() readonly dataChanged = new EventEmitter<void>();

  baseUrl = '';
  loading = false;
  saving = false;

  categories: CategoryApiModel[] = [];

  formVisible = false;
  formMode: CategoryFormMode = 'add';
  editingCategoryId: number | null = null;
  formInitialValue: Partial<CategoryFormValue> | null = null;

  lastResponse: unknown = null;
  lastError: unknown = null;

  constructor(private readonly categorySrv: CategoryService) {}

  ngOnInit(): void {
    this.baseUrl = this.categorySrv.baseUrl;
    this.loadCategories();
  }

  onBaseUrlChange(): void {
    this.categorySrv.setBaseUrl(this.baseUrl);
    this.loadCategories();
  }

  get categoryListItems(): CategoryListItem[] {
    return this.categories.map((category) => ({
      id: String(category.id),
      name: category.name,
      warnBeforeDays: this.normalizeNonNegativeNumber(category.warnBeforeDays),
      recentlyExpiredDays: this.normalizeNonNegativeNumber(category.recentlyExpiredDays),
      minQuantity: this.normalizeNonNegativeNumber(category.minQuantity),
    }));
  }

  onRefreshRequested(): void {
    this.loadCategories();
  }

  onAddRequested(): void {
    this.formMode = 'add';
    this.editingCategoryId = null;
    this.formInitialValue = null;
    this.formVisible = true;
  }

  onEditRequested(item: CategoryListItem): void {
    const categoryId = Number(item.id);
    if (!Number.isInteger(categoryId) || categoryId < 1) {
      return;
    }

    const category = this.categories.find((value) => value.id === categoryId);
    if (!category) {
      return;
    }

    this.formMode = 'edit';
    this.editingCategoryId = category.id;
    this.formInitialValue = this.toFormValue(category);
    this.formVisible = true;
  }

  onDeleteRequested(item: CategoryListItem): void {
    const categoryId = Number(item.id);
    if (!Number.isInteger(categoryId) || categoryId < 1) {
      return;
    }

    this.saving = true;
    this.categorySrv.remove(categoryId).subscribe({
      next: () => {
        this.lastResponse = { deleted: true, id: categoryId };
        this.lastError = null;
        this.saving = false;
        this.dataChanged.emit();

        if (this.editingCategoryId === categoryId) {
          this.onCancelForm();
        }

        this.loadCategories();
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
  }

  onFormSubmitted(event: { mode: CategoryFormMode; value: CategoryFormValue }): void {
    this.saving = true;

    if (event.mode === 'edit' && this.editingCategoryId !== null) {
      const payload = this.toUpdateDto(event.value);
      this.categorySrv.update(this.editingCategoryId, payload).subscribe({
        next: (response) => {
          this.lastResponse = response;
          this.lastError = null;
          this.saving = false;
          this.dataChanged.emit();
          this.onCancelForm();
          this.loadCategories();
        },
        error: (error) => {
          this.lastError = error;
          this.saving = false;
        },
      });
      return;
    }

    const payload = this.toCreateDto(event.value);
    this.categorySrv.create(payload).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.lastError = null;
        this.saving = false;
        this.dataChanged.emit();
        this.onCancelForm();
        this.loadCategories();
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
  }

  onMenuClicked(): void {
    this.lastResponse = {
      info: 'Action menu category-form capturee.',
      at: new Date().toISOString(),
    };
  }

  onCancelForm(): void {
    this.formVisible = false;
    this.formMode = 'add';
    this.editingCategoryId = null;
    this.formInitialValue = null;
  }

  private loadCategories(): void {
    this.loading = true;
    this.categorySrv.findAll().subscribe({
      next: (response) => {
        this.categories = this.extractCategoriesFromResponse(response);
        this.lastResponse = response;
        this.lastError = null;
        this.loading = false;

        if (this.editingCategoryId !== null) {
          const currentCategory =
            this.categories.find((category) => category.id === this.editingCategoryId) ?? null;

          if (!currentCategory) {
            this.onCancelForm();
            return;
          }

          this.formInitialValue = this.toFormValue(currentCategory);
        }
      },
      error: (error) => {
        this.lastError = error;
        this.loading = false;
      },
    });
  }

  private toCreateDto(value: CategoryFormValue): CreateCategoryDto {
    return {
      name: value.name.trim(),
      warnBeforeDays: value.warnBeforeDays,
      recentlyExpiredDays: value.recentlyExpiredDays,
      minQuantity: value.minQuantity,
    };
  }

  private toUpdateDto(value: CategoryFormValue): UpdateCategoryDto {
    return this.toCreateDto(value);
  }

  private toFormValue(category: CategoryApiModel): CategoryFormValue {
    return {
      name: category.name,
      warnBeforeDays: this.normalizeNonNegativeNumber(category.warnBeforeDays) ?? 0,
      recentlyExpiredDays:
        this.normalizeNonNegativeNumber(category.recentlyExpiredDays) ?? 0,
      minQuantity: this.normalizeNonNegativeNumber(category.minQuantity) ?? 0,
    };
  }

  private extractCategoriesFromResponse(value: unknown): CategoryApiModel[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is CategoryApiModel => this.isCategoryLike(item));
    }

    if (this.isCategoryLike(value)) {
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
          this.isCategoryLike(item),
        );
        if (categories.length > 0) {
          return categories;
        }
      }
    }

    return [];
  }

  private isCategoryLike(value: unknown): value is CategoryApiModel {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const category = value as Partial<CategoryApiModel>;
    return typeof category.id === 'number' && typeof category.name === 'string';
  }

  private normalizeNonNegativeNumber(value: unknown): number | null {
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
}
