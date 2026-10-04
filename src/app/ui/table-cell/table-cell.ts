import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'th[appTableCell], td[appTableCell]',
  template: '<ng-content />',
  styleUrl: './table-cell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'app-ui-table-cell', '[style.text-align]': 'contentAlign()' },
})
export class UiTableCell {
  readonly contentAlign = input<'start' | 'center' | 'end'>('start');
}
