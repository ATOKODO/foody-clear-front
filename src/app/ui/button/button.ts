import { booleanAttribute, ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, input, output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'edit' | 'filled' | 'raised' | 'text' | 'icon' | 'plain';
export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'button[appButton]',
  exportAs: 'appButton',
  template: '<ng-content />',
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[disabled]': 'disabled() || loading()',
    '[type]': 'type()',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '(click)': 'activate($event)',
  },
})
export class UiButton {
  readonly variant = input<ButtonVariant>('secondary');
  readonly size = input<ButtonSize>('medium');
  readonly type = input<ButtonType>('button');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly activated = output<MouseEvent>();
  protected readonly classes = computed(() =>
    `app-ui-button app-ui-button--${this.variant()} app-ui-button--${this.size()}${this.loading() ? ' app-ui-button--loading' : ''}`);

  constructor() {
    const button = inject<ElementRef<HTMLButtonElement>>(ElementRef).nativeElement;
    const blockDisabled = (event: MouseEvent) => {
      if (this.disabled() || this.loading()) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    // Capture also protects consumer handlers from queued or synthetic disabled clicks.
    button.addEventListener('click', blockDisabled, true);
    inject(DestroyRef).onDestroy(() => button.removeEventListener('click', blockDisabled, true));
  }

  protected activate(event: MouseEvent): void {
    if (this.disabled() || this.loading()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    this.activated.emit(event);
  }
}
