import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'summary[appDisclosureSummary]',
  template: '<ng-content />',
  styleUrl: './disclosure-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-ui-disclosure-summary',
    '[class.app-ui-disclosure-summary--compact]': 'size() === "small"',
    '[class.app-ui-disclosure-summary--strong]': 'emphasis() === "strong"',
  },
})
export class UiDisclosureSummary {
  readonly size = input<'small' | 'medium'>('medium');
  readonly emphasis = input<'normal' | 'strong'>('normal');
}
