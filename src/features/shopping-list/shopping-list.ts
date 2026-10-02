import { UiModal } from '../../app/ui/modal/modal';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UiErrorPanel } from '../../app/ui/error-panel/error-panel';
import { SegmentedToggle } from '../../app/ui/segmented-toggle/segmented-toggle';
import { ProductList } from '../../components/product/product-list/product-list';
import { MasterDetailLayout } from '../../components/shared/master-detail-layout/master-detail-layout';
import { ShoppingListStore } from './shopping-list.store';

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [UiModal,
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ProductList,
    MasterDetailLayout,
    SegmentedToggle,
    UiErrorPanel,
  ],
  providers: [ShoppingListStore],
  templateUrl: './shopping-list.html',
  styleUrl: './shopping-list.scss',
  host: {
  },
})
export class ShoppingList implements OnInit {
  readonly store = inject(ShoppingListStore);

  ngOnInit(): void {
    this.store.init();
  }

  onEscapeKey(): void {
    this.store.onEscapeKey();
  }
}
