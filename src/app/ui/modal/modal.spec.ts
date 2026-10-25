import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { UiModal } from './modal';

@Component({
  imports: [UiModal],
  template: `
    <button id="open" (click)="editor = true">Open</button>
    @if (editor) {
      <div appModal [appModalDisableClose]="saving()" (appModalClose)="editor = false">
        @if (showReplaceAction()) {
          <button id="replace-action" (click)="showReplaceAction.set(false)">Open editor</button>
        } @else {
          <input id="editor-input" />
        }
        <button id="picker-open" (click)="picker = true">Choose</button>
      </div>
    }
    @if (picker) {
      <div appModal (appModalClose)="picker = false"><input id="picker-input" /></div>
    }
  `,
})
class ModalHarness {
  editor = false;
  picker = false;
  readonly showReplaceAction = signal(false);
  readonly saving = signal(false);
}

describe('UiModal', () => {
  let fixture: ComponentFixture<ModalHarness>;
  let root: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ModalHarness], providers: [provideZonelessChangeDetection()] }).compileComponents();
    fixture = TestBed.createComponent(ModalHarness);
    root = fixture.nativeElement;
    await fixture.whenStable();
  });

  async function open(id: string): Promise<void> {
    const button = root.querySelector<HTMLButtonElement>(id)!;
    button.focus();
    button.click();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  async function escape(id: string): Promise<void> {
    root.querySelector(id)!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await fixture.whenStable();
  }

  it('restores focus through nested dialogs and keeps the outer editor open', async () => {
    await open('#open');
    await open('#picker-open');
    expect(document.activeElement).toBe(root.querySelector('#picker-input'));
    await escape('#picker-input');
    expect(fixture.componentInstance.picker).toBeFalse();
    expect(fixture.componentInstance.editor).toBeTrue();
    expect(document.activeElement).toBe(root.querySelector('#picker-open'));
    await escape('#editor-input');
    expect(fixture.componentInstance.editor).toBeFalse();
    expect(document.activeElement).toBe(root.querySelector('#open'));
  });

  it('keeps the dialog open while saving, then allows Escape again', async () => {
    await open('#open');
    fixture.componentInstance.saving.set(true);
    await fixture.whenStable();
    expect((fixture.debugElement.query(By.directive(UiModal)).injector.get(UiModal)).appModalDisableClose()).toBeTrue();
    await escape('#editor-input');
    expect(fixture.componentInstance.editor).toBeTrue();
    fixture.componentInstance.saving.set(false);
    await fixture.whenStable();
    await escape('#editor-input');
    expect(fixture.componentInstance.editor).toBeFalse();
  });

  it('moves focus into replacement dialog content when the active control is removed', async () => {
    await open('#open');
    fixture.componentInstance.showReplaceAction.set(true);
    await fixture.whenStable();
    const action = root.querySelector<HTMLButtonElement>('#replace-action')!;
    action.focus();
    action.click();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(document.activeElement).toBe(root.querySelector('#editor-input'));
    await escape('#editor-input');
    expect(fixture.componentInstance.editor).toBeFalse();
    expect(document.activeElement).toBe(root.querySelector('#open'));
  });
});
