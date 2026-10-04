import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'div[appTableScroll]',
  template: '<ng-content />',
  styleUrl: './table-scroll.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-ui-table-scroll', role: 'region', tabindex: '0',
    '[attr.aria-label]': 'label()',
    '[class.app-ui-table-scroll--outlined]': 'outlined()',
  },
})
export class UiTableScroll {
  readonly label = input.required<string>();
  readonly outlined = input(true, { transform: booleanAttribute });
}
