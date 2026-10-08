import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'details[appDisclosure]',
  template: '<ng-content />',
  styleUrl: './disclosure.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-ui-disclosure',
    '[class.app-ui-disclosure--panel]': 'appearance() === "panel"',
  },
})
export class UiDisclosure {
  readonly appearance = input<'inline' | 'panel'>('inline');
}
