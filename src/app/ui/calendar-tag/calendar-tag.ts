import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';

export type CalendarTagVariant = 'year-status' | 'year-chip' | 'month-today' | 'week-today' | 'mobile-today' | 'chip' | 'meta' | 'alert' | 'assignment' | 'source';
export type CalendarTagTone = 'neutral' | 'active' | 'accent' | 'dayset' | 'target' | 'over' | 'projected' | 'template';
export type CalendarTagContext = 'surface' | 'on-color';

@Component({
  selector: 'span[appCalendarTag]',
  template: `
    @if (value() !== null) {
      <span class="app-calendar-tag__value calendar-year-chip__value">{{ value() }}</span>
      <span class="app-calendar-tag__label calendar-year-chip__label">{{ label() }}</span>
    }
    <ng-content />
  `,
  styleUrl: './calendar-tag.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[attr.data-tone]': 'variant() === "alert" ? tone() : null',
  },
})
export class UiCalendarTag {
  readonly variant = input<CalendarTagVariant>('meta');
  readonly tone = input<CalendarTagTone>('neutral');
  readonly context = input<CalendarTagContext>('surface');
  readonly compact = input(false, { transform: booleanAttribute });
  readonly value = input<number | string | null>(null);
  readonly label = input('');
  protected readonly classes = computed(() =>
    `app-calendar-tag app-calendar-tag--${this.variant()} app-calendar-tag--tone-${this.tone()} app-calendar-tag--context-${this.context()}${this.compact() ? ' app-calendar-tag--compact' : ''}`,
  );
}
