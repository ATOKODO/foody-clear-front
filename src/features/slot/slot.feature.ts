import { DOCUMENT } from '@angular/common';
import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  SlotForm,
  SlotFormMode,
  SlotFormValue,
} from '../../components/slot/slot-form/slot-form';
import { SlotList, SlotListItem } from '../../components/slot/slot-list/slot-list';
import { UiErrorPanel } from '../../app/ui/error-panel/error-panel';
import { SlotFeatureStore } from './slot.store';

@Component({
  selector: 'app-slot-feature',
  imports: [MatButtonModule, MatCardModule, UiErrorPanel, SlotList, SlotForm],
  providers: [SlotFeatureStore],
  templateUrl: './slot.feature.html',
  styleUrl: './slot.feature.scss',
  host: {
    '(window:resize)': 'onWindowResize()',
  },
})
export class SlotFeature implements OnInit {
  readonly store = inject(SlotFeatureStore);
  private readonly document = inject(DOCUMENT);

  readonly embedded = input(false);
  readonly dataChanged = output<void>();
  readonly embeddedDialogTopOffset = signal(0);

  ngOnInit(): void {
    this.store.refresh();
  }

  get loading(): boolean {
    return this.store.loading;
  }

  get saving(): boolean {
    return this.store.saving;
  }

  get loadingMeta(): boolean {
    return this.store.loadingMeta;
  }

  onWindowResize(): void {
    if (!this.store.formVisible() || !this.embedded()) {
      return;
    }

    this.syncEmbeddedDialogLayout();
  }

  refresh(): void {
    this.store.refresh();
  }

  onAddRequested(): void {
    if (this.store.onAddRequested()) {
      this.syncEmbeddedDialogLayout();
    }
  }

  openCreate(): void {
    this.onAddRequested();
  }

  onEditRequested(item: SlotListItem): void {
    if (this.store.onEditRequested(item)) {
      this.syncEmbeddedDialogLayout();
    }
  }

  onDeleteRequested(item: SlotListItem): void {
    this.store.onDeleteRequested(item, () => this.dataChanged.emit());
  }

  onFormSubmitted(event: { mode: SlotFormMode; value: SlotFormValue }): void {
    this.store.onFormSubmitted(event, () => this.dataChanged.emit());
  }

  onMenuClicked(): void {
    this.store.onMenuClicked();
  }

  onCancelForm(): void {
    this.store.onCancelForm();
  }

  private syncEmbeddedDialogLayout(): void {
    if (!this.embedded()) {
      this.embeddedDialogTopOffset.set(0);
      return;
    }

    const view = this.document.defaultView;
    if (!view) {
      this.embeddedDialogTopOffset.set(0);
      return;
    }

    view.requestAnimationFrame(() => {
      const header = this.document.querySelector('.app-shell__header');
      this.embeddedDialogTopOffset.set(
        header instanceof HTMLElement
          ? Math.ceil(header.getBoundingClientRect().bottom)
          : 0,
      );
    });
  }
}
