import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type TableDensity = 'compact' | 'standard' | 'comfortable';
export type TableLayout = 'auto' | 'fixed';

@Component({
  selector: 'table[appTable]',
  template: '<ng-content />',
  styleUrl: './table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-ui-table',
    '[style.table-layout]': 'layout()',
    '[style.--app-table-cell-padding]': 'padding()',
  },
})
export class UiTable {
  readonly density = input<TableDensity>('standard');
  readonly layout = input<TableLayout>('auto');
  protected readonly padding = computed(() => ({
    compact: 'var(--app-space-1) var(--app-space-2)',
    standard: 'var(--app-space-2) var(--app-space-3)',
    comfortable: 'var(--app-space-3) var(--app-space-4)',
  })[this.density()]);
}
