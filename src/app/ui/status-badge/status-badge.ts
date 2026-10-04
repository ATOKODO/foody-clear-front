import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StatusTone = 'neutral' | 'saving' | 'warning' | 'info' | 'success';

@Component({
  selector: 'span[appStatusBadge]',
  template: '<ng-content />',
  styleUrl: './status-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
})
export class UiStatusBadge {
  readonly tone = input<StatusTone>('neutral');
  protected readonly classes = computed(() => `app-status-pill app-status-pill--${this.tone()}`);
}
