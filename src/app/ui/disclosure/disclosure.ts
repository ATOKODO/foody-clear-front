import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type DisclosureAppearance = 'inline' | 'panel';

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
  readonly appearance = input<DisclosureAppearance>('inline');
}
