import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'div[appDateBadge]',
  template: `
    <span class="app-date-badge__label planning-actions-modal__date-label">{{ label() }}</span>
    <span class="app-date-badge__value planning-actions-modal__date-value">{{ value() }}</span>
    @if (detail()) {
      <span class="app-date-badge__detail planning-actions-modal__date-time">{{ detail() }}</span>
    }
  `,
  styleUrl: './date-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'app-date-badge' },
})
export class UiDateBadge {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly detail = input<string | null>(null);
}
