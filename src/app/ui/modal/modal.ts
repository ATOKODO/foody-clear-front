import { DOCUMENT } from '@angular/common';
import { ConfigurableFocusTrap, ConfigurableFocusTrapFactory } from '@angular/cdk/a11y';
import { Overlay } from '@angular/cdk/overlay';
import { AfterViewInit, Directive, ElementRef, Injectable, OnDestroy, inject, input, output } from '@angular/core';

@Injectable({ providedIn: 'root' })
class ModalStack {
  private readonly dialogs: UiModal[] = [];
  private readonly scroll = inject(Overlay).scrollStrategies.block();

  open(dialog: UiModal): void {
    if (this.dialogs.length === 0) this.scroll.enable();
    this.dialogs.push(dialog);
  }

  close(dialog: UiModal): void {
    const index = this.dialogs.indexOf(dialog);
    if (index >= 0) this.dialogs.splice(index, 1);
    if (this.dialogs.length === 0) this.scroll.disable();
  }

  isTop(dialog: UiModal): boolean {
    return this.dialogs.at(-1) === dialog;
  }
}

/** Keyboard and focus behavior for the application's manually rendered dialogs. */
@Directive({
  selector: '[appModal]',
  host: {
    role: 'dialog',
    'aria-modal': 'true',
    tabindex: '-1',
    '(keydown.escape)': 'onEscape($event)',
  },
})
export class UiModal implements AfterViewInit, OnDestroy {
  readonly appModalDisableClose = input(false);
  readonly appModalClose = output<void>();
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly factory = inject(ConfigurableFocusTrapFactory);
  private readonly stack = inject(ModalStack);
  private focusTrap: ConfigurableFocusTrap | null = null;
  private previousFocus: HTMLElement | null = null;

  ngAfterViewInit(): void {
    this.previousFocus = this.document.activeElement as HTMLElement | null;
    this.focusTrap = this.factory.create(this.element);
    this.stack.open(this);
    void this.focusTrap.focusInitialElementWhenReady().then((focused) => {
      if (!focused && this.element.isConnected && this.stack.isTop(this)) this.element.focus();
    });
  }

  onEscape(event: Event): void {
    if (!this.stack.isTop(this)) return;
    event.preventDefault();
    event.stopPropagation();
    if (!this.appModalDisableClose()) this.appModalClose.emit();
  }

  ngOnDestroy(): void {
    this.focusTrap?.destroy();
    this.stack.close(this);
    if (this.previousFocus?.isConnected) this.previousFocus.focus();
  }
}
