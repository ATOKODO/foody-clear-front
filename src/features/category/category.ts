
import { Component, effect, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { UiErrorPanel } from '../../app/ui/error-panel/error-panel';
import { CategoryForm } from '../../components/category/category-form/category-form';
import { CategoryList } from '../../components/category/category-list/category-list';
import { CategoryStore } from './category.store';

@Component({
  selector: 'app-category',
  imports: [
    MatButtonModule,
    MatCardModule,
    UiErrorPanel,
    CategoryList,
    CategoryForm
],
  providers: [CategoryStore],
  templateUrl: './category.html',
})
export class Category {
  readonly embedded = input(false);
  readonly dataChanged = output<void>();

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
