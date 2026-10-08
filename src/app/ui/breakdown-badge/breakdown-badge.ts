import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';

export type BreakdownBadgeKind = 'meta' | 'overview' | 'status';
export type BreakdownStatus = 'under' | 'exact' | 'over' | 'missing';

@Component({
  selector: 'span[appBreakdownBadge]',
  template: '<ng-content />',
  styleUrl: './breakdown-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
})
export class UiBreakdownBadge {
  readonly kind = input<BreakdownBadgeKind>('meta');
  readonly status = input<BreakdownStatus>('under');
  readonly expanded = input(false, { transform: booleanAttribute });
  protected readonly classes = computed(() =>
    `app-breakdown-badge app-breakdown-badge--${this.kind()} app-breakdown-badge--${this.status()}${this.expanded() ? ' app-breakdown-badge--expanded' : ''}${this.kind() === 'status' ? ' lc-status-' + this.status() : ''}`,
  );
}
