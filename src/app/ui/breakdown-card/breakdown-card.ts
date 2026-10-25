import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import type { BreakdownStatus } from '../breakdown-badge/breakdown-badge';

export type BreakdownCardDensity = 'compact' | 'summary';

@Component({
  selector: '[appBreakdownCard]',
  template: '<ng-content />',
  styleUrl: './breakdown-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-breakdown-card',
    '[class.app-breakdown-card--compact]': 'density() === "compact"',
    '[class.app-breakdown-card--summary]': 'density() === "summary"',
    '[class.app-breakdown-card--prominent]': 'prominent()',
    '[class.app-breakdown-card--under]': 'status() === "under"',
    '[class.app-breakdown-card--exact]': 'status() === "exact"',
    '[class.app-breakdown-card--over]': 'status() === "over"',
    '[class.app-breakdown-card--missing]': 'status() === "missing"',
  },
})
export class UiBreakdownCard {
  readonly density = input<BreakdownCardDensity>('compact');
  readonly prominent = input(false, { transform: booleanAttribute });
  readonly status = input<BreakdownStatus>('under');
}
