import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type DisclosureSummarySize = 'small' | 'medium';
export type DisclosureSummaryEmphasis = 'normal' | 'strong';

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
  readonly size = input<DisclosureSummarySize>('medium');
  readonly emphasis = input<DisclosureSummaryEmphasis>('normal');
}
