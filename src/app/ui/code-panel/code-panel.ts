import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'pre[appCodePanel]',
  template: '<ng-content />',
  styleUrl: './code-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'app-code-panel', tabindex: '0', '[class.app-code-panel--wrap]': 'wrap()' },
})
export class UiCodePanel {
  readonly wrap = input(false, { transform: booleanAttribute });
}
