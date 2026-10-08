import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StatusTone = 'neutral' | 'saving' | 'warning' | 'info' | 'success' | 'danger';
export type BadgeSize = 'medium' | 'small' | 'compact' | 'card' | 'counter' | 'chip' | 'marker';
export type BadgeEmphasis = 'normal' | 'medium' | 'semibold' | 'strong' | 'heavy';
export type BadgeAppearance = 'outlined' | 'soft' | 'bare';

@Component({
  selector: 'span[appStatusBadge], em[appStatusBadge]',
  template: '<ng-content />',
  styleUrl: './status-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
})
export class UiStatusBadge {
  readonly tone = input<StatusTone>('neutral');
  readonly size = input<BadgeSize>('medium');
  readonly emphasis = input<BadgeEmphasis>('strong');
  readonly appearance = input<BadgeAppearance>('outlined');
  protected readonly classes = computed(() =>
    `app-status-pill app-status-pill--${this.tone()} app-status-pill--${this.size()} app-status-pill--weight-${this.emphasis()} app-status-pill--appearance-${this.appearance()}`,
  );
}
