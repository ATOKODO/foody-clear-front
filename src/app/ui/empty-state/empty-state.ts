import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type EmptyStateAppearance = 'text' | 'panel' | 'large';
export type EmptyStateSize = 'small' | 'medium';
export type EmptyStateTone = 'muted' | 'contextual';

@Component({
  selector: 'p[appEmptyState], div[appEmptyState]',
  template: '<ng-content />',
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
})
export class UiEmptyState {
  readonly appearance = input<EmptyStateAppearance>('text');
  readonly size = input<EmptyStateSize>('medium');
  readonly tone = input<EmptyStateTone>('muted');
  protected readonly classes = computed(() => `app-ui-empty-state app-ui-empty-state--${this.appearance()} app-ui-empty-state--${this.size()} app-ui-empty-state--${this.tone()}`);
}
