import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { UiErrorPanel } from '../../app/ui/error-panel/error-panel';
import { CategoryForm } from '../../components/category/category-form/category-form';
import { CategoryList } from '../../components/category/category-list/category-list';
import { CategoryStore } from './category.store';

@Component({
  selector: 'app-category',
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    UiErrorPanel,
    CategoryList,
    CategoryForm,
  ],
  providers: [CategoryStore],
  templateUrl: './category.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './category.scss',
})
export class Category {
  @Input() embedded = false;
  @Output() readonly dataChanged = new EventEmitter<void>();

  readonly store = inject(CategoryStore);

  private lastEmittedMutationVersion = 0;

  constructor() {
    effect(() => {
      const mutationVersion = this.store.mutationVersion();
      if (mutationVersion === 0 || mutationVersion === this.lastEmittedMutationVersion) {
        return;
      }

      this.lastEmittedMutationVersion = mutationVersion;
      this.dataChanged.emit();
    });
  }

  refresh(): void {
    this.store.refresh();
  }

  openCreate(): void {
    this.store.openCreateForm();
  }
}
